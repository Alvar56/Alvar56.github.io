# Alvar Pascual García · Portfolio

Personal site of Alvar Pascual García, biotechnologist (MSc, BOKU Vienna).
Live at **https://alvar56.github.io**.

A static site: `index.html`, `styles.css` and `script.js`. No framework, no build step, no dependencies
apart from two Google Fonts (Fraunces and Instrument Sans).

## What is in here

```
index.html        page content: hero, about, projects, experience, contact
styles.css        layout and typography (light, editorial, responsive)
script.js         navigation, scroll reveals, card interactions and the hero garden
assets/
  cv/             public CV (PDF, references "available upon request")
  img/            portrait, project visuals, link-preview image (og-image.jpg)
  media/          looping protein animation shown on hover in the projects section
  favicon.svg
.nojekyll         tells GitHub Pages to serve the files as they are
```

## The hero garden

The plants behind the headline are drawn live on two `<canvas>` layers (a blurred one behind for depth):
*Arabidopsis thaliana* rosettes with flowering stems and siliques, *Nicotiana benthamiana*, grasses and
seedlings.

- **Leaves** are painted once per type into offscreen bitmaps (outline, vein network, areoles, upper and
  lower surface) and then mapped into 3D poses: spiral phyllotaxis at the golden angle, drooping blades,
  perspective from slightly above, lighting from the upper left.
- **Interaction:** stems and leaves are springs. They lean away from the cursor (or finger) and are swept
  along by its movement; flowers open a little wider when it comes close.
- **Performance:** one `requestAnimationFrame` loop that stops when the hero is off-screen or the tab is
  hidden. If a device needs more than about 12 ms per frame, it drops to 1x resolution and removes the blur.
- **Accessibility:** the canvases are decorative (`aria-hidden`). With *reduce motion* switched on, the
  garden is drawn once, fully grown, and does not move.

Add `?still` to the URL to skip the growth animation, for example when taking a screenshot.

## Run it locally

Any static server works. From this folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk also works, but the browser may
block the fonts or the video.

## Publish on GitHub Pages

1. On GitHub, create a **public** repository named exactly `Alvar56.github.io` (no README, no licence, so it
   starts empty).
2. From this folder:

   ```bash
   git init -b main
   git add .
   git commit -m "Portfolio site"
   git remote add origin https://github.com/Alvar56/Alvar56.github.io.git
   git push -u origin main
   ```

3. In the repository go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**,
   branch **main**, folder **/ (root)**, and save.
4. After a minute or two the site is live at https://alvar56.github.io. The *Actions* tab shows the
   deployment progress.

To update the site later, edit the files and run `git add . && git commit -m "..." && git push`.

## Updating content

- **CV:** replace `assets/cv/Alvar-Pascual-Garcia-CV.pdf` and keep the same file name.
- **Projects and experience:** plain HTML in `index.html`, one `<article class="project">` per card and one
  `<li class="tl-item">` per timeline entry.
- **Link preview:** `assets/img/og-image.jpg` (1200×630) is what LinkedIn, WhatsApp or email show when the
  link is shared.
