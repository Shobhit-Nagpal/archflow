import { spawn } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { TranscribeAudioPayload, TranscribeAudioResult, AppSettings } from '../types/ipc'

interface TranscriptionBackend {
  transcribe(wavBuffer: Buffer, sampleRate: number): Promise<TranscribeAudioResult>
}

const MOCK_PHRASES = [
  'The quick brown fox jumps over the lazy dog.',
  'Open the terminal and run the build script.',
  'Schedule a meeting for tomorrow at three pm.',
  'Add error handling to the transcription service.',
  'This is a mock transcription result for testing.'
]

class MockBackend implements TranscriptionBackend {
  async transcribe(_wav: Buffer, _sampleRate: number): Promise<TranscribeAudioResult> {
    const start = Date.now()
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))
    const transcript = MOCK_PHRASES[Math.floor(Math.random() * MOCK_PHRASES.length)]
    return { transcript, confidence: 1.0, elapsedMs: Date.now() - start }
  }
}

// Placeholder — wire up when backend is chosen
class OpenAIBackend implements TranscriptionBackend {
  constructor(_apiKey: string) {}
  async transcribe(_wav: Buffer, _sampleRate: number): Promise<TranscribeAudioResult> {
    throw new Error('OpenAI backend not yet implemented')
  }
}

class WhisperCppBackend implements TranscriptionBackend {
  constructor(
    private binaryPath: string,
    private modelPath: string
  ) {}

  async transcribe(wav: Buffer, _sampleRate: number): Promise<TranscribeAudioResult> {
    const start = Date.now()
    const tmpWav = join(tmpdir(), `archflow-${Date.now()}.wav`)

    try {
      writeFileSync(tmpWav, wav)

      const transcript = await new Promise<string>((resolve, reject) => {
        // -nt = no timestamps, -np = no progress, outputs plain text to stdout
        const proc = spawn(this.binaryPath, [
          '-m', this.modelPath,
          '-f', tmpWav,
          '-nt',  // no timestamps
          '-np',  // no progress bar
          '-l', 'en'
        ])

        let stdout = ''
        let stderr = ''
        proc.stdout.on('data', (d: Buffer) => (stdout += d.toString()))
        proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()))

        proc.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`whisper-cpp exited ${code}: ${stderr.trim()}`))
          } else {
            resolve(stdout.trim())
          }
        })

        proc.on('error', (err) => reject(new Error(`Failed to spawn whisper-cpp: ${err.message}`)))
      })

      return { transcript, confidence: 1.0, elapsedMs: Date.now() - start }
    } finally {
      try { unlinkSync(tmpWav) } catch { /* ignore */ }
    }
  }
}

class FasterWhisperBackend implements TranscriptionBackend {
  constructor(_modelPath: string) {}
  async transcribe(_wav: Buffer, _sampleRate: number): Promise<TranscribeAudioResult> {
    throw new Error('faster-whisper backend not yet implemented')
  }
}

function createBackend(settings: AppSettings): TranscriptionBackend {
  switch (settings.whisperBackend) {
    case 'openai-api':
      return new OpenAIBackend(settings.openaiApiKey ?? '')
    case 'whisper-cpp':
      return new WhisperCppBackend(
        settings.whisperCppBinary ?? 'whisper-cpp',
        settings.whisperCppModelPath ?? '/usr/share/whisper.cpp/models/ggml-base.en.bin'
      )
    case 'faster-whisper':
      return new FasterWhisperBackend(settings.fasterWhisperModelPath ?? '')
    case 'mock':
    default:
      return new MockBackend()
  }
}

export class TranscriptionService {
  private backend: TranscriptionBackend

  constructor(settings: AppSettings) {
    this.backend = createBackend(settings)
  }

  reloadBackend(settings: AppSettings): void {
    this.backend = createBackend(settings)
  }

  async transcribe(payload: TranscribeAudioPayload): Promise<TranscribeAudioResult> {
    const wavBuffer = Buffer.from(payload.wavBuffer)
    return this.backend.transcribe(wavBuffer, payload.sampleRate)
  }
}
