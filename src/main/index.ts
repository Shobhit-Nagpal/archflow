import { app } from 'electron'
import { uIOhook } from 'uiohook-napi'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './services/window-manager'
import { TrayManager } from './services/tray-manager'
import { HotkeyManager } from './services/hotkey-manager'
import { TranscriptionService } from './services/transcription-service'
import { AutoTypeService } from './services/auto-type-service'
import { SettingsStore } from './services/settings-store'
import { registerIpcHandlers } from './ipc-handlers'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.archflow')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const settingsStore = new SettingsStore()
  const settings = settingsStore.get()

  const mainWindow = createMainWindow()
  const trayManager = new TrayManager()
  const hotkeyManager = new HotkeyManager()
  const transcriptionService = new TranscriptionService(settings)
  const autoTypeService = new AutoTypeService()

  trayManager.init(mainWindow)
  registerIpcHandlers(
    mainWindow,
    transcriptionService,
    autoTypeService,
    settingsStore,
    trayManager
  )

  hotkeyManager.start(mainWindow)

  app.on('activate', () => {
    mainWindow.show()
  })
})

app.on('will-quit', () => {
  uIOhook.stop()
})

// Keep alive — never quit when all windows closed (tray app)
app.on('window-all-closed', () => {
  // intentionally empty
})
