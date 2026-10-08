# AffiliateFinder reel (30 s, 1080x1920)

A HyperFrames project that turns the AffiliateFinder.ai product video into a vertical reel with a hook card, captioned footage and a call-to-action close. The confirmed brief is in `BRIEF.md`.

## Status

The source video is downloaded to `assets/source.mp4` (git-ignored, 84 MB) and the reel renders end to end with real footage: a punch-in on the app UI and the presenter's webcam bubble enlarged bottom-left. The cut is provisional (three 8-second ranges) and the captions are placeholders: speech-to-text needs the Whisper or Parakeet model, whose downloads redirect to `us.aws.cdn.hf.co`, which the build environment's network policy blocks.

## Finish the reel

1. Get a transcript. Either allow `huggingface.co`, `us.aws.cdn.hf.co` and `cdn-lfs.hf.co` in the environment and run `npx hyperframes transcribe assets/source.mp4`, or put an existing word-level transcript at `assets/transcript.srt` or `assets/transcript.json`.
2. Pick the ranges that carry the message and edit `edit.json`:
   - `segments`: one entry per hard cut with `mediaStart` (seconds into the source), `duration` and an optional `focus` (`x`, `y`, `w` in source pixels: the region of the UI that fills the band). Segments play back to back; their durations should add up to `sceneDuration` (23.6 s).
   - `captions`: cues with `start` and `end` in scene time (seconds since the footage scene began) and `text`, two to four words each.
   - `bubble`: centre and radius of the webcam bubble in source pixels, if the recording layout changes.
3. Rebuild, check, preview and render:

```bash
npm run build    # ffmpeg pre-cuts assets/cut.mp4 and assets/bubble.mp4, then writes compositions/footage.html
npm run check
npm run dev      # Studio preview
npm run render   # MP4 into renders/
```

The pre-cut files are regenerated whenever `edit.json` or the source is newer than they are.

## Layout

- `compositions/hook.html` (0 to 2.4 s): kinetic text hook.
- `compositions/footage.html` (2.4 to 26 s): UI punch-in band with per-segment focus and a slow push-in, the webcam bubble over its bottom-left corner, a headline above and captions below. Generated file, do not edit by hand.
- `compositions/cta.html` (26 to 30 s): wordmark, proof stat, "Start free" button and URL.
- `edit.json`: cut list and captions.
- `scripts/build-footage.mjs`: generator for the footage scene. Runs ffmpeg to pre-cut the chosen ranges into `assets/cut.mp4` (UI, with sound) and `assets/bubble.mp4` (cropped webcam bubble, silent) so the scene needs only two video elements. Six full-resolution clips left the first segments blank in headless Chrome.
- `vendor/gsap.min.js`: vendored GSAP so renders need no network.
