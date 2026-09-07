# Battery Charge Limit — GNOME Shell Extension

A minimal GNOME Shell top-bar extension to switch your laptop battery between
**charging to 100%** and **limiting to 80%** for long-term battery health.

Uses the standard Linux kernel sysfs interface
(`/sys/class/power_supply/BAT0/charge_control_end_threshold`), which is
supported by most modern ASUS, LG, Huawei, and some other laptops
(check: `ls /sys/class/power_supply/BAT0/ | grep threshold`).

## Features

- Top-bar indicator with a menu:
  - **Charge to 100%** — full capacity when you need it
  - **Limit to 80% (protect battery)** — reduces battery wear when plugged in long term
- Shows the current limit and keeps in sync with external changes (file monitor)
- No repeated password prompts: a polkit policy allows the active user to run a
  tiny fixed helper script (`battery-limit-set`, values restricted to 60/80/100)

## Requirements

- GNOME Shell 45–50
- Linux with `charge_control_end_threshold` support
- `pkexec` (polkit, preinstalled on most distros)

## Install

1. Clone the repo and copy the extension into your local extensions folder:

   ```bash
   git clone https://github.com/thunderbug1/gnome-battery-limit.git
   mkdir -p ~/.local/share/gnome-shell/extensions/battery-limit@thinx
   cp gnome-battery-limit/src/extension.js gnome-battery-limit/src/metadata.json \
      ~/.local/share/gnome-shell/extensions/battery-limit@thinx/
   ```

2. Install the helper script and polkit rule (one password prompt):

   ```bash
   sudo install -m 755 gnome-battery-limit/src/battery-limit-set.sh /usr/local/bin/battery-limit-set
   sudo install -m 644 gnome-battery-limit/src/com.thinx.battery-limit.policy \
      /usr/share/polkit-1/actions/com.thinx.battery-limit.policy
   ```

3. Restart GNOME Shell:
   - **X11**: Alt+F2, type `r`, Enter
   - **Wayland**: log out and back in

4. Enable it:

   ```bash
   gnome-extensions enable battery-limit@thinx
   ```

## Security notes

The polkit rule permits the **active local user** to execute
`/usr/local/bin/battery-limit-set` without a password. The script only writes
a value from the fixed set {60, 80, 100} to the battery threshold sysfs file,
so it cannot be abused to run arbitrary commands.

## License

MIT
