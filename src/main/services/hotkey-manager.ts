import { uIOhook, UiohookKey } from 'uiohook-napi'
import type { BrowserWindow } from 'electron'
import { MAIN_EVENTS } from '../types/ipc'

export class HotkeyManager {
  private isRecording = false

  start(mainWindow: BrowserWindow): void {
    uIOhook.on('keydown', (e) => {
      if (e.keycode === UiohookKey.Space && e.ctrlKey && e.shiftKey && !this.isRecording) {
        this.isRecording = true
        mainWindow.show()
        mainWindow.webContents.send(MAIN_EVENTS.HOTKEY_PRESS)
      }
    })

    uIOhook.on('keyup', (e) => {
      // Stop on space release OR if ctrl/shift is released mid-recording
      if (this.isRecording && e.keycode === UiohookKey.Space) {
        this.isRecording = false
        mainWindow.webContents.send(MAIN_EVENTS.HOTKEY_RELEASE)
      }
    })

    uIOhook.start()
  }

  stop(): void {
    uIOhook.stop()
  }

  // kept for compat — no longer needed with uiohook
  unregisterAll(): void {
    this.stop()
  }
}
