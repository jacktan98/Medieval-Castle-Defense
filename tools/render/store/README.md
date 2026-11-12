# App Store pictures and preview

Run from this folder (they write into it):
- `node shots.js 956 440 3 iph` and `node shots.js 1376 1032 2 ipad`: the five raw landscape shots (iPhone 6.9" 2868 × 1320, iPad 13" 2752 × 2064); add scene names (`title hero wall siege upgrades`) to redo only some (render the iPad one or two at a time: a long run can time out).
- `node frame-l.js iph 2868 1320` and `node frame-l.js ipad 2752 2064 1376/1032`: the captioned versions (`framed-*.png`; captions in `CAP`, every shot full bleed with the caption over its bottom-left corner). Copy them to `design/store/` as JPEG.
- `node video.js 443 960 2 vframes`: 630 frames of the 21 s preview (886 × 1920, 30 fps; each frame is stepped by hand, so it is smooth however slow the render), then
  `ffmpeg -framerate 30 -i vframes/f%05d.png -i ../../../audio/music/Night_theme_music.mp3 -map 0:v -map 1:a -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 256k -ar 48000 -af "afade=t=in:d=0.5,afade=t=out:st=19.5:d=1.5" -shortest -movflags +faststart preview.mp4`.
The finished set lives in `design/store/`.

- `node trailer.js 960 443 2 tframes [town wall siege black title]` (no `cards` any more: each part's name is drawn over its first seconds) (one part per run: a long run can time out), then `node mix.js tframes ../../../design/store/trailer-iphone.mp4`: the soundtrack (the logged game sounds, music and ambience) and the video.
