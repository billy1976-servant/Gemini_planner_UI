# `landing-v5.json` media paths ↔ `public/`

Asset `src` values are **root-relative** (`/images/...`, `/Videos/...`). They must exist under `public/` at the same path.

Verified against repo `public/` (names match including legacy double extensions):

| JSON `src` | `public` file |
|------------|----------------|
| `/images/logo-container-creations.webp` | `public/images/logo-container-creations.webp` |
| `/Videos/hero-install.mp4.mp4` | `public/Videos/hero-install.mp4.mp4` |
| `/Videos/pressed-steel.mp4.mp4` | `public/Videos/pressed-steel.mp4.mp4` |
| `/images/Measure-roof.jpg.jpg` | `public/images/Measure-roof.jpg.jpg` |
| `/images/12_%20vent.png` | `public/images/12_ vent.png` (space URL-encoded) |
| `/images/Container%20Images%20(1).jpg` | `public/images/Container Images (1).jpg` |
| `/images/Container%20Images%20(8).jpg` | `public/images/Container Images (8).jpg` |

If media still fails in production, check **deployment includes `public/`**, **CDN base URL**, and **network 404** for each URL.
