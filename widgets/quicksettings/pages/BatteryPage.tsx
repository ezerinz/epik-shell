import AstalPowerProfiles from "gi://AstalPowerProfiles"
import { setQsPage } from "../QSWindow"
import { Gtk } from "ags/gtk4"
import { createBinding } from "ags"

export default function BatteryPage() {
  const powerprofiles = AstalPowerProfiles.get_default()
  return (
    <box
      $type="named"
      name={"battery"}
      cssClasses={["battery-page", "qs-page"]}
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
        <label label={"Battery"} hexpand xalign={0} />
      </box>
      <Gtk.Separator />
      {powerprofiles.get_profiles().map((p) => {
        return (
          <button
            cssClasses={createBinding(powerprofiles, "activeProfile").as(
              (active) => {
                const classes = ["button"]
                active === p.profile && classes.push("active")
                return classes
              },
            )}
            onClicked={() => {
              powerprofiles.set_active_profile(p.profile)
              setQsPage("main")
            }}
          >
            <box>
              <image iconName={`power-profile-${p.profile}-symbolic`} />
              <label
                label={p.profile
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              />
            </box>
          </button>
        )
      })}
    </box>
  )
}
