# Vendored kits

Third-party kits installed into this repository on 2026-10-08. Each folder is a plain copy of the upstream repository at the commit listed below, without its `.git` history. Their skills are also copied, unchanged, into `.claude/skills/` so Claude Code picks them up in every session on this repo.

| Folder | Upstream | Commit | License | Omitted from the copy |
|---|---|---|---|---|
| `tools/ais-os/` | https://github.com/nateherkai/AIS-OS | ce9cb93a1145 (2026-09-06) | MIT | `docs/media/3d-brain-demo.mp4` and `3d-brain-preview.gif` (31 MB of demo media) |
| `tools/hyperframes-student-kit/` | https://github.com/nateherkai/hyperframes-student-kit | 0d30152a82b9 (2026-09-28) | MIT | `examples/` (128 MB) and `video-projects/` (287 MB) of sample footage and finished videos |

Two more kits are skills only, with no supporting kit folder:

| Skill | Upstream | Commit | License |
|---|---|---|---|
| `.claude/skills/scroll-craft/` | https://github.com/nateherkai/scroll-craft (plugin `nateherk-design`) | 75d81f74e836 (2026-09-30) | MIT |
| `.claude/skills/human-speak/` | https://github.com/nateherkai/human-speak | ec9f830fee24 (2026-10-05) | MIT |

## How the skills map to the kits

The skills under `.claude/skills/` are copies of the kits' own `.claude/skills/` folders. Their instructions refer to files relative to the kit root, for example `scripts/`, `references/`, `context/` or `style-library/`. Resolve those against the kit folder:

- `/onboard`, `/grill-me`, `/audit`, `/link`, `/level-up`, `/3d-brain` belong to AIS-OS. Kit root: `tools/ais-os/`.
- `/edit-video`, `/short-form-edit`, `/cut-silences`, `/cut-mistakes`, `/video-storytelling`, `/style-library`, `/motion-showreel`, `/make-a-video`, `/short-form-video`, `/website-to-hyperframes`, `/hyperframes-video-beats`, `/gsap` belong to the HyperFrames Student Kit. Kit root: `tools/hyperframes-student-kit/`.
- `/scroll-craft` and `/human-speak` are self-contained.

Three student-kit skills were not copied because their names collide with the official HyperFrames skills already installed: `hyperframes`, `hyperframes-cli` and `hyperframes-registry`. The official versions (HyperFrames 0.8.x) stay in `.claude/skills/`. The kit's own copies remain available in `tools/hyperframes-student-kit/.claude/skills/`.

## Setting up the student kit

Run once, inside the kit folder:

```bash
cd tools/hyperframes-student-kit
npm ci
npm run setup     # checks node, ffmpeg, chrome and creates .env if absent
npm test
```

Transcription in the kit uses ElevenLabs Scribe by default and asset generation uses Kie.ai. Both need your own API keys in `tools/hyperframes-student-kit/.env`, which is git-ignored. See `tools/hyperframes-student-kit/docs/TOOLS-AND-API-KEYS.md`. The kit pins HyperFrames 0.7.109 as a dev dependency. The projects under `videos/` use 0.8.141 through `npx`, so the two do not interfere.

## Setting up AIS-OS

AIS-OS personalizes itself through an interview. Open a session in this repo and run `/onboard`. It fills `tools/ais-os/context/`, `tools/ais-os/CLAUDE.md` and `tools/ais-os/AGENTS.md`. The root `CLAUDE.md` of this repository is not touched by it.

## Updating

Re-clone the upstream repository, copy it over the folder here with the same omissions, then copy the kit's `.claude/skills/*` folders over the matching ones in `.claude/skills/`. Update the commit column above.
