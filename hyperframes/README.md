# HyperFrames video project

This folder is a [HyperFrames](https://github.com/heygen-com/hyperframes) project. HyperFrames turns HTML, CSS and GSAP animations into deterministic MP4 videos: a headless Chrome seeks every frame and FFmpeg encodes the result. Compositions are plain HTML files, so there is no build step.

## Requirements

- Node.js 22 or newer
- FFmpeg and FFprobe on the PATH
- Chrome Headless Shell, downloaded once with `npx hyperframes browser ensure`

Check everything with:

```bash
npx hyperframes doctor
```

## Commands

Run these from this folder.

```bash
npm run dev      # live preview in the browser (Studio) with hot reload
npm run check    # lint, runtime, layout, motion and contrast checks
npm run render   # render index.html to renders/<name>_<timestamp>.mp4
npm run publish  # upload the project to a shareable URL
```

Render a single sub-composition or change output settings:

```bash
npx hyperframes render --help
```

## Project layout

```
hyperframes/
├── index.html          # main composition (root timeline, 1920x1080, 10s)
├── compositions/       # sub-compositions loaded via data-composition-src
│   ├── intro.html
│   ├── graphics.html
│   └── captions.html
├── vendor/gsap.min.js  # vendored GSAP 3.14.2 (no CDN dependency)
├── assets/             # images, video, audio, fonts (create as needed)
├── renders/            # MP4 output, git-ignored
├── hyperframes.json    # project config (registry, paths)
└── meta.json           # project metadata
```

The starting point is the official `warm-grain` example, adjusted so it needs no network access: GSAP is loaded from `vendor/` and the paper texture is an inline SVG noise pattern.

## How a composition works

A composition is an HTML element with `data-composition-id`, `data-width` and `data-height`. Timed children carry `class="clip"`, `data-start` and `data-duration`. Animation is a single paused GSAP timeline registered on `window.__timelines` so the renderer can seek it frame by frame:

```html
<div id="stage" data-composition-id="launch" data-width="1920" data-height="1080">
  <h1 id="title" class="clip" data-start="1" data-duration="4">Launch day</h1>
  <script src="vendor/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from("#title", { opacity: 0, y: 40, duration: 0.8 }, 1);
    window.__timelines = window.__timelines || {};
    window.__timelines.launch = tl;
  </script>
</div>
```

Only deterministic logic is allowed: no `Date.now()`, no `Math.random()`, no network fetches at render time.

## Working with Claude Code

The HyperFrames skills are checked into `../.claude/skills/`. Start a Claude Code session in this repository and ask, for example:

> Using /hyperframes, create a 15-second intro video about our product.

The `/hyperframes` skill routes to the right workflow (product launch video, explainer, captions, motion graphics, slideshow and more). Always run `npm run check` after editing a composition and before rendering.

Add ready-made blocks from the registry:

```bash
npx hyperframes catalog --query "logo reveal"
npx hyperframes add data-chart
```

## Updating

The npm scripts pin `hyperframes@0.8.141` so renders stay reproducible. To upgrade:

```bash
npx hyperframes@latest upgrade --project . --check   # show what would change
npx hyperframes@latest upgrade --project .           # rewrite the pins
npx hyperframes skills update                        # refresh the skills in ~/.claude/skills
```

After a skills update, copy the refreshed folders from `~/.claude/skills/` into `../.claude/skills/` so they are versioned with the repository.

Full documentation: https://hyperframes.heygen.com
