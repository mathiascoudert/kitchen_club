#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Read HOTEL_TIMEZONE from .env
TIMEZONE=$(grep '^HOTEL_TIMEZONE=' "$ENV_FILE" | cut -d'"' -f2)
if [ -z "$TIMEZONE" ]; then
  echo "Error: HOTEL_TIMEZONE not set in .env"
  exit 1
fi

# Convert 9:00 AM in hotel timezone to UTC hour using Python
UTC_HOUR=$(python3 -c "
import os, time
os.environ['TZ'] = '$TIMEZONE'
time.tzset()
local_time = time.mktime(time.strptime('2026-04-01 09:00:00', '%Y-%m-%d %H:%M:%S'))
utc_time = time.mktime(time.gmtime(local_time))
offset_hours = int((local_time - utc_time) / 3600)
utc_hour = (9 - offset_hours) % 24
print(utc_hour)
")

CRON_LINE="0 $UTC_HOUR * * 3 cd $PROJECT_DIR && npx tsx src/index.ts >> logs/cron.log 2>&1"
CRON_MARKER="# weekend-hotel-agent"

case "${1:-install}" in
  install)
    (crontab -l 2>/dev/null | grep -v "$CRON_MARKER") | { cat; echo "$CRON_LINE $CRON_MARKER"; } | crontab -
    echo "Cron job installed: every Wednesday at 9:00 AM $TIMEZONE (UTC hour: $UTC_HOUR)"
    echo "Entry: $CRON_LINE"
    ;;
  remove)
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | crontab -
    echo "Cron job removed."
    ;;
  *)
    echo "Usage: $0 [install|remove]"
    exit 1
    ;;
esac
