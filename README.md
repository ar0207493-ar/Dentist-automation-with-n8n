# Dentora homepage showcase

Responsive, frontend-only dental homepage. Static output is in `dist/`; no build or backend is required.

- The live showcase publishes only Home. About remains in local development.
- Every live anchor is a `#` placeholder, including dynamically opened content.
- Appointment and newsletter forms do not submit, store or send data.
- Shared header, footer, mobile menu and visible appointment section are defined in `dist/shared-components.js`.
- Optimized WebP photographs, styled keyboard-accessible dropdowns, and non-submitting appointment controls.
- GSAP and Lenis animations respect reduced-motion preferences.
- Historical `automation/` and `evolution/` directories are not included in the published static site.

## Preview

```sh
python -m http.server 4173 --directory dist
```

## Hosting

GitHub Pages serves the root of the `gh-pages` branch. It contains the contents of `dist/` plus `.nojekyll`; only static frontend files are deployed.

See `THIRD-PARTY.md` for image, icon, font and animation credits.

## Styles

After editing shared CSS, run `python build_styles.py` to rebuild `dist/site.css` and its cache version. The published output is static; there is no runtime build. Fonts are self-hosted WOFF2 subsets, and the hero/preview use responsive WebP images.
