import AstalNotifd from "gi://AstalNotifd"
import PanelButton from "../common/PanelButton"
import AstalApps from "gi://AstalApps"
import { WINDOW_NAME } from "../notification/NotificationWindow"
import { Accessor, createBinding, createConnection, For, With } from "ags"
import app from "ags/gtk4/app"

const notifd = AstalNotifd.get_default()
const dndBind = createBinding(notifd, "dontDisturb")

function NotifIcon() {
  const getVisible = () =>
    notifd.dont_disturb ? true : notifd.notifications.length <= 0

  const visibility = createConnection(
    getVisible(),
    [notifd, "notify::dont-disturb", (_, __) => getVisible()],
    [notifd, "notify::notifications", (_, __) => getVisible()],
  )

  return (
    <image
      visible={visibility()}
      cssClasses={["icon"]}
      iconName={dndBind(
        (dnd) => `notifications-${dnd ? "disabled-" : ""}symbolic`,
      )}
    />
  )
}

export default function NotifPanelButton() {
  const apps = new AstalApps.Apps()
  const substitute: Record<string, string> = {
    "Screen Recorder": "screencast-recorded-symbolic",
    Screenshot: "screenshot-recorded-symbolic",
    Hyprpicker: "color-select-symbolic",
  }

  const notifications = createBinding(notifd, "notifications")

  return (
    <PanelButton
      window={WINDOW_NAME}
      onClicked={() => {
        app.toggle_window(WINDOW_NAME)
      }}
    >
      <With value={notifications}>
        {(notifs) =>
          notifs.length == 0 ? (
            <NotifIcon />
          ) : (
            <box spacing={6}>
              <For
                each={notifications((n) => (n.length > 3 ? n.slice(0, 3) : n))}
              >
                {(n: AstalNotifd.Notification) => {
                  const getFallback = (appName: string) => {
                    const getApp = apps.fuzzy_query(appName)
                    if (getApp.length != 0) {
                      return getApp[0].get_icon_name()
                    }
                    return "unknown"
                  }
                  const fallback =
                    n.app_icon.trim() === ""
                      ? getFallback(n.app_name)
                      : n.app_icon
                  const icon = substitute[n.app_name] ?? fallback
                  return <image iconName={icon} />
                }}
              </For>
              <label
                visible={notifications((n) => n.length > 3)}
                cssClasses={["circle"]}
                label={""}
              />
            </box>
          )
        }
      </With>
    </PanelButton>
  )
}
