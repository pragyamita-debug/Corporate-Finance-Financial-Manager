import { useEffect, useRef } from 'react';
import { LIGHT_POINTS } from '../data/lights';
import { useReducedMotion } from '../hooks/useReducedMotion';

/** The river on the photo, as fractions of its width / height. */
const RIVER = { x0: 0, x1: 0.6, y0: 0.835, y1: 1 };

/**
 * Drawn over the hero photo (same box, so positions line up):
 * - every real light in the photo twinkles on its own rhythm, and now and then a window switches off and on again;
 * - the river is redrawn from the photo row by row with a travelling sine offset, so the reflections actually flow.
 * Pauses when the hero is off-screen or the tab is hidden.
 */
export function CityLights({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const img = new Image();
    img.src = src;
    // one pre-drawn glow, stamped for every light (far cheaper than a gradient per light per frame)
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const spc = sprite.getContext('2d')!;
    const sg = spc.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, 'rgba(255, 246, 220, 1)');
    sg.addColorStop(0.3, 'rgba(255, 200, 120, 0.45)');
    sg.addColorStop(1, 'rgba(255, 180, 90, 0)');
    spc.fillStyle = sg;
    spc.fillRect(0, 0, 64, 64);
    const strip = document.createElement('canvas');
    const sctx = strip.getContext('2d')!;
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    const lights = LIGHT_POINTS.map(([x, y, s]) => ({ x: x / 100, y: y / 100, s, phase: Math.random() * Math.PI * 2, speed: 0.8 + Math.random() * 2.2, off: 0 }));

    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      strip.width = Math.round(w * (RIVER.x1 - RIVER.x0) * dpr);
      strip.height = Math.round(h * (RIVER.y1 - RIVER.y0) * dpr);
    };

    const drawRiver = (t: number) => {
      if (!img.complete || !img.naturalWidth) return;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const sx0 = RIVER.x0 * iw;
      const sy0 = RIVER.y0 * ih;
      const sw = (RIVER.x1 - RIVER.x0) * iw;
      const sh = (RIVER.y1 - RIVER.y0) * ih;
      const dw = strip.width;
      const dh = strip.height;
      sctx.clearRect(0, 0, dw, dh);
      sctx.globalCompositeOperation = 'source-over';
      const band = 2;
      for (let y = 0; y < dh; y += band) {
        const depth = y / dh; // ripples grow toward the viewer
        const dx = Math.sin(y * 0.09 - t * 2.1) * (1.5 + depth * 7) + Math.sin(y * 0.031 + t * 0.9) * (1 + depth * 3);
        const sy = sy0 + (y / dh) * sh;
        sctx.drawImage(img, sx0, sy, sw, (band / dh) * sh, dx, y, dw, band);
      }
      // brighter glints riding the ripples
      sctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 26; k++) {
        const gy = ((k * 37 + t * 22) % dh);
        const gx = (k * 151) % dw + Math.sin(t * 1.3 + k) * 20;
        sctx.fillStyle = `rgba(255, 220, 160, ${0.05 + 0.08 * Math.sin(t * 3 + k) ** 2})`;
        sctx.fillRect(gx, gy, 18 + (k % 4) * 10, 1.2);
      }
      // feather the edges so it melts into the still photo
      sctx.globalCompositeOperation = 'destination-in';
      const gx = sctx.createLinearGradient(0, 0, dw, 0);
      gx.addColorStop(0, 'rgba(0,0,0,1)');
      gx.addColorStop(0.82, 'rgba(0,0,0,1)');
      gx.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = gx;
      sctx.fillRect(0, 0, dw, dh);
      const gy = sctx.createLinearGradient(0, 0, 0, dh);
      gy.addColorStop(0, 'rgba(0,0,0,0)');
      gy.addColorStop(0.18, 'rgba(0,0,0,1)');
      sctx.fillStyle = gy;
      sctx.fillRect(0, 0, dw, dh);
      ctx.drawImage(strip, RIVER.x0 * w, RIVER.y0 * h, (RIVER.x1 - RIVER.x0) * w, (RIVER.y1 - RIVER.y0) * h);
    };

    const drawLights = (t: number, dt: number) => {
      ctx.globalCompositeOperation = 'lighter';
      for (const l of lights) {
        if (l.off > 0) {
          l.off -= dt;
          continue;
        }
        if (Math.random() < dt * 0.012) l.off = 0.4 + Math.random() * 1.6; // a window briefly goes dark
        const tw = 0.5 + 0.5 * Math.sin(t * l.speed + l.phase);
        const a = 0.15 + tw * 0.75;
        const r = (2 + l.s * 2.2) * (0.75 + tw * 0.5);
        const x = l.x * w;
        const y = l.y * h;
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, x - r * 3, y - r * 3, r * 6, r * 6);
        ctx.globalAlpha = 1;
        if (l.s >= 2 && tw > 0.85) {
          // a small cross flare on the brightest moments
          ctx.fillStyle = `rgba(255, 240, 210, ${(tw - 0.85) * 3})`;
          ctx.fillRect(x - r * 2.5, y - 0.5, r * 5, 1);
          ctx.fillRect(x - 0.5, y - r * 2.5, 1, r * 5);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    let last = 0;
    const loop = (now: number) => {
      const t = now / 1000;
      const dt = last ? Math.min(0.05, t - last) : 0;
      last = t;
      ctx.clearRect(0, 0, w, h);
      drawRiver(t);
      drawLights(t, dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduced) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()));
    io.observe(cv);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [src, reduced]);

  return <canvas ref={ref} className="hero__canvas" aria-hidden />;
}
