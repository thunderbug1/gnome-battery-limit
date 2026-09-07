#!/bin/bash
# Sets the battery charge end threshold. Called via pkexec from the GNOME extension.
# Usage: battery-limit-set.sh <60|80|100>
THRESHOLD="/sys/class/power_supply/BAT0/charge_control_end_threshold"
VALUE="$1"
case "$VALUE" in
    60|80|100) ;;
    *) echo "Invalid value" >&2; exit 1 ;;
esac
echo "$VALUE" > "$THRESHOLD"
