import { execSync } from 'child_process'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import type { BrowserWindow } from 'electron'
import { MAIN_EVENTS } from '../types/ipc'

export class HotkeyManager {
  private lastFocusedWindowId: string | null = null
  private isRecording = false

  start(mainWindow: BrowserWindow): void {
    uIOhook.on('keydown', (e) => {
      if (e.keycode === UiohookKey.Space && e.ctrlKey && e.shiftKey && !this.isRecording) {
        this.isRecording = true
        this.snapshotFocusedWindow()
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

  snapshotFocusedWindow(): void {
    try {
      const id = execSync('xdotool getactivewindow', { timeout: 100 }).toString().trim()
      this.lastFocusedWindowId = id || null
    } catch {
      this.lastFocusedWindowId = null
    }
  }

  getLastFocusedWindowId(): string | null {
    return this.lastFocusedWindowId
  }

  // kept for compat — no longer needed with uiohook
  unregisterAll(): void {
    this.stop()
  }
}
