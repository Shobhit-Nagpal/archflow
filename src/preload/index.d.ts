import type {
  TranscribeAudioPayload,
  TranscribeAudioResult,
  AutoTypePayload,
  AutoTypeResult,
  AppSettings,
  StateChangedPayload
} from '../main/types/ipc'

declare global {
  interface Window {
    api: {
      transcribeAudio(payload: TranscribeAudioPayload): Promise<TranscribeAudioResult>
      recordingStarted(): Promise<void>
      recordingCancelled(): Promise<void>
      autoType(payload: AutoTypePayload): Promise<AutoTypeResult>
      copyToClipboard(text: string): Promise<void>
      getSettings(): Promise<AppSettings>
      setSettings(partial: Partial<AppSettings>): Promise<void>
      notifyStateChanged(payload: StateChangedPayload): void
      hideWindow(): Promise<void>
      onHotkeyPress(cb: () => void): () => void
      onHotkeyRelease(cb: () => void): () => void
    }
  }
}
