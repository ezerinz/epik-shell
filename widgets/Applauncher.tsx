import Pango from "gi://Pango"
import AstalApps from "gi://AstalApps"
import options from "../options"
import app from "ags/gtk4/app"
import { Gtk } from "ags/gtk4"
import { createComputed, createState, For } from "ags"
import Gio from "gi://Gio?version=2.0"
import PopupWindow from "./common/PopupWindow"

const { wallpaper } = options

export const WINDOW_NAME = "applauncher"
const apps = new AstalApps.Apps()
const [text, setText] = createState("")

function hide() {
  app.get_window(WINDOW_NAME)?.set_visible(false)
}

function AppButton({ app }: { app: AstalApps.Application }) {
  return (
    <button
      cssClasses={["app-button"]}
      onClicked={() => {
        hide()
        app.launch()
      }}
    >
      <box>
        <image iconName={app.iconName} />
        <box valign={Gtk.Align.CENTER} orientation={Gtk.Orientation.VERTICAL}>
          <label
            cssClasses={["name"]}
            ellipsize={Pango.EllipsizeMode.END}
            xalign={0}
            label={app.name}
          />
          {app.description && (
            <label
              cssClasses={["description"]}
              wrap
              xalign={0}
              label={app.description}
            />
          )}
        </box>
      </box>
    </button>
  )
}

function SearchEntry() {
  const onEnter = () => {
    apps.fuzzy_query(text())?.[0].launch()
    hide()
  }

  return (
    <overlay cssClasses={["entry-overlay"]} heightRequest={100}>
      <Gtk.ScrolledWindow heightRequest={100}>
        <Gtk.Picture
          file={wallpaper.current((w) => Gio.file_new_for_path(w))}
          contentFit={Gtk.ContentFit.COVER}
          overflow={Gtk.Overflow.HIDDEN}
        />
      </Gtk.ScrolledWindow>
      <entry
        $type="overlay"
        vexpand
        primaryIconName={"system-search-symbolic"}
        placeholderText="Search..."
        text={text.peek()}
        $={(self) => {
          app.connect("window-toggled", (_, win) => {
            const winName = win.name
            const visible = win.visible

            if (winName == WINDOW_NAME && visible) {
              setText("")
              self.set_text("")
              self.grab_focus()
            }
          })
        }}
        onNotifyText={({ text }) => {
          setText(text)
        }}
        onActivate={onEnter}
      />
    </overlay>
  )
}

function AppsScrolledWindow() {
  const list = createComputed(() => apps.fuzzy_query(text()))

  return (
    <Gtk.ScrolledWindow vexpand={true}>
      <box spacing={6} orientation={Gtk.Orientation.VERTICAL}>
        <For each={list}>{(app) => <AppButton app={app} />}</For>
        <box
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          cssClasses={["not-found"]}
          orientation={Gtk.Orientation.VERTICAL}
          vexpand={true}
          visible={list.as((l) => l.length === 0)}
        >
          <image
            iconName="system-search-symbolic"
            iconSize={Gtk.IconSize.LARGE}
          />
          <label label="No match found" />
        </box>
      </box>
    </Gtk.ScrolledWindow>
  )
}

export default function Applauncher() {
  return (
    <PopupWindow name={WINDOW_NAME}>
      <box
        cssClasses={["window-content", "applauncher-container"]}
        orientation={Gtk.Orientation.VERTICAL}
        vexpand={false}
      >
        <SearchEntry />
        <AppsScrolledWindow />
      </box>
    </PopupWindow>
  )
}
