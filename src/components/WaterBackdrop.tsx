import { useEffect, useRef } from 'react';
import skylineSrc from '../assets/photos/night-skyline.jpg';
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
    // the city's imprint: the skyline from the hero photo, pre-rendered faint on the horizon, plus its mirror image
    const img = new Image();
    img.src = skylineSrc;
    const city = document.createElement('canvas');
    const mirror = document.createElement('canvas');
    let horizon = 0;
    let cityH = 0;

    const renderCity = () => {
      if (!img.complete || !img.naturalWidth || !w) return;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      // everything above the river in the photo, scaled to the page width
      const sy0 = 0.06 * ih;
      const sy1 = 0.83 * ih;
      const dh = Math.min(horizon, (w * (sy1 - sy0)) / iw);
      cityH = dh;
      const scale = 1.25;
      for (const c of [city, mirror]) {
        c.width = Math.round(w * scale);
        c.height = Math.max(1, Math.round(dh * scale));
      }
      const cc = city.getContext('2d')!;
      cc.setTransform(scale, 0, 0, scale, 0, 0);
      cc.filter = 'grayscale(0.35) brightness(1.15)';
      cc.drawImage(img, 0, sy0, iw, sy1 - sy0, 0, 0, w, dh);
      cc.filter = 'none';
      // fade the sky away so only the towers and their lights read
      cc.globalCompositeOperation = 'destination-in';
      const fade = cc.createLinearGradient(0, 0, 0, dh);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(0.35, 'rgba(0,0,0,0.7)');
      fade.addColorStop(1, 'rgba(0,0,0,1)');
      cc.fillStyle = fade;
      cc.fillRect(0, 0, w, dh);
      // mirror image for the reflection, fading out with depth
      const mc = mirror.getContext('2d')!;
      mc.setTransform(scale, 0, 0, -scale, 0, dh * scale);
      mc.drawImage(city, 0, 0, w, dh);
      mc.setTransform(scale, 0, 0, scale, 0, 0);
      mc.globalCompositeOperation = 'destination-in';
      const mf = mc.createLinearGradient(0, 0, 0, dh);
      mf.addColorStop(0, 'rgba(0,0,0,0.85)');
      mf.addColorStop(0.7, 'rgba(0,0,0,0)');
      mc.fillStyle = mf;
      mc.fillRect(0, 0, w, dh);
    };
    img.onload = () => {
      renderCity();
      if (reduced) draw(0);
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      horizon = Math.round(h * 0.6);
      renderCity();
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
      g.addColorStop(0, '#060d1a');
      g.addColorStop(0.58, '#132544');
      g.addColorStop(0.6, '#0c1a30');
      g.addColorStop(1, '#0e1d33');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // the city imprint on the horizon; it rises a little as the page scrolls, for depth
      if (cityH) {
        const lift = Math.min(60, window.scrollY * 0.02);
        const top = horizon - cityH - lift;
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.34;
        ctx.drawImage(city, 0, top, w, cityH);
        // its reflection, redrawn in bands with a travelling ripple so it moves with the water
        ctx.globalAlpha = 0.22;
        const band = 3;
        const sh = mirror.height / cityH;
        for (let y = 0; y < cityH; y += band) {
          const dx = Math.sin(y * 0.08 - t * 1.8) * (2 + (y / cityH) * 10) + Math.sin(y * 0.021 + t * 0.6) * 4;
          ctx.drawImage(mirror, 0, y * sh, mirror.width, band * sh, dx, horizon - lift + y, w, band);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        // a soft line of haze where the city meets the water
        const hz = ctx.createLinearGradient(0, horizon - lift - 30, 0, horizon - lift + 30);
        hz.addColorStop(0, 'rgba(120, 150, 200, 0)');
        hz.addColorStop(0.5, 'rgba(150, 170, 210, 0.08)');
        hz.addColorStop(1, 'rgba(120, 150, 200, 0)');
        ctx.fillStyle = hz;
        ctx.fillRect(0, horizon - lift - 30, w, 60);
      }

      // reflections: each column is a broken, wobbling stack of dashes
      const step = 6;
      for (const c of cols) {
        for (let y = horizon; y < h; y += step) {
          const k = (y - horizon) / (h - horizon);
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
      for (let i = 0; i < 18; i++) {
        const y = horizon + (((i / 18) * (h - horizon) + t * 10) % (h - horizon));
        const a = 0.03 + 0.06 * ((y - horizon) / (h - horizon));
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
