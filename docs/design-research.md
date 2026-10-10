# Design research

Before designing Hapnin I went through recent Awwwards Sites of the Day, pulled their
public bundles to see what they're built with, and recorded each one's intro and
scroll animations frame by frame.

## What the winners use

| Site | Stack spotted in the bundle |
| --- | --- |
| locomotive.ca | GSAP, ScrollTrigger, SplitText, Lenis, Barba, three.js |
| butter.video | Next.js, GSAP, SplitText, ScrollTrigger, Lenis, three.js, Rive |
| coloniazacamil.com | Nuxt, GSAP, ScrollTrigger, MorphSVG, Lenis, three.js |
| moto-card.com | Webflow, GSAP, ScrollTrigger, Lenis, three.js |
| lxlcreative.co.uk | Webflow, GSAP, ScrollTrigger, DrawSVG, Flip, Barba, Lenis |
| gilhuybrecht.com | Nuxt, GSAP, ScrollTrigger, Lenis, three.js |
| cerebrium.ai | Astro, Lenis, Swup |
| partiful.com | Framer |

The common thread is GSAP + ScrollTrigger + SplitText for motion and Lenis for smooth
scrolling, with page transitions handled by Barba/Taxi/Swup.

## Patterns worth stealing

- **Inline media in headlines** (Zacamil, Butter): an image pill sits inside the
  headline, then grows to fill the screen on scroll.
- **Scroll-scrubbed reading** (Butter): a paragraph's words go from dim to bright as
  you scroll through it.
- **Depth field** (Moto): a hero object in the centre with photos drifting at
  different parallax speeds behind it.
- **Image takeover** (LXL): a framed photo scales to full-bleed while the section pins.
- **Mixed type** (LXL): heavy grotesk paired with an expressive italic.
- **Playful tickets** (Partiful): tilted cards and QR tickets that feel collectible.
- **Restraint**: one accent colour, lots of negative space, mono labels for metadata.

## Hapnin's design language

- Warm near-black `#0f0e0c`, cream `#f3eee3`, one electric accent (lime `#d7ff3d`).
- Bricolage Grotesque for display, Instrument Serif italic for emphasis, Geist Mono for
  labels.
- GSAP + ScrollTrigger + SplitText for scroll choreography, Lenis for smooth scroll,
  Motion for small UI state transitions (modals, toggles, toasts).
- Everything respects `prefers-reduced-motion`.
