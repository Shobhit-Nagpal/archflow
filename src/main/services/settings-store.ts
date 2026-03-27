import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { AppSettings } from '../types/ipc'

const DEFAULT_SETTINGS: AppSettings = {
  autoTypeEnabled: true,
  hotkey: 'CommandOrControl+Shift+Space',
  whisperBackend: 'whisper-cpp',
  autoTypeTool: 'xdotool'
}

export class SettingsStore {
  private settings: AppSettings
  private filePath: string

  constructor() {
    this.filePath = join(app.getAppPath(), 'app-settings.json')
    this.settings = this.load()
  }

  private load(): AppSettings {
    if (!existsSync(this.filePath)) {
      return { ...DEFAULT_SETTINGS }
    }
    try {
      const raw = readFileSync(this.filePath, 'utf-8')
      const saved = JSON.parse(raw) as Partial<AppSettings>
      return { ...DEFAULT_SETTINGS, ...saved }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  private persist(): void {
    writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2), 'utf-8')
  }

  get(): AppSettings {
    return { ...this.settings }
  }

  set(partial: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...partial }
    this.persist()
  }
}
