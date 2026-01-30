import { onCleanup } from "ags"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import app from "ags/gtk4/app"
import Graphene from "gi://Graphene?version=1.0"

export function Padding({
  horizontal = false,
  vertical = false,
  windowName,
}: {
  horizontal?: boolean
  vertical?: boolean
  windowName: string
}) {
  return (
    <box hexpand={horizontal} vexpand={vertical}>
      <Gtk.GestureClick
        onReleased={() => {
          app.toggle_window(windowName)
        }}
      />
    </box>
  )
}

function calculateAnchor(position: string) {
  const { TOP, RIGHT, BOTTOM, LEFT } = Astal.WindowAnchor

  switch (position) {
    case "top":
      return TOP | LEFT | RIGHT
    case "top_center":
      return TOP
    case "top_left":
      return TOP | LEFT
    case "top_right":
      return TOP | RIGHT
    case "bottom":
      return BOTTOM | LEFT | RIGHT
    case "bottom_center":
      return BOTTOM
    case "bottom_left":
      return BOTTOM | LEFT
    case "bottom_right":
      return BOTTOM | RIGHT
    case "full":
      return TOP | BOTTOM | LEFT | RIGHT
    default:
      return undefined
  }
}

type PopupWindowProps = JSX.IntrinsicElements["window"] & {
  children?: any
  name: string
  visible?: boolean
  animation?: string
  layout?: string
  setup?: (self: Astal.Window) => void
}

export default function PopupWindow({
  children,
  name,
  visible,
  layout = "center",
  setup,
  ...props
}: PopupWindowProps) {
  let win: Astal.Window
  onCleanup(() => {
    win.destroy()
  })

  return (
    <window
      $={(self) => {
        win = self
        if (setup) setup(self)
      }}
      visible={visible ?? false}
      name={name}
      namespace={name}
      layer={Astal.Layer.TOP}
      keymode={Astal.Keymode.EXCLUSIVE}
      application={app}
      anchor={calculateAnchor(layout)}
      {...props}
    >
      <Gtk.EventControllerKey
        onKeyPressed={({ widget: win }, key: number) => {
          if (key === Gdk.KEY_Escape) {
            win.hide()
            return true
          }
        }}
      />
      <Gtk.GestureClick
        onReleased={({ widget: win }, _, x, y) => {
          const [, rect] = children.compute_bounds(win)
          const position = new Graphene.Point({ x, y })

          if (!rect.contains_point(position)) {
            win.visible = false
            return true
          }
          return false
        }}
      />

      {children}
    </window>
  )
}
