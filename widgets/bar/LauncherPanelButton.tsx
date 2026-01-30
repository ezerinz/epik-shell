import PanelButton from "../common/PanelButton"
import { WINDOW_NAME } from "../Applauncher"
import app from "ags/gtk4/app"

export default function LauncherPanelButton() {
  return (
    <PanelButton
      window={WINDOW_NAME}
      onClicked={() => app.toggle_window(WINDOW_NAME)}
    >
      <image iconName="preferences-desktop-apps-symbolic" />
    </PanelButton>
  )
}
