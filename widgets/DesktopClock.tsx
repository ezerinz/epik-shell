import { range, time } from "../utils"
import options from "../options"
import { Astal, Gtk } from "ags/gtk4"
import app from "ags/gtk4/app"
import { Accessor, createEffect } from "ags"

function Number({ shown }: { shown: Accessor<string> }) {
  return (
    <box class="number-box" valign={Gtk.Align.CENTER} halign={Gtk.Align.CENTER}>
      <stack
        $={(self) => {
          range(9).forEach((v) => {
            self.add_named(
              new Gtk.Label({ name: v.toString(), label: v.toString() }),
              v.toString(),
            )
          })
          createEffect(() => {
            self.visible_child_name = shown()
          })
        }}
        transitionType={Gtk.StackTransitionType.SLIDE_UP}
        transitionDuration={1000}
      ></stack>
    </box>
  )
}

function UnitBox({
  label,
  shown1,
  shown2,
}: {
  label: string
  shown1: Accessor<string>
  shown2: Accessor<string>
}) {
  return (
    <box orientation={Gtk.Orientation.VERTICAL} class="unit">
      <box halign={Gtk.Align.CENTER} hexpand>
        <Number shown={shown1} />
        <Number shown={shown2} />
      </box>
      <label cssClasses={["box-label"]} label={label} />
    </box>
  )
}

export default function DesktopClock() {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor
  const handlePos = (pos: string) => {
    switch (pos) {
      case "top_left":
        return TOP | LEFT
      case "top":
        return TOP
      case "top_right":
        return TOP | RIGHT
      case "left":
        return LEFT
      case "right":
        return RIGHT
      case "bottom_left":
        return BOTTOM | LEFT
      case "bottom":
        return BOTTOM
      case "bottom_right":
        return BOTTOM | RIGHT
      default:
        return undefined as unknown as Astal.WindowAnchor
    }
  }

  return (
    <window
      $={(self) => {
        self.set_default_size(1, 1)
      }}
      visible
      layer={Astal.Layer.BOTTOM}
      name={"clock"}
      namespace={"clock"}
      anchor={options.desktop_clock.position((p) => handlePos(p))}
      application={app}
    >
      <box class="clock-container" spacing={6}>
        <UnitBox
          label={"Hours"}
          shown1={time((t) => t.format("%H")!.split("")[0])}
          shown2={time((t) => t.format("%H")!.split("")[1])}
        />
        <label label={":"} />
        <UnitBox
          label={"Minutes"}
          shown1={time((t) => t.format("%M")!.split("")[0])}
          shown2={time((t) => t.format("%M")!.split("")[1])}
        />
        <label label={":"} />
        <UnitBox
          label={"Seconds"}
          shown1={time((t) => t.format("%S")!.split("")[0])}
          shown2={time((t) => t.format("%S")!.split("")[1])}
        />
      </box>
    </window>
  )
}
