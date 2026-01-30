import { Gtk } from "ags/gtk4"
import Brightness from "../../utils/brightness"

export default function BrightnessBox() {
  const brightness = Brightness.get_default()

  return (
    <box
      cssClasses={["qs-box", "brightness-box"]}
      valign={Gtk.Align.CENTER}
      spacing={10}
    >
      <image
        iconName={"display-brightness-symbolic"}
        valign={Gtk.Align.CENTER}
      />
      <slider
        onChangeValue={(self) => {
          brightness.screen = self.value
        }}
        min={0.1}
        value={brightness.screen}
        hexpand
      />
    </box>
  )
}
