#!/bin/bash
set -euo pipefail

# Generate the launchd plist from simple shell variables instead of editing XML.
# Usage:
#   ./automation/make-morning-plist.sh
#   ./automation/make-morning-plist.sh 08:30
#   MORNING_HOUR=7 MORNING_MINUTE=0 ./automation/make-morning-plist.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/automation/io.career-ops.daily-refresh.plist}"

HOUR="${MORNING_HOUR:-7}"
MINUTE="${MORNING_MINUTE:-0}"
if [[ $# -ge 1 && "$1" =~ ^([0-9]{1,2}):([0-9]{2})$ ]]; then
  HOUR="${BASH_REMATCH[1]}"
  MINUTE="${BASH_REMATCH[2]}"
fi

cat > "$OUT" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.career-ops.daily-refresh</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$ROOT/automation/daily-morning.sh</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>CAREER_OPS_ROOT</key>
    <string>$ROOT</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>$ROOT</string>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>$HOUR</integer>
    <key>Minute</key>
    <integer>$MINUTE</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>$ROOT/data/daily-refresh.log</string>
  <key>StandardErrorPath</key>
  <string>$ROOT/data/daily-refresh.log</string>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
EOF

echo "Wrote $OUT for $HOUR:$MINUTE"
