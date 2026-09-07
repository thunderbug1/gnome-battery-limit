import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const THRESHOLD_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const HELPER = '/usr/local/bin/battery-limit-set';

const BatteryLimitIndicator = GObject.registerClass(
class BatteryLimitIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Battery Charge Limit', false);

        this._icon = new St.Icon({
            icon_name: 'battery-full-charging-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(this._icon);

        this._fullItem = new PopupMenu.PopupMenuItem(_('Charge to 100%'), {
            reactive: true,
        });
        this._limitItem = new PopupMenu.PopupMenuItem(_('Limit to 80% (protect battery)'), {
            reactive: true,
        });
        this._fullItem.setOrnament(PopupMenu.Ornament.DOT);
        this._limitItem.setOrnament(PopupMenu.Ornament.NONE);

        this.menu.addMenuItem(this._fullItem);
        this.menu.addMenuItem(this._limitItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._statusItem = new PopupMenu.PopupMenuItem('', {reactive: false});
        this.menu.addMenuItem(this._statusItem);

        this._fullItem.connect('activate', () => this._setThreshold(100));
        this._limitItem.connect('activate', () => this._setThreshold(80));

        this._readThreshold();
        this._monitor = null;
        this._setupMonitor();
    }

    _setupMonitor() {
        const file = Gio.File.new_for_path(THRESHOLD_PATH);
        try {
            this._monitor = file.monitor_file(Gio.FileMonitorFlags.NONE, null);
            this._monitor.connect('changed', () => this._readThreshold());
        } catch (e) {
            // monitoring not critical
        }
    }

    _readThreshold() {
        try {
            const [, contents] = GLib.file_get_contents(THRESHOLD_PATH);
            const value = parseInt(new TextDecoder().decode(contents).trim());
            this._updateOrnaments(value);
        } catch (e) {
            this._statusItem.label.text = _('Threshold unavailable');
        }
    }

    _updateOrnaments(value) {
        const full = value >= 100;
        this._fullItem.setOrnament(full ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
        this._limitItem.setOrnament(full ? PopupMenu.Ornament.NONE : PopupMenu.Ornament.DOT);
        this._icon.icon_name = full
            ? 'battery-full-charging-symbolic'
            : 'battery-good-charging-symbolic';
        this._statusItem.label.text = _('Current limit: %d%%').format(value);
    }

    _setThreshold(value) {
        this._statusItem.label.text = _('Setting to %d%%…').format(value);
        try {
            const [ok, pid] = GLib.spawn_async(
                null,
                ['pkexec', HELPER, String(value)],
                null,
                GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                null);
            GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (p, status) => {
                GLib.spawn_close_pid(p);
                const success = GLib.spawn_check_exit_status(status);
                if (!success)
                    this._statusItem.label.text = _('Failed (cancelled?)');
                this._readThreshold();
            });
        } catch (e) {
            this._statusItem.label.text = _('Failed: %s').format(e.message);
        }
    }

    destroy() {
        if (this._monitor)
            this._monitor.cancel();
        super.destroy();
    }
});

export default class BatteryLimitExtension extends Extension {
    enable() {
        this._indicator = new BatteryLimitIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'right');
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
