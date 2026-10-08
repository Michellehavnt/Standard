# AffiliateFinder reel (30 s, 1080x1920)

A HyperFrames project that turns the AffiliateFinder.ai product video into a vertical reel with a hook card, captioned footage and a call-to-action close. The confirmed brief is in `BRIEF.md`.

## Status

The scaffold renders end to end, but the footage slot shows a placeholder: the source video could not be downloaded into the build environment (Google Drive files over 10 MB are not available through the connector, and drive.google.com is blocked by the environment's network policy). Speech-to-text model downloads are blocked as well, so captions need a transcript file.

## Finish the reel

1. Put the source video at `assets/source.mp4` (the Drive file "AffiliateFinder.ai - Affiliate Recruitment Software - 2 October 2026.mp4").
2. Put a transcript at `assets/transcript.srt` or `assets/transcript.json` (word level is best). With Whisper available, `npx hyperframes transcribe assets/source.mp4` produces it.
3. Edit `edit.json`:
   - `segments`: the source ranges to use, each with `start` (position in the scene), `mediaStart` (position in the source) and `duration`. The scene is 23.6 s long.
   - `captions`: cues with `start`, `end` and `text`, two to four words each, timed to the chosen segments.
4. Rebuild the footage scene and check it:

```bash
npm run build    # writes compositions/footage.html from edit.json
npm run check
npm run dev      # Studio preview
npm run render   # MP4 into renders/
```

## Layout

- `compositions/hook.html` (0 to 2.4 s): kinetic text hook.
- `compositions/footage.html` (2.4 to 26 s): footage band with a blurred copy of the same video behind it, a headline above and captions below. Generated file, do not edit by hand.
- `compositions/cta.html` (26 to 30 s): wordmark, proof stat, "Start free" button and URL.
- `edit.json`: cut list and captions.
- `scripts/build-footage.mjs`: generator for the footage scene.
- `vendor/gsap.min.js`: vendored GSAP so renders need no network.
