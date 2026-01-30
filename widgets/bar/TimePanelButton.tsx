import app from "ags/gtk4/app"
import { time } from "../../utils"
import PanelButton from "../common/PanelButton"
import { WINDOW_NAME } from "../DateMenu"

export default function TimePanelButton({ format = "%H:%M" }) {
  return (
    <PanelButton
      window={WINDOW_NAME}
      onClicked={() => app.toggle_window(WINDOW_NAME)}
    >
      <label label={time((t) => t.format(format)!)} />
    </PanelButton>
  )
}
