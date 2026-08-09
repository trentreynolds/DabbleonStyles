#!/usr/bin/env bash
# Downloads the OFL font files from the upstream Google Fonts repository,
# along with their licenses. Run from the repo root:
#   bash scripts/fetch-fonts.sh [target-dir]
#
# Default target is ./fonts (gitignored — fonts are fetched, not vendored,
# so this repo stays text-only and diffable).

set -euo pipefail
TARGET="${1:-fonts}"
BASE="https://raw.githubusercontent.com/google/fonts/main/ofl"
mkdir -p "$TARGET"

echo "Fetching Jost (variable) …"
curl -fsSL "$BASE/jost/Jost%5Bwght%5D.ttf" -o "$TARGET/Jost[wght].ttf"
curl -fsSL "$BASE/jost/OFL.txt"            -o "$TARGET/Jost-OFL.txt"

echo "Fetching Spectral (static weights) …"
for w in Regular Italic Medium SemiBold; do
  curl -fsSL "$BASE/spectral/Spectral-$w.ttf" -o "$TARGET/Spectral-$w.ttf"
done
curl -fsSL "$BASE/spectral/OFL.txt" -o "$TARGET/Spectral-OFL.txt"

echo
echo "Done. Files in $TARGET/"
echo "Both families are SIL Open Font License 1.1 — keep the OFL.txt files"
echo "alongside them wherever they are redistributed."
