import AstalBluetooth from "gi://AstalBluetooth";
import { qsPage } from "../QSWindow";
import { Gtk } from "astal/gtk4";
import { bind } from "astal";
import { bash } from "../../../utils";

export default function BluetoothPage() {
  const bluetooth = AstalBluetooth.get_default();
  const btAdapter = bluetooth.adapter;
  btAdapter.start_discovery();

  return (
    <box
      name={"bluetooth"}
      cssClasses={["bluetooth-page", "qs-page"]}
      vertical
      spacing={6}
    >
      <box hexpand={false} cssClasses={["header"]} spacing={6}>
        <button
          onClicked={() => {
            qsPage.set("main");
          }}
          iconName={"go-previous-symbolic"}
        />
        <label label={"Bluetooth"} hexpand xalign={0} />
      </box>
      <Gtk.Separator />
      <Gtk.ScrolledWindow vexpand>
        <box vertical spacing={6}>
          {bind(bluetooth, "devices").as((devices) => {
            const seenNames = new Set();
            return devices
              .filter((device) => device.name && !seenNames.has(device.name))
              .map((device) => {
                seenNames.add(device.name);

                return (
                  <button
                    cssClasses={bind(device, "connected").as((connected) => {
                      const classes = ["button"];
                      connected && classes.push("active");
                      return classes;
                    })}
                    onClicked={() => {
                      if (device.connected) {
                        bash(`bluetoothctl disconnect ${device.address}`);
                      } else {
                        bash(`bluetoothctl trust ${device.address}`);
                        bash(`bluetoothctl connect ${device.address}`);
                      }
                    }}
                  >
                    <box>
                      <image iconName={device.iconName} />
                      <label label={device.name} />
                      {device.connected && (
                        <label
                          label={`Battery: ${Math.floor(device.get_battery_percentage() * 100)}%`}
                          halign={Gtk.Align.END} // Align to the right
                          hexpand={true} // Allow the label to expand
                        />
                      )}
                    </box>
                  </button>
                );
              });
          })}
        </box>
      </Gtk.ScrolledWindow>
    </box>
  );
}
