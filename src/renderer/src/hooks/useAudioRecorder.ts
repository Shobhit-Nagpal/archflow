import { useRef, useCallback } from 'react'
import { encodeWav } from '../utils/wav-encoder'

const SAMPLE_RATE = 16000 // Whisper expects 16 kHz

export interface AudioRecorderResult {
  wavBuffer: ArrayBuffer
  sampleRate: number
  durationSeconds: number
}

export interface UseAudioRecorder {
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  start(): Promise<void>
  stop(): Promise<AudioRecorderResult>
  cancel(): void
}

export function useAudioRecorder(): UseAudioRecorder {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Float32Array[]>([])
  const startTimeRef = useRef<number>(0)

  const start = useCallback(async (): Promise<void> => {
    chunksRef.current = []
    startTimeRef.current = Date.now()

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    streamRef.current = stream

    const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE })
    audioCtxRef.current = audioCtx

    const source = audioCtx.createMediaStreamSource(stream)
    sourceRef.current = source

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.8
    analyserRef.current = analyser

    const processor = audioCtx.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0)
      chunksRef.current.push(new Float32Array(input))
    }

    source.connect(analyser)
    source.connect(processor)
    processor.connect(audioCtx.destination)
  }, [])

  const stop = useCallback(async (): Promise<AudioRecorderResult> => {
    const durationSeconds = (Date.now() - startTimeRef.current) / 1000

    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    await audioCtxRef.current?.close()

    processorRef.current = null
    sourceRef.current = null
    analyserRef.current = null
    streamRef.current = null
    audioCtxRef.current = null

    const totalSamples = chunksRef.current.reduce((n, c) => n + c.length, 0)
    const merged = new Float32Array(totalSamples)
    let offset = 0
    for (const chunk of chunksRef.current) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    chunksRef.current = []

    const wavBuffer = encodeWav(merged, SAMPLE_RATE)
    return { wavBuffer, sampleRate: SAMPLE_RATE, durationSeconds }
  }, [])

  const cancel = useCallback((): void => {
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close()

    processorRef.current = null
    sourceRef.current = null
    analyserRef.current = null
    streamRef.current = null
    audioCtxRef.current = null
    chunksRef.current = []
  }, [])

  return { analyserRef, start, stop, cancel }
}
