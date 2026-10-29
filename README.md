# Dentora — Dental care landing page

A responsive dental website based on the supplied visual reference. Real dental footage, a restrained editorial layout, and locally hosted GSAP text and scroll animations.

## Run

Serve `dist/` with any static web server. No install or build step is required.

```sh
python -m http.server 4173 --directory dist
```

## Deploy

Import this GitHub repository into Vercel. `vercel.json` selects the static `dist` output directory. No environment variables are required. Pushes to the connected production branch can trigger automatic deployments.

## Behavior

- GSAP 3.15.0 + ScrollTrigger: masked text reveals, staggered editorial cards, subtle hero parallax, and reading progress. No scroll hijacking.
- Locally hosted, silent, looping 720p dental banner video. Play/pause control, poster fallback, reduced-motion and data-saving preferences, and offscreen/tab visibility pausing.
- Accessible mobile menu, benefit and patient-story carousels, journal dialogs, and appointment-request planner with a downloadable request.
- Newsletter signup is a browser-local preview. Appointment requests use the n8n workflow in `automation/`; the checked-in loopback URL works only for local previews. Before accepting requests on Vercel, host n8n at a public HTTPS address, connect Gmail, and set that production webhook URL in `dist/index.html`.
- Team and patient stories are clearly marked illustrative. Stock media does not imply endorsement.

## Assets

See [THIRD-PARTY.md](THIRD-PARTY.md) for footage, photographs, and animation licensing/source details. No generated image is used in this version.
