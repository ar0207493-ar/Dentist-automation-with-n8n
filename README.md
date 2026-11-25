# Dentora — Dental care website

A responsive, frontend-only dental website with 22 static HTML pages, shared components and locally hosted animations. Written in HTML, CSS and vanilla JavaScript; no framework installation or backend is needed.

## Run

Serve `dist/` with any static web server. No install or build step is required.

```sh
python -m http.server 4173 --directory dist
```

## Local pages

- Home and About: `index.html`, `about.html`.
- Main pages: `services.html`, `reviews.html`, `journal.html`, `contact.html`, `faq.html`.
- Six individual services: `service-dental-checkups.html`, `service-teeth-cleaning.html`, `service-tooth-fillings.html`, `service-gum-care.html`, `service-retainers.html`, `service-cosmetic-dentistry.html`.
- Six journal articles: `article-cleaning-and-brushing.html`, `article-when-to-visit.html`, `article-dental-checkup.html`, `article-first-visit.html`, `article-whitening-questions.html`, `article-family-care.html`.
- Supporting pages: `privacy.html`, `terms.html`, `404.html`.

`build_pages.py` generates the 20 interior pages and connects the local Home article cards. Edit the content and templates in that file, or the shared presentation in `dist/pages.css`. After shared changes, run:

```sh
python build_styles.py
python build_pages.py
python check_site.py --http http://127.0.0.1:4173
```

The last command checks all HTML routes, local assets, fragments, duplicate IDs and unexpected form destinations. Omit `--http` to check files without a running server.

## Deploy

Import this GitHub repository into Vercel. `vercel.json` selects the static `dist` output directory. No environment variables are required. Pushes to the connected production branch can trigger automatic deployments.

## Behavior

- `dist/shared-components.js` renders the header, mobile menu, footer and appointment section before interactions initialize. Edit this file once to update every page. Internal links and the active navigation item adapt to the route; service details select Services, and articles select Journal.
- Navigation order: Home, About Us, Services, Reviews, Journal, Contact. Local links open complete pages. The footer is four columns above 1100px, two balanced columns from 641–1100px and one column on smaller screens. The 1340px layout has been explicitly checked.
- The About page includes the care philosophy, practice imagery, values, a first-visit guide, FAQs and appointment actions. It shares the site's Lenis scrolling, mobile navigation, contact placeholders and frontend appointment form.
- The homepage follows the supplied Dentora reference from hero through contact. It includes a fixed hero photo, services ticker, treatment highlights, benefits carousel, smile comparison, testimonials, six journal entries, and dental FAQs.
- GSAP animates the hero and sections as they come into view. The full-screen mobile menu slides from the right; appointment actions scroll to the visible form. These effects respect reduced-motion preferences.
- Lenis smooths mouse-wheel and touch scrolling and stays synchronized with GSAP. Horizontal carousel gestures and scrolling inside dialogs remain native.
- FAQs animate open and closed, support keyboard activation and interrupted animations, and keep one answer expanded at a time. Reduced-motion mode uses immediate state changes.
- The website is frontend-only. Shared appointment forms have styled dropdowns; service pages preselect their service. The appointment button is a visual control only, and newsletter submission is disabled. No details are submitted, sent or stored. Browser CSP blocks connections and native form submissions.
- The historical `automation/` and `evolution/` files are not loaded or invoked by `dist/`.
- Raster photographs use optimized WebP delivery; overlaid photos stay static while their captions animate. Article links open full pages. Journal category/search filters and FAQ search work locally. Review images reveal in opposite vertical directions for previous/next, including on mobile.
- Section padding, heading gaps and card padding share the same responsive spacing tokens across Home, About and the interior pages. Interior headings reveal by line; service visit guides pair a fixed photo with connected, animated accordion steps and a synchronized glass caption.
- Team and patient stories are clearly marked illustrative. Stock media does not imply endorsement.

## Published site

The static website is published at https://ar0207493-ar.github.io/Dentist-automation-with-n8n/ from the `gh-pages` branch. The full 22-page release uses working internal navigation; social profiles remain `#` design placeholders. The optional `data-link-mode="placeholder"` attribute can still turn a Home showcase into placeholder links. No backend is deployed.

## Assets

See [THIRD-PARTY.md](THIRD-PARTY.md) for the reference, media credits, and animation licenses.

## Editing styles

The editable CSS files remain in `dist/`. After changing a shared stylesheet, run `python build_styles.py` to regenerate the single shared `dist/site.css` request and update its cache version on Home/About. The generated output is committed and served directly; the deployed frontend needs no runtime build. Fonts are self-hosted WOFF2 files and the hero has responsive WebP sources.
