import app from "ags/gtk4/app"
import ScreenRecord from "../../../utils/screenrecord"
import QSButton from "../QSButton"
import { WINDOW_NAME } from "../QSWindow"
import { timeout } from "ags/time"

export default function ScreenshotQS() {
  const screenRecord = ScreenRecord.get_default()

  return (
    <QSButton
      onClicked={() => {
        app.toggle_window(WINDOW_NAME)
        timeout(200, () => {
          screenRecord.screenshot()
        })
      }}
      label={"Screenshot"}
      iconName={"gnome-screenshot-symbolic"}
    ></QSButton>
  )
}
