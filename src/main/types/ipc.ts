export const IPC_CHANNELS = {
  TRANSCRIBE_AUDIO: 'dictation:transcribe-audio',
  RECORDING_STARTED: 'dictation:recording-started',
  RECORDING_CANCELLED: 'dictation:recording-cancelled',
  AUTO_TYPE: 'dictation:auto-type',
  GET_SETTINGS: 'settings:get',
  SET_SETTINGS: 'settings:set',
  COPY_TO_CLIPBOARD: 'app:copy-to-clipboard',
  HIDE_WINDOW: 'app:hide-window'
} as const

export const MAIN_EVENTS = {
  HOTKEY_PRESS: 'dictation:hotkey-press',
  HOTKEY_RELEASE: 'dictation:hotkey-release',
  STATE_CHANGED: 'dictation:state-changed'
} as const

export interface TranscribeAudioPayload {
  wavBuffer: ArrayBuffer
  sampleRate: number
  durationSeconds: number
}

export interface TranscribeAudioResult {
  transcript: string
  confidence: number
  elapsedMs: number
}

export interface AutoTypePayload {
  text: string
  force: boolean
}

export interface AutoTypeResult {
  success: boolean
  error?: string
}

export type WhisperBackend = 'mock' | 'openai-api' | 'whisper-cpp' | 'faster-whisper'

export interface AppSettings {
  autoTypeEnabled: boolean
  hotkey: string
  whisperBackend: WhisperBackend
  openaiApiKey?: string
  // whisper.cpp: path to binary (defaults to 'whisper-cpp' if on PATH) and model file
  whisperCppBinary?: string
  whisperCppModelPath?: string
  fasterWhisperModelPath?: string
}

export type DictationState = 'idle' | 'recording' | 'transcribing' | 'result' | 'error'

export interface StateChangedPayload {
  state: DictationState
  transcript?: string
  error?: string
}
