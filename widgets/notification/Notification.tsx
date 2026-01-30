import Pango from "gi://Pango"
import AstalNotifd from "gi://AstalNotifd"
import GLib from "gi://GLib?version=2.0"
import { Gtk } from "ags/gtk4"
import Adw from "gi://Adw?version=1"

const time = (time: number, format = "%H:%M") =>
  GLib.DateTime.new_from_unix_local(time).format(format)

const isIcon = (icon: string) => {
  const iconTheme = new Gtk.IconTheme()
  return iconTheme.has_icon(icon)
}

const fileExists = (path: string) => GLib.file_test(path, GLib.FileTest.EXISTS)

const urgency = (n: AstalNotifd.Notification) => {
  const { LOW, NORMAL, CRITICAL } = AstalNotifd.Urgency

  switch (n.urgency) {
    case LOW:
      return "low"
    case CRITICAL:
      return "critical"
    case NORMAL:
    default:
      return "normal"
  }
}

export default function Notification({
  n,
  showActions = true,
}: {
  n: AstalNotifd.Notification
  showActions?: boolean
}) {
  return (
    <Adw.Clamp maximumSize={400}>
      <box
        name={n.id.toString()}
        cssClasses={["window-content", "notification-container", urgency(n)]}
        hexpand={false}
        vexpand={false}
        widthRequest={400}
      >
        <box orientation={Gtk.Orientation.VERTICAL}>
          <box cssClasses={["header"]}>
            {(n.appIcon || n.desktopEntry) && (
              <image
                cssClasses={["app-icon"]}
                visible={!!(n.appIcon || n.desktopEntry)}
                iconName={n.appIcon || n.desktopEntry}
              />
            )}
            <label
              cssClasses={["app-name"]}
              halign={Gtk.Align.START}
              label={n.appName || "Unknown"}
            />
            <label
              cssClasses={["time"]}
              hexpand
              halign={Gtk.Align.END}
              label={time(n.time)!}
            />
            <button onClicked={() => n.dismiss()}>
              <image iconName={"window-close-symbolic"} />
            </button>
          </box>
          <Gtk.Separator visible orientation={Gtk.Orientation.HORIZONTAL} />
          <box cssClasses={["content"]} spacing={10}>
            {n.image && fileExists(n.image) && (
              <box valign={Gtk.Align.START} cssClasses={["image"]}>
                <image file={n.image} overflow={Gtk.Overflow.HIDDEN} />
              </box>
            )}
            {n.image && isIcon(n.image) && (
              <box cssClasses={["icon-image"]} valign={Gtk.Align.START}>
                <image
                  iconName={n.image}
                  iconSize={Gtk.IconSize.LARGE}
                  halign={Gtk.Align.CENTER}
                  valign={Gtk.Align.CENTER}
                />
              </box>
            )}
            <box orientation={Gtk.Orientation.VERTICAL}>
              <label
                cssClasses={["summary"]}
                ellipsize={Pango.EllipsizeMode.END}
                halign={Gtk.Align.START}
                xalign={0}
                label={n.summary}
              />
              {n.body && (
                <label
                  cssClasses={["body"]}
                  label={n.body}
                  ellipsize={Pango.EllipsizeMode.END}
                  halign={Gtk.Align.START}
                  xalign={0}
                />
              )}
            </box>
          </box>
          {showActions && n.get_actions().length > 0 && (
            <box cssClasses={["actions"]} spacing={6}>
              {n.get_actions().map(({ label, id }) => (
                <button hexpand onClicked={() => n.invoke(id)}>
                  <label
                    label={label}
                    halign={Gtk.Align.CENTER}
                    hexpand
                    maxWidthChars={30}
                    wrap
                  />
                </button>
              ))}
            </box>
          )}
        </box>
      </box>
    </Adw.Clamp>
  )
}
