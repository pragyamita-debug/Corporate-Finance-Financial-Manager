# Corporate Finance CV Dashboard

Candidates upload a CV (PDF, DOCX or TXT) and get an animated corporate-finance dashboard in a deep navy and gold
"premium firm" style: a lit-up city skyline at night over the water, core expertise cards, counted figures, roles
as architecture photo cards, a recent-projects strip and a track record with counting results.

The CV is read **in the browser** — nothing is uploaded to a server. The parsed profile is kept in `localStorage`
on the candidate's own device.

## What goes where

| On the page | Filled from the CV |
| --- | --- |
| Hero headline (white / teal) | headline: role, then specialty; tagline below |
| Three expertise cards | first three skills; the line comes from a CV bullet that mentions the skill; "Learn more" opens related skills |
| Counted figures | years in finance, projects, certifications, skills |
| "Driving results…" photo cards | the three most recent roles; "Discover more" opens the rest of the bullets |
| Recent projects | projects (up to six) |
| Track record | achievements — the first figure in each ($18M, 12%, …) counts up — plus certifications and education |
| Footer | motto and contact details |

Before anything is uploaded the page shows the full design with neutral placeholders ("Your Role", "Skill One" …).

## Motion

- The night skyline fades in and slowly zooms; a warm glow rises on the horizon behind the spire, tower and
  bridge lights twinkle, and the river ripples with reflected light.
- Behind the whole page an animated backdrop: a drifting blueprint grid, a band of gold light sweeping down, and
  gold dust rising.
- Every card carries a light travelling around its border and a pointer-follow glow; photos zoom on hover.
- Figures and results count up when they scroll into view. Everything respects `prefers-reduced-motion`.

## Develop

```bash
npm install
npm run dev          # local dev server
npm test             # parser tests (vitest)
npm run build        # static build in dist/ (deployed to GitHub Pages by .github/workflows/deploy.yml)
npm run build:single # one self-contained dist-single/index.html
```

Stack: Vite, React 18, TypeScript, pdf.js and mammoth for reading files. Fonts (Cormorant Garamond, Inter) are
bundled locally. Photos are cut from the reference design (slide text painted out of the skyline), enlarged with Real-ESRGAN and sharpened.

The sample CV and every name, email and company in it are fictional.
