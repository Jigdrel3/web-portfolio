# Claude Code Design Brief Template

Use this whenever you want Claude Code to build something visual — a site, a section, a component — and want it to come out precise and distinctive instead of generic/templated. Fill in every bracket. The more literal and specific you are, the better the output; vague direction ("make it look nice") is what produces generic results.

---

## 1. Role & standard

> Act as the design lead at a small studio known for giving every project a visual identity that couldn't be mistaken for anyone else's. I've already rejected work that felt templated or like a default AI layout. Take one real, deliberate aesthetic risk you can justify — don't play it safe, and don't reach for the three most common AI-design defaults (warm cream + terracotta serif; near-black + one neon accent; broadsheet hairline-rule newspaper layout) unless I've specifically asked for one of those.

## 2. Subject grounding

- **What is this, exactly?** [e.g. "a stats section for a Bhutanese civic-media nonprofit's website"]
- **Who is it for?** [audience — who reads/uses this]
- **What's its one job?** [the single thing this piece of the page needs to accomplish]
- **What's the subject's own world/vernacular?** [materials, objects, rituals, textures that are authentically tied to the subject — this is where distinctive choices come from, not generic decoration]
- **Is there an existing design system to honor?** [a CLAUDE.md, a live site's palette/type, an existing project's tokens — or "no, this is a fresh identity"]
- **Reference sites/work, if any** — name them, and say *what* to take from each (interaction pattern, typography, layout rhythm — not necessarily everything): [e.g. "igloo.inc for the scroll-driven wayfinding and camera-push interaction; thevertmenthe.dault-lafon.fr for the tilted paper-card gallery and lightbox — but neither site's color palette, use ours instead"]

## 3. Runtime, dependencies & content source

These decide the technical shape of the build before a line of code exists — get them wrong and expect a rebuild.

- **Where will this actually be opened?** [double-click the file locally / served from `localhost` during dev / a hosted shareable link (e.g. a Claude Artifact) / deployed to real hosting] — this determines whether `fetch()`, ES module imports, and CDN scripts are even usable: browsers block `fetch()` and `<script type="module">` under `file://`, and a hosted Artifact has its own constraints (no arbitrary CDN requests, size limits, no local filesystem). If you want "just double-click it, no server" as the end state, say so explicitly.
- **External libraries/CDNs** — allowed, or must everything be self-contained/offline-capable? [e.g. "fine to pull Three.js from a CDN" vs. "bundle it locally, this needs to work with no internet"]
- **Content/data source** — should real copy and data be hardcoded into the markup, or read from a separate file (e.g. `content.json`) so it's easy to edit later without touching code? If separate, sketch the schema you want, or say "your call."

## 4. Design tokens (be literal — exact hex codes, exact font names)

**Color** — name 4–6 colors with hex values and their job:
- Background: `#______`
- Primary text: `#______`
- Primary accent: `#______` (used for: ___)
- Secondary accent: `#______` (used for: ___)
- [add more as needed]

**Type** — name the actual typefaces, not just "a serif" and "a sans":
- Display/heading face: [exact name] — used with restraint for: ___
- Body face: [exact name]
- Utility/caption/data face: [exact name] — used for: ___

**Layout** — describe the structure in one or two sentences, plus a rough ASCII wireframe if it helps:
```
[sketch it out — boxes, columns, flow]
```

**Signature element** — the one unique thing this piece will be remembered by. Describe exactly what it is and how it behaves:
> [e.g. "a hand-drawn ink line that draws itself in on load and reappears as a scroll-progress thread"]

## 5. Interaction & motion — literal specs, not vibes

For every interactive element, specify:
- **Trigger:** [hover / click / scroll-into-view / load]
- **What changes:** [exact property — color, scale, position, opacity]
- **Timing:** [exact duration, e.g. "350ms"] and **easing** [e.g. "cubic-bezier(.4,0,.2,1)", not just "smooth"]
- **Fallback for `prefers-reduced-motion`:** [what happens instead]

## 6. Content & media — use the real thing, not lorem ipsum

- Paste actual copy, real numbers, real names, real URLs here. If you don't have real content yet, say so explicitly and mark placeholders clearly (`<!-- PLACEHOLDER: needs real X -->`) so Claude Code doesn't invent facts and present them as real.
- **Real images/video, if any** — where do they live (local folder, URLs)? What's their actual resolution/quality? Low-res source images (e.g. sub-500px thumbnails) will look soft blown up large — say if you want Claude Code to flag those rather than silently use them at full size, and whether it's OK to resize/compress originals for web performance.

## 7. Accessibility & fallback floor (non-negotiable, every build)

- Responsive down to mobile — specify breakpoints if you have opinions, otherwise "use your judgment but test narrow viewports"
- Visible keyboard focus states on every interactive element
- Sufficient color contrast (state a target, e.g. WCAG AA)
- Real, specific alt text on every meaningful image — not filenames, not empty strings on content images
- Any modal/lightbox/overlay: focus moves into it on open, Tab cycles within it, Escape closes it, focus returns to the trigger element on close
- `prefers-reduced-motion` respected everywhere motion is used
- If using anything heavy (WebGL/3D/canvas): a working fallback for devices/browsers that can't run it

## 8. Work order — build in small, reviewable steps

Tell Claude Code explicitly not to do it all in one pass. List the steps in the order you want to see them, e.g.:
1. [structure/layout with no styling — confirm the skeleton is right]
2. [apply palette and type — confirm the look before adding motion]
3. [add primary interaction]
4. [add secondary/polish interaction]
5. [accessibility + reduced-motion + fallback pass, last]

Show me the result after each step before continuing to the next. Say explicitly whether you want a pause for approval after *every* step, or whether a short "continue"/"looks good" should make Claude Code run through the rest of the work order in one go — both work, but naming your preference avoids either stalling on you or racing ahead.

## 9. Self-critique instruction

> Before showing me the result, check it against this brief: does the palette match the exact hex values given? Does the signature element behave exactly as specified? Is there real content, not placeholder text? Does every image have real alt text? Can the whole thing be operated with a keyboard alone? Would this layout survive at mobile width? If anything drifted from the brief, fix it before showing me, and tell me what you changed and why.

---

## Quick version (for small components, not full pages)

> Build [component] using this exact palette: [hex list]. Typeface: [display] for headings, [body] for text. The one distinctive detail: [signature element, described literally]. Behavior: on [trigger], [exact change] over [duration] with [easing]. Use this real content: [paste it]. This needs to run [where — file:// / localhost / hosted link], [with/without] external CDN libraries. Respect prefers-reduced-motion. Show me before adding anything further.

---

### Why this works better than a casual request

- **Hex codes and exact font names** remove Claude Code's need to guess, which is where generic defaults creep in.
- **Runtime and dependency questions up front** prevent a rebuild once you discover the "quick" version silently needs a server, or won't run offline.
- **Named reference sites with the specific thing to borrow** get you a deliberate blend instead of an accidental clone of one site's whole look.
- **Literal motion specs** (duration + easing + trigger + fallback) produce deliberate animation instead of scattered effects.
- **Real content up front** stops invented facts/numbers from ending up in a design meant to be credible.
- **Image quality called out early** means you find out an asset is too low-res before it's built into the hero, not after.
- **Small work order, with your pause preference stated** lets you catch a wrong direction after step 1, not after the whole thing is built — and keeps Claude Code from guessing whether to wait on you.
- **The self-critique step** catches drift before you even see the result, saving a review cycle.
