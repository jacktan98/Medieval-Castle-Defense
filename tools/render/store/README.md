# App Store pictures and preview

Run from this folder (they write into it):
- `node shots.js 440 956 3 iph` and `node shots.js 1032 1376 2 ipad`: the six raw shots (iPhone 6.9" 1320 × 2868, iPad 13" 2064 × 2752); add scene names (`hero wall siege boss camp upgrades`) to redo only some.
- `node frame.js iph 1320 2868` and `node frame.js ipad 2064 2752`: the captioned versions (`framed-*.png`; the captions are in `CAP`).
- `node video.js 443 960 2 vframes`: 630 frames of the 21 s preview (886 × 1920, 30 fps; each frame is stepped by hand, so it is smooth however slow the render), then
  `ffmpeg -framerate 30 -i vframes/f%05d.png -i ../../../audio/music/Night_theme_music.mp3 -map 0:v -map 1:a -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 256k -ar 48000 -af "afade=t=in:d=0.5,afade=t=out:st=19.5:d=1.5" -shortest -movflags +faststart preview.mp4`.
The finished set lives in `design/store/`.
