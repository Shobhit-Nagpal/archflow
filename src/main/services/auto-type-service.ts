import { execSync, spawn } from 'child_process'
import type { AutoTypeResult, AutoTypeTool } from '../types/ipc'

function spawnAsync(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args)
    let stderr = ''
    proc.stderr?.on('data', (d: Buffer) => (stderr += d.toString()))
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}: ${stderr.trim()}`))
    })
    proc.on('error', (err) =>
      reject(new Error(`Failed to spawn '${cmd}': ${err.message}. Is it installed?`))
    )
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export class AutoTypeService {
  async type(text: string, windowId: string | null, tool: AutoTypeTool): Promise<AutoTypeResult> {
    try {
      if (tool === 'xdotool') {
        if (windowId) {
          execSync(`xdotool windowfocus --sync ${windowId}`)
          // Give the WM a moment to actually shift focus before typing
          await sleep(100)
        }
        // --delay 30: slight inter-key delay improves reliability in some apps
        await spawnAsync('xdotool', ['type', '--clearmodifiers', '--delay', '30', '--', text])
      } else {
        // ydotool operates at evdev level — no window focus needed
        await spawnAsync('ydotool', ['type', '--key-delay', '30', '--', text])
      }
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      console.error('[AutoTypeService] Failed to type text:', error)
      return { success: false, error }
    }
  }
}
