// Builds compositions/footage.html from edit.json.
//
// 1. Pre-cuts the chosen source ranges with ffmpeg into assets/cut.mp4 (full-resolution UI, with sound)
//    and assets/bubble.mp4 (the presenter's webcam bubble cropped and enlarged, silent). One hard cut per
//    segment, concatenated in order. Only two <video> elements then live in the scene, which keeps
//    headless Chrome well inside its decode budget.
// 2. Writes the scene: headline + progress bar on top, the UI punch-in in the middle (per-segment focus,
//    slow push-in), the bubble bottom-left over the band, large captions below the band.
//
// If assets/source.mp4 is missing, a labelled placeholder is written instead of the video.
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const edit = JSON.parse(readFileSync(join(root, "edit.json"), "utf8"));
const srcPath = join(root, edit.source);
const haveSource = existsSync(srcPath);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n) => String(Math.round(n * 1000) / 1000);

// Canvas geometry (1080x1920)
const BAND_X = 0, BAND_Y = 320, BAND_W = 1080, BAND_H = 860;
const BUB_D = 420, BUB_X = 48, BUB_Y = BAND_Y + BAND_H - 300;
const CAP_Y = BAND_Y + BAND_H + 170;
const SW = edit.sourceWidth, SH = edit.sourceHeight;

const CUT = "assets/cut.mp4";
const BUBBLE = "assets/bubble.mp4";
const total = edit.segments.reduce((a, s) => a + s.duration, 0);

function needsBuild(out) {
  if (!existsSync(join(root, out))) return true;
  const o = statSync(join(root, out)).mtimeMs;
  return o < statSync(join(root, "edit.json")).mtimeMs || o < statSync(srcPath).mtimeMs;
}

function ffmpegConcat(out, { video, audio }) {
  // One input per segment, trimmed with -ss/-t before decoding, then concat.
  const args = ["-y", "-v", "error"];
  edit.segments.forEach((s) => args.push("-ss", fmt(s.mediaStart), "-t", fmt(s.duration), "-i", srcPath));
  const n = edit.segments.length;
  const vIn = edit.segments.map((_, i) => `[${i}:v]`).join("");
  const aIn = edit.segments.map((_, i) => `[${i}:a]`).join("");
  let fc = `${vIn}concat=n=${n}:v=1:a=0[vcat];[vcat]${video}[v]`;
  // Normalise speech to -14 LUFS (streaming loudness target) with a -1.5 dBTP ceiling.
  if (audio) fc += `;${aIn}concat=n=${n}:v=0:a=1[acat];[acat]loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
  args.push("-filter_complex", fc, "-map", "[v]");
  if (audio) args.push("-map", "[a]", "-c:a", "aac", "-b:a", "160k");
  else args.push("-an");
  args.push("-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(root, out));
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}

if (haveSource) {
  const b = edit.bubble;
  const cropX = Math.round(b.cx - b.r), cropY = Math.round(b.cy - b.r), cropS = Math.round(b.r * 2);
  if (needsBuild(CUT)) {
    console.log(`ffmpeg: ${CUT} (${edit.segments.length} segment(s), ${fmt(total)}s)`);
    ffmpegConcat(CUT, { video: `setpts=PTS-STARTPTS,fps=30`, audio: true });
  }
  if (needsBuild(BUBBLE)) {
    console.log(`ffmpeg: ${BUBBLE} (crop ${cropS}x${cropS} at ${cropX},${cropY} -> ${BUB_D}px)`);
    ffmpegConcat(BUBBLE, { video: `crop=${cropS}:${cropS}:${cropX}:${cropY},scale=${BUB_D}:${BUB_D}:flags=lanczos,setpts=PTS-STARTPTS,fps=30`, audio: false });
  }
}

function uiTransform(focus) {
  const s = BAND_W / focus.w;
  return { s, x: -focus.x * s, y: -focus.y * s };
}

const media = haveSource
  ? `
        <div class="fg-ui-wrap" id="fg-ui-wrap" data-layout-allow-overflow>
          <div class="fg-ui-inner" id="fg-ui-inner" data-layout-allow-overflow>
            <video id="fg-ui" class="clip fg-src" src="${CUT}" playsinline data-has-audio="true" data-volume="1"
              data-start="0" data-duration="${fmt(total)}" data-track-index="0" data-hf-media-start-basis="local" data-layout-ignore
              style="width:${SW}px;height:${SH}px;"></video>
          </div>
        </div>
        <div class="fg-bubble-wrap" id="fg-bubble-wrap" data-layout-allow-overflow>
          <video id="fg-bubble" class="clip fg-bubble" src="${BUBBLE}" playsinline muted
            data-start="0" data-duration="${fmt(total)}" data-track-index="3" data-hf-media-start-basis="local" data-layout-ignore></video>
        </div>`
  : `
        <section id="fg-placeholder" class="clip" data-start="0" data-duration="${fmt(edit.sceneDuration)}" data-track-index="0">
          <div class="fg-ph-panel">
            <div class="fg-ph-title">SOURCE FOOTAGE</div>
            <div class="fg-ph-note">${esc(edit.placeholderNote)}</div>
          </div>
        </section>`;

const captions = edit.captions
  .map(
    (c, i) => `
        <div id="fg-cap-${i}" class="clip fg-cap" data-start="${fmt(c.start)}" data-duration="${fmt(c.end - c.start)}" data-track-index="2">
          <span class="fg-cap-text">${esc(c.text)}</span>
        </div>`,
  )
  .join("\n");

const capTweens = edit.captions
  .map(
    (c, i) =>
      `          tl.fromTo("#fg-cap-${i} .fg-cap-text", { scale: 1.18, y: 14, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.14, ease: "power3.out" }, ${fmt(c.start)});`,
  )
  .join("\n");

// Per-segment focus on the inner wrapper (seek-safe fromTo at each cut) plus a bubble pop on each cut.
let segTweens = "";
if (haveSource) {
  let t = 0;
  segTweens = edit.segments
    .map((seg, i) => {
      const f = seg.focus || edit.defaultFocus;
      const u = uiTransform(f);
      const push = 1.05;
      const start = t;
      t += seg.duration;
      const ir = i === 0 ? "" : ", immediateRender: false";
      return (
        `          tl.fromTo("#fg-ui-inner", { x: ${fmt(u.x)}, y: ${fmt(u.y)}, scale: ${fmt(u.s)} }, { x: ${fmt(u.x * push)}, y: ${fmt(u.y * push)}, scale: ${fmt(u.s * push)}, duration: ${fmt(seg.duration)}, ease: "none"${ir} }, ${fmt(start)});\n` +
        `          tl.fromTo("#fg-bubble-wrap", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.7)"${ir} }, ${fmt(start)});`
      );
    })
    .join("\n");
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>footage</title>
    <!-- GENERATED by scripts/build-footage.mjs from edit.json. Edit those, not this file. -->
  </head>
  <body>
    <template>
      <style>
        #footage-root {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #0b1b26;
          color: #eef7f8;
          font-family: Inter, Outfit, sans-serif;
        }
        #fg-glow {
          position: absolute;
          left: 50%;
          top: ${BAND_Y + BAND_H / 2}px;
          width: 1600px;
          height: 1600px;
          margin: -800px 0 0 -800px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(10, 154, 168, 0.32) 0%, rgba(10, 154, 168, 0) 60%);
        }
        .fg-ui-wrap {
          position: absolute;
          left: ${BAND_X}px;
          top: ${BAND_Y}px;
          width: ${BAND_W}px;
          height: ${BAND_H}px;
          overflow: hidden;
          border-radius: 28px;
          background: #ffffff;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
        }
        .fg-ui-inner {
          position: absolute;
          left: 0;
          top: 0;
          width: ${SW}px;
          height: ${SH}px;
          transform-origin: 0 0;
          will-change: transform;
        }
        .fg-src {
          position: absolute;
          left: 0;
          top: 0;
          object-fit: fill;
        }
        .fg-bubble-wrap {
          position: absolute;
          left: ${BUB_X}px;
          top: ${BUB_Y}px;
          width: ${BUB_D}px;
          height: ${BUB_D}px;
          overflow: hidden;
          border-radius: 50%;
          border: 8px solid #0a9aa8;
          background: #0b1b26;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
          transform-origin: 50% 50%;
        }
        .fg-bubble {
          position: absolute;
          left: -8px;
          top: -8px;
          width: ${BUB_D}px;
          height: ${BUB_D}px;
          object-fit: cover;
        }
        #fg-placeholder {
          position: absolute;
          left: ${BAND_X}px;
          top: ${BAND_Y}px;
          width: ${BAND_W}px;
          height: ${BAND_H}px;
        }
        .fg-ph-panel {
          position: absolute;
          inset: 0;
          border-radius: 28px;
          border: 4px dashed rgba(10, 154, 168, 0.8);
          background: rgba(10, 154, 168, 0.12);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          text-align: center;
          padding: 60px;
        }
        .fg-ph-title { font-size: 54px; font-weight: 900; letter-spacing: 0.2em; color: #0a9aa8; }
        .fg-ph-note { font-size: 34px; font-weight: 700; color: #c7e3e6; line-height: 1.3; }
        #fg-topline {
          position: absolute;
          left: 72px;
          right: 72px;
          top: 120px;
          font-family: Outfit, Inter, sans-serif;
          font-size: 64px;
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          text-align: center;
        }
        #fg-topline span { color: #0a9aa8; }
        #fg-captions {
          position: absolute;
          left: 0;
          right: 0;
          top: ${CAP_Y}px;
          height: 260px;
        }
        .fg-cap {
          position: absolute;
          left: 72px;
          right: 72px;
          top: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .fg-cap-text {
          display: inline-block;
          padding: 22px 44px;
          border-radius: 24px;
          background: rgba(6, 32, 42, 0.92);
          color: #ffffff;
          font-size: 68px;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.02em;
          text-align: center;
          text-transform: uppercase;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45);
        }
        #fg-progress {
          position: absolute;
          left: 72px;
          right: 72px;
          top: ${BAND_Y - 40}px;
          height: 8px;
          border-radius: 4px;
          background: rgba(10, 154, 168, 0.25);
        }
        #fg-progress-fill {
          position: absolute;
          inset: 0;
          border-radius: 4px;
          background: #0a9aa8;
          transform-origin: left center;
        }
      </style>

      <div id="footage-root" data-composition-id="footage" data-width="1080" data-height="1920">
        <div id="fg-glow" data-layout-ignore></div>
${media}
        <section id="fg-chrome" class="clip" data-start="0" data-duration="${fmt(edit.sceneDuration)}" data-track-index="1" data-layout-allow-caption-zone>
          <div id="fg-topline">Recruit affiliates <span>in minutes</span>, not weeks</div>
          <div id="fg-progress"><div id="fg-progress-fill"></div></div>
        </section>
        <div id="fg-captions" data-layout-allow-caption-zone>
${captions}
        </div>
      </div>

      <script>
        (function () {
          const tl = gsap.timeline({ paused: true });
          tl.fromTo("#fg-topline", { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.1);
          tl.fromTo("#fg-progress-fill", { scaleX: 0 }, { scaleX: 1, duration: ${fmt(edit.sceneDuration)}, ease: "none" }, 0);
          tl.fromTo("#fg-glow", { scale: 1 }, { scale: 1.1, duration: ${fmt(edit.sceneDuration / 2)}, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0);
${segTweens}
${capTweens}
          window.__timelines["footage"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`;

writeFileSync(join(root, "compositions/footage.html"), html);
console.log(`footage.html written (${haveSource ? edit.segments.length + " segment(s) pre-cut, " + fmt(total) + "s" : "PLACEHOLDER, source missing"}, ${edit.captions.length} captions)`);
