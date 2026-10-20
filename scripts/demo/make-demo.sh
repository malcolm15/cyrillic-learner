#!/bin/bash
#
# Regenerates both /teachers demo clips from the live site, end to end.
#
#   scripts/demo/make-demo.sh <output-dir> [chrome-port]
#
# Produces, in <output-dir>:
#   quiz-demo-wide.mp4           988x654, shown at 560px and wider
#   quiz-demo-phone.mp4          480x718, shown below 560px
#   quiz-demo-<kind>-poster.png  the correct-feedback frame
#   quiz-demo-<kind>-poster.webp the same frame, encoded by Chrome
#
# Copy those into media/teachers/ under the NEXT version number, never over an
# existing name: /media/* is cached immutably precisely because the bytes behind
# a name never change. scripts/pre-render.js then checks the sizes and the
# markup. This script deliberately does not write into media/ itself.
#
# NOTHING HERE DELETES OR OVERWRITES ANYTHING. Give it a fresh or empty output
# directory each run: if any file it would write is already there it refuses up
# front, before Chrome starts, rather than replacing a previous run's clips. The
# one deletion in the whole toolchain is this script removing its own mktemp
# working directory on exit.
#
# Nothing under scripts/demo is referenced by the build or served: _redirects
# answers /scripts/* with a 404, and netlify.toml only runs
# generate-article-heads.js and pre-render.js.
#
# Dependencies, all four: Google Chrome, swift (from the Command Line Tools),
# node and python3. node runs the recorders and the WebP step, python3 reads the
# frame manifests and computes the clip timeline. No ffmpeg, no npm packages,
# nothing to install.
#
# A note on what the recorder does to the page, because it matters when reading
# the output: it injects a stylesheet that enlarges the empty space around the
# study card, and nothing else. The page's own clean background is only 10px
# above the card and 16 to 20px below it, so no fixed crop could hold both the
# selection state and the quiz state with a visible margin. The card itself is
# untouched; the only visible effect is on background the crop excludes.
#
# Chrome runs headless with a throwaway profile, bound to 127.0.0.1, and both
# the browser and the profile are removed on exit including on failure.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${1:-}"
PORT="${2:-9470}"
if [ -z "$OUT" ]; then
    echo "usage: $0 <output-dir> [chrome-port]" >&2
    exit 2
fi
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"

# Refuse before anything starts if a previous run's output is in the way. These
# are every file this script and the tools it calls write into $OUT.
WOULD_WRITE=(
    quiz-demo-wide.mp4 quiz-demo-wide-poster.png quiz-demo-wide-poster.webp
    quiz-demo-wide-seam-first.png quiz-demo-wide-seam-last.png
    quiz-demo-phone.mp4 quiz-demo-phone-poster.png quiz-demo-phone-poster.webp
    quiz-demo-phone-seam-first.png quiz-demo-phone-seam-last.png
    loop-test.html
)
CLASH=()
for f in "${WOULD_WRITE[@]}"; do
    if [ -e "$OUT/$f" ]; then CLASH+=("$f"); fi
done
if [ "${#CLASH[@]}" -gt 0 ]; then
    echo "refusing to run: $OUT already contains ${#CLASH[@]} file(s) this run would write:" >&2
    printf '  %s\n' "${CLASH[@]}" >&2
    echo "Nothing here deletes or overwrites. Give a fresh or empty output directory." >&2
    exit 2
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found at $CHROME" >&2; exit 1; }
command -v swift >/dev/null || { echo "swift not found; install the Command Line Tools" >&2; exit 1; }
command -v node >/dev/null || { echo "node not found" >&2; exit 1; }
command -v python3 >/dev/null || { echo "python3 not found" >&2; exit 1; }

WORK="$(mktemp -d "${TMPDIR:-/tmp}/cyrilica-demo.XXXXXX")"
PROFILE="$WORK/chrome-profile"
CHROME_PID=""
cleanup() {
    if [ -n "$CHROME_PID" ]; then kill "$CHROME_PID" 2>/dev/null || true; fi
    # Only ever the directory this run created, named by mktemp.
    if [ -n "${WORK:-}" ] && [ -d "$WORK" ]; then rm -rf "$WORK"; fi
}
trap cleanup EXIT

echo "=== launching headless Chrome on 127.0.0.1:$PORT with a throwaway profile ==="
"$CHROME" --headless=new \
    --remote-debugging-port="$PORT" --remote-debugging-address=127.0.0.1 \
    --user-data-dir="$PROFILE" --no-first-run --no-default-browser-check --hide-scrollbars \
    about:blank >"$WORK/chrome.log" 2>&1 &
CHROME_PID=$!
for _ in $(seq 1 40); do
    if curl -s -o /dev/null "http://127.0.0.1:$PORT/json/version"; then break; fi
    sleep 0.4
done
curl -s -o /dev/null "http://127.0.0.1:$PORT/json/version" || { echo "Chrome did not come up" >&2; exit 1; }

HOLD=1.9        # seconds the incorrect-feedback frame is held
TAIL=1.0        # seconds the final frame rests before the loop repeats

# The correct-feedback frame is NOT held: the hold froze the confetti mid-air,
# which reads as a glitch rather than a pause.
make_one() {
    local kind="$1" recorder="$2" bitrate="$3"
    local frames="$WORK/frames-$kind"
    local mp4="$OUT/quiz-demo-$kind.mp4"

    echo
    echo "=== recording $kind ==="
    node "$HERE/$recorder" "$PORT" "$frames"

    local holdframe
    holdframe="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['marks']['incorrectFeedback']['frame'])" "$frames/manifest.json")"

    echo
    echo "=== encoding $kind (hold on frame $holdframe) ==="
    local enc
    enc="$(swift "$HERE/encode.swift" "$frames" "$mp4" "$HOLD" "$bitrate" "$TAIL" "$holdframe")"
    echo "$enc"
    local hstart hend
    hstart="$(printf '%s\n' "$enc" | sed -n 's/.*hold at frame [0-9]*: starts \([0-9.]*\)s.*/\1/p')"
    hend="$(printf '%s\n' "$enc" | sed -n 's/.*hold at frame [0-9]*: .*next frame \([0-9.]*\)s.*/\1/p')"

    local postert
    postert="$(python3 "$HERE/timeline.py" "$frames" "$HOLD" "$TAIL" "$holdframe" \
               | awk '$1=="correctFeedback"{print $4}')"

    echo
    echo "=== verifying $kind: the hold, and a still for the poster ==="
    swift "$HERE/verify-holds.swift" "$mp4" "$OUT" "quiz-demo-$kind-" \
        "holds=$hstart:$hend" "stills=poster@$postert"
    node "$HERE/towebp.mjs" "$PORT" "$OUT/quiz-demo-$kind-poster.png" "$OUT/quiz-demo-$kind-poster.webp" 0.82

    echo
    echo "=== verifying $kind: the rest at the end is real samples ==="
    swift "$HERE/samples.swift" "$mp4"

    echo
    echo "=== verifying $kind: the loop seam, first source frame against the last ==="
    local last
    last="$(python3 -c "import json,sys;print('%05d' % (len(json.load(open(sys.argv[1]))['frames'])-1))" "$frames/manifest.json")"
    swift "$HERE/imgdiff.swift" "$frames/00000.png" "$frames/$last.png"
}

make_one wide  record-wide.mjs  900000
make_one phone record-phone.mjs 600000

cp "$HERE/loop-test.html" "$OUT/loop-test.html"

echo
echo "=== done ==="
ls -l "$OUT" | sed 's/^/  /'
cat <<NOTE

Next steps:
  1. Watch them. open "$OUT/quiz-demo-wide.mp4"
  2. Optional deeper check, how they behave looping in a real browser:
       node $HERE/serve.mjs "$OUT" 8711 &
       node $HERE/loop-check.mjs <chrome-port> 8711 52
  3. Copy into the repo under the next version number, for example:
       cp "$OUT/quiz-demo-wide.mp4"         media/teachers/quiz-demo-wide-v2.mp4
       cp "$OUT/quiz-demo-wide-poster.webp" media/teachers/quiz-demo-wide-poster-v2.webp
     then update the paths in scripts/standalone-pages.js and rebuild.
NOTE
