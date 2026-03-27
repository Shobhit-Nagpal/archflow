/**
 * Encodes a Float32Array of PCM samples into a WAV ArrayBuffer.
 * Output: 16-bit PCM, mono, at the given sample rate.
 */
export function encodeWav(pcm: Float32Array, sampleRate: number): ArrayBuffer {
  const numSamples = pcm.length
  const bytesPerSample = 2 // Int16
  const dataSize = numSamples * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeStr = (offset: number, str: string): void => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  // RIFF header
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')

  // fmt chunk
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)         // chunk size
  view.setUint16(20, 1, true)          // PCM format
  view.setUint16(22, 1, true)          // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true) // byte rate
  view.setUint16(32, bytesPerSample, true)              // block align
  view.setUint16(34, 16, true)                          // bits per sample

  // data chunk
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  // PCM samples: clamp Float32 → Int16
  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }

  return buffer
}
