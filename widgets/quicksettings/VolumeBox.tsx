import AstalWp from "gi://AstalWp"
import { setQsPage } from "./QSWindow"
import { Gtk } from "ags/gtk4"
import { createBinding } from "ags"

export default function VolumeBox() {
  const speaker = AstalWp.get_default()?.audio!.defaultSpeaker!

  return (
    <box
      cssClasses={["qs-box", "volume-box"]}
      valign={Gtk.Align.CENTER}
      spacing={10}
    >
      <image
        iconName={createBinding(speaker, "volumeIcon")}
        valign={Gtk.Align.CENTER}
      />
      <slider
        onChangeValue={(self) => {
          speaker.volume = self.value
        }}
        value={createBinding(speaker, "volume")}
        hexpand
      />
      <button
        iconName={"go-next-symbolic"}
        onClicked={() => setQsPage("speaker")}
      />
    </box>
  )
}
