# archflow

A system-wide voice dictation app built with Electron, React, and TypeScript. Press a global hotkey to start recording, speak, and have the transcript auto-typed into whatever app is focused.

## Prerequisites

- Node.js 18+
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) built from source

## Setup

### 1. Clone and build whisper.cpp

```bash
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make
```

Download a model (e.g. the small English model):

```bash
bash models/download-ggml-model.sh base.en
```

Note the paths to:
- The compiled binary: `whisper.cpp/main` (or `whisper.cpp/build/bin/whisper-cli` depending on your build)
- The downloaded model: `whisper.cpp/models/ggml-base.en.bin`

### 2. Create app-settings.json

In the root of the cloned `archflow` repo, create a file named `app-settings.json`:

```json
{
  "whisperBackend": "whisper-cpp",
  "whisperCppBinary": "/absolute/path/to/whisper.cpp/main",
  "whisperCppModelPath": "/absolute/path/to/whisper.cpp/models/ggml-base.en.bin"
}
```

Replace the paths with the actual absolute paths on your machine. That's the only configuration needed.

### 3. Install dependencies and run

```bash
npm install
npm run dev
```

## Usage

The app runs as a tray icon. Press the global hotkey (`Ctrl+Shift+Space` by default) to start/stop recording. The transcript is auto-typed into the currently focused window.

## Building

```bash
npm run build:linux   # Linux
npm run build:mac     # macOS
npm run build:win     # Windows
```
