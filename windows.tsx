import { createBinding, For, This } from "ags"
import Bar from "./widgets/bar/Bar.jsx"
import DesktopClock from "./widgets/DesktopClock"
import app from "ags/gtk4/app"
import DateMenu from "./widgets/DateMenu"
import Applauncher from "./widgets/Applauncher"
import NotificationPopup from "./widgets/notification/NotificationPopup"
import NotificationWindow from "./widgets/notification/NotificationWindow"
import QSWindow from "./widgets/quicksettings/QSWindow"
import { Dock, DockHover } from "./widgets/dock/Dock"
import PowerMenu from "./widgets/powermenu/PowerMenu"
import VerificationWindow from "./widgets/powermenu/VerificationWindow"

export default function windows() {
  const monitors = createBinding(app, "monitors")

  Applauncher()
  DateMenu()
  DesktopClock()
  NotificationWindow()
  PowerMenu()
  VerificationWindow()
  QSWindow()

  return (
    <For each={monitors}>
      {(monitor) => (
        <This this={app}>
          <Bar gdkmonitor={monitor} />
          <NotificationPopup gdkmonitor={monitor} />
          <DockHover gdkmonitor={monitor} />
          <Dock gdkmonitor={monitor} />
        </This>
      )}
    </For>
  )
}
