import { Astal, Gtk } from "ags/gtk4"
import Powermenu from "../../utils/powermenu"
import PopupWindow, { Padding } from "../common/PopupWindow"

const powermenu = Powermenu.get_default()
export const WINDOW_NAME = "powermenu"

const icons: Record<string, string> = {
  sleep: "weather-clear-night-symbolic",
  reboot: "system-reboot-symbolic",
  logout: "system-log-out-symbolic",
  shutdown: "system-shutdown-symbolic",
}

function SysButton({ action, label }: { action: string; label: string }) {
  return (
    <button
      cssClasses={["system-button"]}
      onClicked={() => powermenu.action(action)}
    >
      <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
        <image iconName={icons[action]} iconSize={Gtk.IconSize.LARGE} />
        <label label={label} />
      </box>
    </button>
  )
}

export default function PowerMenu() {
  return (
    <PopupWindow
      name={WINDOW_NAME}
      exclusivity={Astal.Exclusivity.IGNORE}
      layout="full"
    >
      <box>
        <Padding horizontal windowName={WINDOW_NAME} />
        <box orientation={Gtk.Orientation.VERTICAL}>
          <Padding vertical windowName={WINDOW_NAME} />
          <Gtk.FlowBox
            cssClasses={["window-content", "powermenu-container"]}
            rowSpacing={6}
            columnSpacing={6}
            maxChildrenPerLine={4}
            $={(self) => {
              self.connect("child-activated", (_, child) => {
                child.get_child()?.activate()
              })
            }}
            homogeneous
          >
            <SysButton action={"sleep"} label={"Sleep"} />
            <SysButton action={"logout"} label={"Log Out"} />
            <SysButton action={"reboot"} label={"Reboot"} />
            <SysButton action={"shutdown"} label={"Shutdown"} />
          </Gtk.FlowBox>
          <Padding vertical windowName={WINDOW_NAME} />
        </box>
        <Padding horizontal windowName={WINDOW_NAME} />
      </box>
    </PopupWindow>
  )
}
