import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, MAIN_EVENTS } from '../main/types/ipc'
import type {
  TranscribeAudioPayload,
  TranscribeAudioResult,
  AutoTypePayload,
  AutoTypeResult,
  AppSettings,
  StateChangedPayload
} from '../main/types/ipc'

const api = {
  transcribeAudio: (payload: TranscribeAudioPayload): Promise<TranscribeAudioResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.TRANSCRIBE_AUDIO, payload),

  recordingStarted: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.RECORDING_STARTED),

  recordingCancelled: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.RECORDING_CANCELLED),

  autoType: (payload: AutoTypePayload): Promise<AutoTypeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTO_TYPE, payload),

  copyToClipboard: (text: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.COPY_TO_CLIPBOARD, text),

  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),

  setSettings: (partial: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_SETTINGS, partial),

  notifyStateChanged: (payload: StateChangedPayload): void =>
    ipcRenderer.send(MAIN_EVENTS.STATE_CHANGED, payload),

  hideWindow: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.HIDE_WINDOW),

  onHotkeyPress: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on(MAIN_EVENTS.HOTKEY_PRESS, listener)
    return () => ipcRenderer.removeListener(MAIN_EVENTS.HOTKEY_PRESS, listener)
  },

  onHotkeyRelease: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on(MAIN_EVENTS.HOTKEY_RELEASE, listener)
    return () => ipcRenderer.removeListener(MAIN_EVENTS.HOTKEY_RELEASE, listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}
