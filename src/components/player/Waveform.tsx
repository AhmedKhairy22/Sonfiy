import { useEffect, useRef } from 'react'
import { usePlayerSession } from '../../hooks/usePlayerSession'
import { useExperienceStore } from '../../store/useExperienceStore'

/** Live trace of the sound actually being generated. */
export default function Waveform() {
  const session = usePlayerSession()
  const ready = useExperienceStore((s) => s.audioReady)
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let raf = 0
    let buf: Float32Array<ArrayBuffer> | null = null
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const dpr = Math.min(2, devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = '#65D9C4'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      const an = session.audio.analyser
      if (!an) { ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1; return }
      if (!buf || buf.length !== an.fftSize) buf = new Float32Array(an.fftSize)
      an.getFloatTimeDomainData(buf)
      let start = 0
      for (let i = 1; i < buf.length / 2; i++) if (buf[i - 1] < 0 && buf[i] >= 0) { start = i; break }
      const span = Math.min(buf.length - start, 900)
      for (let i = 0; i < span; i++) {
        const xx = (i / (span - 1)) * w, yy = h / 2 - buf[start + i] * h * 1.4
        if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy)
      }
      ctx.stroke()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [session, ready])
  return <canvas ref={ref} className="block h-full w-full" aria-hidden="true" />
}
