import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Column {
  x: number;
  hue: 'gold' | 'blue' | 'white';
  width: number;
  phase: number;
  speed: number;
}

/**
 * The whole page sits on dark water: a fixed, viewport-sized canvas behind everything.
 * City-light reflections are drawn as stacks of short horizontal dashes whose width and position wobble and drift,
 * with faint ripple lines flowing across — the look of lights reflected on moving water at night.
 * Static under reduced motion; pauses when the tab is hidden.
 */
export function WaterBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    let cols: Column[] = [];

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(8, Math.round(w / 90));
      cols = Array.from({ length: n }, (_, i) => ({
        x: ((i + 0.5) / n) * w + (Math.random() - 0.5) * 50,
        hue: Math.random() < 0.6 ? 'gold' : Math.random() < 0.7 ? 'blue' : 'white',
        width: 14 + Math.random() * 34,
        phase: Math.random() * 100,
        speed: 0.6 + Math.random() * 0.9,
      }));
    };

    const colour = (hue: Column['hue'], a: number) =>
      hue === 'gold' ? `rgba(230, 180, 105, ${a})` : hue === 'blue' ? `rgba(120, 160, 230, ${a})` : `rgba(235, 240, 250, ${a})`;

    const draw = (t: number) => {
      // deep water, a little lighter toward the bottom of the screen
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#07101e');
      g.addColorStop(0.55, '#0a1628');
      g.addColorStop(1, '#0e1d33');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // reflections: each column is a broken, wobbling stack of dashes
      const step = 6;
      for (const c of cols) {
        for (let y = 0; y < h; y += step) {
          const k = y / h;
          const wob = Math.sin(y * 0.045 - t * 1.6 * c.speed + c.phase) + 0.6 * Math.sin(y * 0.013 + t * 0.7 + c.phase * 0.5);
          const len = c.width * (0.35 + 0.65 * Math.abs(Math.sin(y * 0.11 + t * 2.2 * c.speed + c.phase)));
          const a = (0.05 + 0.16 * Math.max(0, Math.sin(y * 0.07 - t * 2.4 + c.phase))) * (0.6 + k * 0.6);
          if (a < 0.045) continue;
          ctx.fillStyle = colour(c.hue, a);
          ctx.fillRect(c.x + wob * (6 + k * 10) - len / 2, y, len, 1.6);
        }
      }

      // ripple lines flowing slowly across the whole surface
      ctx.lineWidth = 1;
      for (let i = 0; i < 26; i++) {
        const y = ((i / 26) * h + t * 14) % h;
        const a = 0.035 + 0.05 * (y / h);
        ctx.strokeStyle = `rgba(160, 190, 230, ${a})`;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 24) {
          const yy = y + Math.sin(x * 0.012 + t * 0.9 + i) * 3;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    };

    // the backdrop moves slowly, so 30 frames a second is plenty and leaves headroom for the hero
    let lastDraw = 0;
    const loop = (now: number) => {
      if (now - lastDraw > 32) {
        lastDraw = now;
        draw(now / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    size();
    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);
    const onResize = () => {
      size();
      if (reduced) draw(0);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduced]);

  return <canvas ref={ref} className="water" aria-hidden />;
}
