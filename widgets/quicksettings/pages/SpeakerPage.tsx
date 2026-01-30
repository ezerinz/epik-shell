import { Gtk } from "ags/gtk4"
import AstalWp from "gi://AstalWp?version=0.1"
import { setQsPage } from "../QSWindow"
import { createBinding, For } from "ags"

export default function SpeakerPage() {
  const audio = AstalWp.get_default()!.audio
  const speakers = createBinding(audio, "speakers")
  return (
    <box
      $type="named"
      name={"speaker"}
      cssClasses={["speaker-page", "qs-page"]}
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
        <label label={"Speaker"} hexpand xalign={0} />
      </box>
      <Gtk.Separator />
      <For each={speakers}>
        {(speaker) => (
          <button
            cssClasses={createBinding(speaker, "isDefault").as((isD) => {
              const classes = ["button"]
              isD && classes.push("active")
              return classes
            })}
            onClicked={() => {
              speaker.set_is_default(true)
              setQsPage("main")
            }}
          >
            <box>
              <image iconName={speaker.volumeIcon} />
              <label label={speaker.description} />
            </box>
          </button>
        )}
      </For>
    </box>
  )
}
