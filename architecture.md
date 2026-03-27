# archflow architecture

A push-to-talk dictation desktop app for Arch Linux built with Electron + electron-vite + React + TypeScript. Hold a global hotkey to record, release to transcribe via whisper.cpp locally, and the text is auto-typed into whatever window was focused.

---

## File structure

```
src/
├── main/
│   ├── index.ts                        — bootstrap: wires all services, starts uiohook
│   ├── ipc-handlers.ts                 — registers all ipcMain.handle() calls; pure wiring
│   ├── types/
│   │   └── ipc.ts                      — shared IPC channel names + payload interfaces
│   └── services/
│       ├── settings-store.ts           — in-memory AppSettings with defaults
│       ├── transcription-service.ts    — Strategy pattern; backends: mock, whisper-cpp, openai-api, faster-whisper
│       ├── auto-type-service.ts        — types text via xdotool or ydotool child process
│       ├── hotkey-manager.ts           — uiohook-napi keydown/keyup; captures focused window ID
│       ├── window-manager.ts           — creates focusable:false transparent overlay BrowserWindow
│       └── tray-manager.ts             — system tray icon with state-aware appearance
├── preload/
│   ├── index.ts                        — fully typed contextBridge API exposed as window.api
│   └── index.d.ts                      — Window interface augmentation
└── renderer/
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx                     — root UI: header + visualiser + error display
        ├── env.d.ts
        ├── hooks/
        │   ├── useDictation.ts         — FSM: idle → recording → transcribing → result/error
        │   └── useAudioRecorder.ts     — ScriptProcessorNode → Float32Array PCM + AnalyserNode
        ├── components/
        │   ├── StatusIndicator.tsx     — animated dot + label per state
        │   └── Waveform.tsx            — canvas frequency bar visualiser (indigo → violet)
        └── utils/
            └── wav-encoder.ts          — Float32Array → 16-bit mono WAV ArrayBuffer
```

---

## Recording flow

```
[user holds Ctrl+Shift+Space]
        │
        ▼
HotkeyManager (uiohook-napi keydown)
  → snapshot active window ID via xdotool getactivewindow
  → show overlay window
  → send HOTKEY_PRESS to renderer
        │
        ▼
useDictation: idle → recording
useAudioRecorder: getUserMedia → AudioContext (16 kHz)
  → ScriptProcessorNode accumulates Float32Array chunks
  → AnalyserNode feeds Waveform component (canvas RAF loop)
        │
[user releases Ctrl+Shift+Space]
        │
        ▼
HotkeyManager (uiohook-napi keyup)
  → send HOTKEY_RELEASE to renderer
        │
        ▼
useDictation: recording → transcribing
  → stop recorder → merge chunks → encodeWav()
  → ipcRenderer.invoke('dictation:transcribe-audio', { wavBuffer, sampleRate, durationSeconds })
        │
        ▼
TranscriptionService (main process)
  → WhisperCppBackend: write WAV to /tmp → spawn whisper-cli -m <model> -f <wav> -nt -np
  → parse stdout → return { transcript, confidence, elapsedMs }
        │
        ▼
useDictation: transcribing → result
  → ipcRenderer.invoke('dictation:auto-type', { text })
        │
        ▼
AutoTypeService (main process)
  → xdotool windowfocus --sync <captured window ID>
  → sleep 100ms
  → xdotool type --clearmodifiers --delay 30 -- <text>
        │
        ▼
useDictation: result → idle
  → hide overlay window immediately
```

---

## IPC channels

All channel names are defined in `src/main/types/ipc.ts` and imported by both the main process and the preload. This gives compile-time guarantees that channel names never drift between sender and receiver.

| Direction | Channel | Purpose |
|-----------|---------|---------|
| renderer → main | `dictation:transcribe-audio` | Send WAV buffer, receive transcript |
| renderer → main | `dictation:recording-started` | Fallback focused-window snapshot for manual start |
| renderer → main | `dictation:recording-cancelled` | Notify main of cancellation |
| renderer → main | `dictation:auto-type` | Type text into the previously focused window |
| renderer → main | `settings:get` | Fetch current AppSettings |
| renderer → main | `settings:set` | Update AppSettings |
| renderer → main | `app:copy-to-clipboard` | Copy text via Electron clipboard (navigator.clipboard fails on focusable:false windows) |
| renderer → main | `app:hide-window` | Hide the overlay window |
| main → renderer | `dictation:hotkey-press` | Global hotkey was pressed — start recording |
| main → renderer | `dictation:hotkey-release` | Global hotkey was released — stop recording |
| main → renderer | `dictation:state-changed` | Renderer notifies main of state for tray icon updates |

---

## Dictation state machine

```
         ┌──────────────────────────────────────────┐
         │                  idle                    │◄─── app start / dismiss / result
         └──────────────┬───────────────────────────┘
                        │ HOTKEY_PRESS
                        ▼
                   recording
                        │
                        │ HOTKEY_RELEASE
                        ▼
                  transcribing
                   /         \
         SUCCESS /             \ ERROR
                ▼               ▼
             result           error
                │               │
       auto-hide immediately   dismiss
                │               │
                └───────────────┘
                        │
                      idle
```

---

## Overlay window

Created in `window-manager.ts` with these key properties:

- `focusable: false` — never steals keyboard focus from other apps
- `transparent: true, frame: false` — borderless glass appearance
- `alwaysOnTop: true, skipTaskbar: true` — floats above all windows, no taskbar entry
- `show: false` — hidden at startup, shown only on hotkey press
- Close event is intercepted (`e.preventDefault()`) — window is never destroyed, only hidden

---

## Transcription backends

Defined in `transcription-service.ts` as a Strategy pattern. Swap backends by changing `whisperBackend` in `settings-store.ts`.

| Backend | Status | Config keys |
|---------|--------|-------------|
| `mock` | Working | — returns a random phrase after ~800ms |
| `whisper-cpp` | **Active** | `whisperCppBinary`, `whisperCppModelPath` |
| `openai-api` | Stub | `openaiApiKey` |
| `faster-whisper` | Stub | `fasterWhisperModelPath` |

Current defaults in `settings-store.ts`:
```
binary: <repo>/whisper.cpp/build/bin/whisper-cli
model:  <repo>/whisper.cpp/models/ggml-base.en.bin
```

---

## Dependencies

### Runtime npm packages

| Package | Used in | Purpose |
|---------|---------|---------|
| `uiohook-napi` | main | Global keydown/keyup events (hold-to-record) |
| `@electron-toolkit/preload` | preload | Typed ipcRenderer wrapper |
| `@electron-toolkit/utils` | main | `electronApp`, `optimizer`, `is.dev` |

### System packages (must be installed on host)

| Tool | Install | Purpose |
|------|---------|---------|
| `xdotool` | `sudo pacman -S xdotool` | Window focus + text injection |
| `whisper-cli` | built from `whisper.cpp/` source | Local speech-to-text inference |

---

## Running

```bash
npm run dev          # development with HMR
npm run build        # typecheck + production build
npm run build:linux  # distributable AppImage/deb/snap
```
