import React, { useReducer, useEffect, useRef, useCallback } from 'react'
import { useAudioRecorder } from './useAudioRecorder'
import type { DictationState } from '../../../main/types/ipc'

interface DictationStateData {
  status: DictationState
  transcript: string | null
  error: string | null
}

type Action =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'TRANSCRIPTION_SUCCESS'; transcript: string }
  | { type: 'TRANSCRIPTION_ERROR'; error: string }
  | { type: 'DISMISS' }

function reducer(state: DictationStateData, action: Action): DictationStateData {
  switch (action.type) {
    case 'START_RECORDING':
      if (state.status !== 'idle' && state.status !== 'result' && state.status !== 'error') {
        return state
      }
      return { status: 'recording', transcript: null, error: null }
    case 'STOP_RECORDING':
      if (state.status !== 'recording') return state
      return { ...state, status: 'transcribing' }
    case 'TRANSCRIPTION_SUCCESS':
      return { status: 'result', transcript: action.transcript, error: null }
    case 'TRANSCRIPTION_ERROR':
      return { status: 'error', transcript: null, error: action.error }
    case 'DISMISS':
      return { status: 'idle', transcript: null, error: null }
    default:
      return state
  }
}

export interface UseDictation {
  status: DictationState
  transcript: string | null
  error: string | null
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  startRecording(): void
  stopRecording(): void
  cancelRecording(): void
  dismiss(): void
}

export function useDictation(): UseDictation {
  const [state, dispatch] = useReducer(reducer, {
    status: 'idle',
    transcript: null,
    error: null
  })

  const recorder = useAudioRecorder()
  const statusRef = useRef(state.status)
  statusRef.current = state.status

  // Notify main process of state changes for tray icon updates
  useEffect(() => {
    window.api.notifyStateChanged({
      state: state.status,
      transcript: state.transcript ?? undefined,
      error: state.error ?? undefined
    })

    if (state.status === 'result') {
      dispatch({ type: 'DISMISS' })
      window.api.hideWindow()
    }

    // Hide window when returning to idle from error dismiss
    if (state.status === 'idle') {
      window.api.hideWindow()
    }

    return undefined
  }, [state.status, state.transcript, state.error])

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      await recorder.start()
      dispatch({ type: 'START_RECORDING' })
      await window.api.recordingStarted()
    } catch (err) {
      dispatch({
        type: 'TRANSCRIPTION_ERROR',
        error: err instanceof Error ? err.message : 'Failed to start recording'
      })
    }
  }, [recorder])

  const stopRecording = useCallback(async (): Promise<void> => {
    if (statusRef.current !== 'recording') return
    dispatch({ type: 'STOP_RECORDING' })

    try {
      const audio = await recorder.stop()
      const result = await window.api.transcribeAudio(audio)
      dispatch({ type: 'TRANSCRIPTION_SUCCESS', transcript: result.transcript })

      const settings = await window.api.getSettings()
      if (settings.autoTypeEnabled) {
        const typeResult = await window.api.autoType({ text: result.transcript, force: false })
        if (!typeResult.success) {
          dispatch({ type: 'TRANSCRIPTION_ERROR', error: `Auto-type failed: ${typeResult.error}` })
          return
        }
      }
    } catch (err) {
      dispatch({
        type: 'TRANSCRIPTION_ERROR',
        error: err instanceof Error ? err.message : 'Transcription failed'
      })
    }
  }, [recorder])

  const cancelRecording = useCallback((): void => {
    recorder.cancel()
    window.api.recordingCancelled()
    dispatch({ type: 'DISMISS' })
  }, [recorder])

  const dismiss = useCallback((): void => {
    dispatch({ type: 'DISMISS' })
    window.api.hideWindow()
  }, [])

  // Listen for hotkey press/release from main
  useEffect(() => {
    const unsubPress = window.api.onHotkeyPress(() => startRecording())
    const unsubRelease = window.api.onHotkeyRelease(() => stopRecording())
    return () => {
      unsubPress()
      unsubRelease()
    }
  }, [startRecording, stopRecording])

  return {
    status: state.status,
    transcript: state.transcript,
    error: state.error,
    analyserRef: recorder.analyserRef,
    startRecording,
    stopRecording,
    cancelRecording,
    dismiss
  }
}
