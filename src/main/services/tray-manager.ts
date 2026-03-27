import { join } from 'path'
import { Tray, Menu, nativeImage, app } from 'electron'
import type { BrowserWindow } from 'electron'
import type { DictationState } from '../types/ipc'

function iconPath(name: string): string {
  return join(app.getAppPath(), 'resources', name)
}

export class TrayManager {
  private tray: Tray | null = null

  init(mainWindow: BrowserWindow): void {
    const icon = nativeImage.createFromPath(iconPath('icon.png'))
    this.tray = new Tray(icon)
    this.tray.setToolTip('archflow')

    const menu = Menu.buildFromTemplate([
      {
        label: 'Show / Hide',
        click: () => (mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show())
      },
      { type: 'separator' },
      { label: 'Quit', click: () => { mainWindow.destroy(); app.quit() } }
    ])

    this.tray.setContextMenu(menu)

    this.tray.on('click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    })
  }

  setState(state: DictationState): void {
    if (!this.tray) return
    const name = state === 'recording' || state === 'transcribing' ? 'icon-recording.png' : 'icon.png'
    const icon = nativeImage.createFromPath(iconPath(name))
    this.tray.setImage(icon)
    this.tray.setToolTip(`archflow — ${state}`)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
}
