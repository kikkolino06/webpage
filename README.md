# Emberline Heating & Air

A scroll-driven, interactive HVAC landing page — recreated from an Instagram reel ("Interactive and Scroll Website for HVAC").

Open `index.html` in a browser (or serve the folder, e.g. `python3 -m http.server`). No build step, no dependencies.

## What's on the page

**Scroll story** (sticky, cross-fading scenes that zoom "into" each other):
1. *Ride the airflow.* — snowy house, falling snow
2. *Frost. On the inside of the glass.* — cold living room
3. Floor register close-up → zoom into the vent
4. *Up to 30% never makes it.* — flying down the ductwork
5. *Now the other half.* — the outdoor unit
6. *Every part, checked.* — exploded wireframe of the unit with callouts and a tune-up checklist that ticks as you scroll
7. *Blue flame. Good sign.* — furnace burners
8. *Warm. Finally.* — same room, warm

An indoor-temperature badge follows the story (61° → 70°), and a "Tune-ups from $129" dock appears after the hero.

**Interactive sections**
- *Turn up the heat.* — draggable thermostat dial (mouse, touch, keyboard, +/−) that warms the room
- *When did you last change this?* — dirty vs. clean filter before/after slider
- *Which one fits your house?* — gas furnace / heat pump / ductless mini-split picker
- *Repair it, or replace it?* — age × repair-quote calculator ($5,000 rule) with warning-sign chips
- Plans, footer and a "Book a tech" dialog

## Files
- `index.html` — markup and copy
- `css/style.css` — styles (responsive, respects `prefers-reduced-motion`)
- `js/art.js` — all scene illustrations, drawn as SVG
- `js/main.js` — scroll engine and interactions

The original reel used photographic / AI-rendered imagery; here every scene is a vector illustration so the page is self-contained. To use photos, replace the SVG output of a scene in `js/art.js` with an `<img>` (or a CSS background) — the scroll engine only cares about the `.scene .art` container.
