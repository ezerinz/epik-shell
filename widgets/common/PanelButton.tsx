import { Gtk } from "ags/gtk4"
import app from "ags/gtk4/app"

type PanelButtonProps = JSX.IntrinsicElements["button"] & {
  children?: any
  window?: string
  setup?: (self: Gtk.Button) => void
}
export default function PanelButton({
  children,
  window,
  setup,
  ...props
}: PanelButtonProps) {
  return (
    <button
      cssClasses={["panel-button"]}
      $={(self) => {
        if (window) {
          let open = false

          self.add_css_class(window)

          app.connect("window-toggled", (_, win) => {
            const winName = win.name
            const visible = win.visible

            if (winName !== window) return

            if (open && !visible) {
              open = false
              self.remove_css_class("active")
            }

            if (visible) {
              open = true
              self.add_css_class("active")
            }
          })
        }

        if (setup) setup(self)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
