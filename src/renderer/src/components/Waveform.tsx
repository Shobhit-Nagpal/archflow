import { useEffect, useRef } from 'react'

interface Props {
  analyserRef: React.MutableRefObject<AnalyserNode | null>
}

const BAR_COUNT = 40
const BAR_GAP = 2
const COLOR_FROM = [99, 102, 241] // indigo
const COLOR_TO = [167, 139, 250]  // violet

function lerp(a: number[], b: number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r},${g},${bl})`
}

export function Waveform({ analyserRef }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const draw = (): void => {
      rafRef.current = requestAnimationFrame(draw)
      const analyser = analyserRef.current

      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      if (!analyser) {
        // Draw flat idle line when not recording
        ctx.fillStyle = 'rgba(99,102,241,0.2)'
        const barW = (W - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT
        for (let i = 0; i < BAR_COUNT; i++) {
          const x = i * (barW + BAR_GAP)
          const h = 2
          ctx.beginPath()
          ctx.roundRect(x, H / 2 - h / 2, barW, h, 2)
          ctx.fill()
        }
        return
      }

      const bufLen = analyser.frequencyBinCount
      const data = new Uint8Array(bufLen)
      analyser.getByteFrequencyData(data)

      // Sample down to BAR_COUNT buckets
      const barW = (W - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT
      const step = Math.floor(bufLen / BAR_COUNT)

      for (let i = 0; i < BAR_COUNT; i++) {
        // Average a small bucket for smoother look
        let sum = 0
        for (let j = 0; j < step; j++) sum += data[i * step + j]
        const avg = sum / step

        const normalised = avg / 255
        const h = Math.max(2, normalised * H * 0.9)
        const x = i * (barW + BAR_GAP)
        const y = (H - h) / 2

        ctx.fillStyle = lerp(COLOR_FROM, COLOR_TO, i / BAR_COUNT)
        ctx.globalAlpha = 0.3 + normalised * 0.7
        ctx.beginPath()
        ctx.roundRect(x, y, barW, h, 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyserRef])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={56}
      style={{ width: '100%', height: 56, display: 'block' }}
    />
  )
}
