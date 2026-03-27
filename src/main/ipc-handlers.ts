import { ipcMain, clipboard } from 'electron'
import type { BrowserWindow } from 'electron'
import { IPC_CHANNELS, MAIN_EVENTS } from './types/ipc'
import type {
  TranscribeAudioPayload,
  AutoTypePayload,
  AppSettings,
  StateChangedPayload
} from './types/ipc'
import type { TranscriptionService } from './services/transcription-service'
import type { AutoTypeService } from './services/auto-type-service'
import type { HotkeyManager } from './services/hotkey-manager'
import type { SettingsStore } from './services/settings-store'
import type { TrayManager } from './services/tray-manager'

export function registerIpcHandlers(
  mainWindow: BrowserWindow,
  transcriptionService: TranscriptionService,
  autoTypeService: AutoTypeService,
  hotkeyManager: HotkeyManager,
  settingsStore: SettingsStore,
  trayManager: TrayManager
): void {
  ipcMain.handle(IPC_CHANNELS.TRANSCRIBE_AUDIO, async (_e, payload: TranscribeAudioPayload) => {
    return transcriptionService.transcribe(payload)
  })

  ipcMain.handle(IPC_CHANNELS.RECORDING_STARTED, () => {
    // Fallback focus capture for manual (non-hotkey) recording start
    hotkeyManager.snapshotFocusedWindow()
  })

  ipcMain.handle(IPC_CHANNELS.RECORDING_CANCELLED, () => {
    // Nothing to do on main side for now
  })

  ipcMain.handle(IPC_CHANNELS.AUTO_TYPE, async (_e, payload: AutoTypePayload) => {
    const settings = settingsStore.get()
    const windowId = hotkeyManager.getLastFocusedWindowId()
    return autoTypeService.type(payload.text, windowId, settings.autoTypeTool)
  })

  ipcMain.handle(IPC_CHANNELS.COPY_TO_CLIPBOARD, (_e, text: string) => {
    clipboard.writeText(text)
  })

  ipcMain.handle(IPC_CHANNELS.HIDE_WINDOW, () => {
    mainWindow.hide()
  })

  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => settingsStore.get())

  ipcMain.handle(IPC_CHANNELS.SET_SETTINGS, (_e, partial: Partial<AppSettings>) => {
    settingsStore.set(partial)
    const settings = settingsStore.get()
    transcriptionService.reloadBackend(settings)
  })

  // Relay state changes from renderer to tray
  ipcMain.on(MAIN_EVENTS.STATE_CHANGED, (_e, payload: StateChangedPayload) => {
    trayManager.setState(payload.state)
    // Auto-show window when recording starts, keep visible for result
    if (payload.state === 'recording' || payload.state === 'transcribing') {
      mainWindow.show()
    }
  })
}
