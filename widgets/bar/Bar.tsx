import TimePanelButton from "./TimePanelButton"
import LauncherPanelButton from "./LauncherPanelButton"
import { separatorBetween } from "../../utils"
import options from "../../options"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { onCleanup } from "ags"
import app from "ags/gtk4/app"
import { idle } from "ags/time"
import { windowAnimation } from "../../utils/hyprland"
import WorkspacesPanelButton from "./WorkspacesPanelButton"
import NotifPanelButton from "./NotifPanelButton"
import NetworkSpeedPanelButton from "./NetworkSpeedPanelButton"
import QSPanelButton from "./QSPanelButton"
import RecordIndicatorPanelButton from "./RecordIndicatorPanelButton"

const { bar } = options

function Start() {
  return (
    <box $type="start">
      {separatorBetween(
        [LauncherPanelButton(), WorkspacesPanelButton()],
        Gtk.Orientation.VERTICAL,
      )}
      <RecordIndicatorPanelButton />
    </box>
  )
}

function Center() {
  return (
    <box $type="center">
      {separatorBetween(
        [TimePanelButton({}), NotifPanelButton()],
        Gtk.Orientation.VERTICAL,
      )}
    </box>
  )
}

function End() {
  return (
    <box $type="end">
      {separatorBetween(
        [NetworkSpeedPanelButton(), QSPanelButton()],
        Gtk.Orientation.VERTICAL,
      )}
    </box>
  )
}

type BarProps = JSX.IntrinsicElements["window"] & {
  gdkmonitor: Gdk.Monitor
}

export default function Bar({ gdkmonitor, ...props }: BarProps) {
  let win: Astal.Window
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor
  const anc = bar.position.peek() == "top" ? TOP : BOTTOM

  const unsubscribe = bar.position.subscribe(() => {
    app.toggle_window("bar")
    idle(() => {
      win.anchor = (bar.position.peek() == "top" ? TOP : BOTTOM) | LEFT | RIGHT
      app.toggle_window("bar")
      windowAnimation()
    })
  })

  onCleanup(() => {
    // Root components (windows) are not automatically destroyed.
    // When the monitor is disconnected from the system, this callback
    // is run from the parent <For> which allows us to destroy the window
    win.destroy()
    unsubscribe()
  })

  return (
    <window
      visible
      $={(self) => {
        win = self

        // problem when change bar size via margin/padding live
        // https://github.com/wmww/gtk4-layer-shell/issues/60
        self.set_default_size(1, 1)
      }}
      name={"bar"}
      namespace={"bar"}
      gdkmonitor={gdkmonitor}
      anchor={anc | LEFT | RIGHT}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      application={app}
      {...props}
    >
      <centerbox cssClasses={["bar-container"]}>
        <Start />
        <Center />
        <End />
      </centerbox>
    </window>
  )
}
