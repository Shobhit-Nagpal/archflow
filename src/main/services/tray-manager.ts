import { Tray, Menu, nativeImage, app } from 'electron'
import type { BrowserWindow } from 'electron'
import type { DictationState } from '../types/ipc'

// Minimal 16x16 data-URL icons — replace with real assets later
const ICON_IDLE = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAASElEQVQ4jWNgGAWDHfwnIBcgZsD/AwT/B2LiBFAZEAAAAABJRU5ErkJggg==`
const ICON_RECORDING = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAASElEQVQ4jWNgGAX/BwAAAgABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfAAAAAAAAAAAAAAAAAAAAAAAA5gwCRwAAAABJRU5ErkJggg==`

export class TrayManager {
  private tray: Tray | null = null

  init(mainWindow: BrowserWindow): void {
    const icon = nativeImage.createFromDataURL(ICON_IDLE).resize({ width: 16, height: 16 })
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
    const dataUrl = state === 'recording' || state === 'transcribing' ? ICON_RECORDING : ICON_IDLE
    const icon = nativeImage.createFromDataURL(dataUrl).resize({ width: 16, height: 16 })
    this.tray.setImage(icon)
    this.tray.setToolTip(`archflow — ${state}`)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
}
