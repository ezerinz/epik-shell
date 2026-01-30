import AstalHyprland from "gi://AstalHyprland"
import DockApps from "./DockApps"
import options from "../../options"
import {
  createBinding,
  createComputed,
  createEffect,
  createState,
  onCleanup,
  With,
} from "ags"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import app from "ags/gtk4/app"

const hyprland = AstalHyprland.get_default()
const { TOP, BOTTOM } = Astal.WindowAnchor
const { dock } = options

const [cursorInDock, setCursorInDock] = createState(false)
const updateVisibility = () => {
  return (
    hyprland.get_workspace(hyprland.get_focused_workspace().id)?.get_clients()
      .length <= 0
  )
}

const anchor = createComputed(() => (dock.position() == "top" ? TOP : BOTTOM))

const [widthVar, setWidthVar] = createState(0)
const [heightVar, setHeightVar] = createState(0)
const getSize = (win: Gtk.Window) => win.get_child()!.get_preferred_size()[0]
const getHoverHeight = () => {
  const pos = dock.position.peek() == "top" ? 0 : 2
  const hyprlandGapsOut = hyprland
    .message("getoption general:gaps_out")
    .split("\n")[0]
    .split("custom type: ")[1]
    .split(" ")
    .map((e) => parseInt(e))
  return hyprlandGapsOut.length >= 3 ? hyprlandGapsOut[pos] : hyprlandGapsOut[0]
}

// transparent window to detect hover
export function DockHover({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  createEffect(() => {
    createBinding(hyprland, "focusedWorkspace")()
    createBinding(hyprland, "clients")()

    if (updateVisibility()) {
      app.get_window("dock")?.show()
      app.get_window("dock-hover")?.hide()
    }
    if (!updateVisibility() && !cursorInDock.peek()) {
      app.get_window("dock")?.hide()
      app.get_window("dock-hover")?.show()
    }
  })

  return (
    <With value={anchor}>
      {(a) => (
        <window
          visible={!updateVisibility()}
          name={"dock-hover"}
          namespace={"dock-hover"}
          gdkmonitor={gdkmonitor}
          $={(self) => {
            app.connect("window-toggled", (_, win) => {
              if (win.name == "dock" && win.visible) {
                self.visible = false
              }
            })

            onCleanup(() => {
              self.destroy()
            })
          }}
          layer={Astal.Layer.TOP}
          anchor={a}
          application={app}
        >
          <Gtk.EventControllerMotion
            onEnter={(source) => {
              source.widget.hide()
              app.get_window("dock")?.show()
            }}
          />
          <box
            $={(self) => {
              createEffect(() => {
                self.widthRequest = widthVar()
              })
            }}
            cssClasses={["dock-padding"]}
            heightRequest={heightVar()}
          >
            {/* I dont know why window/box not visible when there's no child/background-color */}
            {/* So I give this child and set it to transparent so I can detect hover */}
            hehe
          </box>
        </window>
      )}
    </With>
  )
}

type DockProps = JSX.IntrinsicElements["window"] & {
  gdkmonitor: Gdk.Monitor
}

export function Dock({ gdkmonitor, ...props }: DockProps) {
  return (
    <With value={anchor}>
      {(a) => (
        <window
          visible={updateVisibility()}
          name={"dock"}
          namespace={"dock"}
          layer={Astal.Layer.TOP}
          anchor={a}
          $={(self) => {
            self.connect("notify::visible", (win, _) => {
              const size = getSize(win)
              if (widthVar.peek() != size?.width) {
                setWidthVar(size!.width)
              }
            })

            const size = getSize(self)
            setWidthVar(size!.width)
            setHeightVar(getHoverHeight())

            onCleanup(() => {
              self.destroy()
            })
          }}
          application={app}
          {...props}
        >
          <Gtk.EventControllerMotion
            onEnter={() => {
              setCursorInDock(true)
            }}
            onLeave={(source) => {
              setCursorInDock(false)
              if (!updateVisibility()) {
                source.widget.hide()
                app.get_window("dock-hover")?.show()
              }
            }}
          />
          <box>
            <box hexpand />
            <DockApps />
            <box hexpand />
          </box>
        </window>
      )}
    </With>
  )
}
