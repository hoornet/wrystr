#!/bin/bash
# Manual screenshot capture for Vega.
# Run this in a terminal alongside the running app.
# Navigate to each view in Vega, then press Enter here to capture.

OUT="$(cd "$(dirname "$0")/.." && pwd)/screenshots"
mkdir -p "$OUT"

get_window() {
  hyprctl clients -j | jq -r '
    .[] | select(.class | test("vega|Vega"; "i"))
    | "\(.at[0]) \(.at[1]) \(.size[0]) \(.size[1])"
  ' | head -1
}

shot() {
  local name=$1
  local info
  info=$(get_window)
  if [[ -z "$info" ]]; then
    echo "  ERROR: Vega window not found"
    return 1
  fi
  read -r wx wy ww wh <<< "$info"
  grim -g "$wx,$wy ${ww}x${wh}" "$OUT/${name}.png"
  echo "  ✓ Saved: screenshots/${name}.png"
}

VIEWS=(
  "01-feed-global:Feed — Global tab"
  "02-feed-following:Feed — Following tab"
  "03-articles-feed:Articles feed"
  "04-article-reader:Article reader (open any article)"
  "05-article-editor:Article editor (Write article)"
  "06-media-feed:Media feed"
  "07-search:Search view"
  "08-search-results:Search — with results"
  "09-profile:Profile view (open any profile)"
  "10-thread:Thread view (open any note)"
  "11-bookmarks:Bookmarks"
  "12-direct-messages:Direct messages"
  "13-notifications:Notifications"
  "14-follows:Follows / Followers"
  "15-zap-history:Zap history"
  "16-podcasts:Podcasts"
  "17-v4v-dashboard:V4V — Dashboard tab"
  "18-relays:Relays view"
  "19-settings:Settings"
  "20-about:About / Support"
)

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     Vega Screenshot Capture — Manual Mode       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Saving to: $OUT"
echo ""
echo "Instructions:"
echo "  1. Make sure Vega is running"
echo "  2. Navigate to the view shown below"
echo "  3. Press ENTER to capture — then move to the next view"
echo "  4. Press Ctrl+C at any time to stop"
echo ""

for entry in "${VIEWS[@]}"; do
  filename="${entry%%:*}"
  description="${entry##*:}"

  echo "──────────────────────────────────────────────────"
  echo "  Navigate to: $description"
  printf "  Press Enter to capture (or 's' to skip): "
  read -r input

  if [[ "$input" == "s" || "$input" == "S" ]]; then
    echo "  ↷ Skipped"
    continue
  fi

  shot "$filename"
done

echo ""
echo "══════════════════════════════════════════════════"
echo "  Done! All screenshots saved to: screenshots/"
echo ""
ls "$OUT"/*.png 2>/dev/null | while read -r f; do
  size=$(stat -c%s "$f")
  printf "  %-45s %s KB\n" "$(basename "$f")" "$(( size / 1024 ))"
done
