import AstalNetwork from "gi://AstalNetwork"
import { setQsPage } from "../QSWindow"
import { bash } from "../../../utils"
import { Gtk } from "ags/gtk4"
import { createBinding, For, With } from "ags"

export default function WifiPage() {
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")
  const filterSsid = (aps: AstalNetwork.AccessPoint[]) => {
    return aps.filter((ap) => !!ap.ssid).sort((a, b) => b.strength - a.strength)
  }

  return (
    <box
      $type="named"
      name={"wifi"}
      cssClasses={["wifi-page", "qs-page"]}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={6}
    >
      <box hexpand={false} cssClasses={["header"]} spacing={6}>
        <button
          onClicked={() => {
            setQsPage("main")
          }}
          iconName={"go-previous-symbolic"}
        />
        <label label={"Wi-Fi"} hexpand xalign={0} />
      </box>
      <Gtk.Separator />
      <box visible={wifi(Boolean)}>
        <With value={wifi}>
          {(wifi) =>
            wifi && (
              <Gtk.ScrolledWindow vexpand hexpand>
                <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
                  <For each={createBinding(wifi, "accessPoints")(filterSsid)}>
                    {(ap: AstalNetwork.AccessPoint) => (
                      <button
                        cssClasses={createBinding(wifi, "activeAccessPoint").as(
                          (activeAp) => {
                            const classes = ["button"]
                            activeAp == ap && classes.push("active")
                            return classes
                          },
                        )}
                        onClicked={() => {
                          bash(`nmcli device wifi connect ${ap.bssid}`)
                        }}
                      >
                        <box>
                          <image iconName={ap.iconName} />
                          <label label={ap.ssid} />
                        </box>
                      </button>
                    )}
                  </For>
                </box>
              </Gtk.ScrolledWindow>
            )
          }
        </With>
      </box>
    </box>
  )
}
