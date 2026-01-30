import { createComputed, With } from "ags"
import options from "../options"
import PopupWindow from "./common/PopupWindow"
import { Gtk } from "ags/gtk4"

export const WINDOW_NAME = "datemenu-window"

const { bar } = options

export default function DateMenu() {
  const layout = createComputed(() => {
    return `${bar.position()}_center`
  })

  return (
    <With value={layout}>
      {(l) => (
        <PopupWindow name={WINDOW_NAME} layout={l}>
          <box
            orientation={Gtk.Orientation.VERTICAL}
            cssClasses={["window-content", "datemenu-container"]}
          >
            <Gtk.Calendar />
          </box>
        </PopupWindow>
      )}
    </With>
  )
}
