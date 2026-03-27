import * as robot from '@jitsi/robotjs'
import type { AutoTypeResult } from '../types/ipc'

// Use a moderate inter-key delay for reliability across apps
robot.setKeyboardDelay(30)

export class AutoTypeService {
  async type(text: string): Promise<AutoTypeResult> {
    try {
      robot.typeString(text)
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      console.error('[AutoTypeService] Failed to type text:', error)
      return { success: false, error }
    }
  }
}
