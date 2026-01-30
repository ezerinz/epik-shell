import AstalHyprland from "gi://AstalHyprland?version=0.1"
import options from "../options"
import app from "ags/gtk4/app"
import { initHyprlandTheme, ThemeMode } from "./styles"

const hyprland = AstalHyprland.get_default()
const { bar } = options

export const sendBatch = (batch: string[]) => {
  const cmd = batch
    .filter((x) => !!x)
    .map((x) => `keyword ${x}`)
    .join("; ")

  hyprland.message(`[[BATCH]]/${cmd}`)
}

const animationConfig: Record<string, string> = {
  bar: "slide top",
  "datemenu-window": "slide top",
  quicksettings: "slide top",
  notifications: "slide top",
  powermenu: "popin 90%",
  verification: "popin 90%",
}

const windowsAnimation = () =>
  Object.values(app.get_windows()).map(
    (win: JSX.IntrinsicElements["window"]) => {
      return {
        namespace: win.namespace,
        animation:
          animationConfig[(win.namespace as string | undefined) ?? ""] ??
          "popin 70%",
      }
    },
  )

export function windowAnimation() {
  sendBatch(
    windowsAnimation().map(({ namespace, animation }) => {
      const resolvedAnimation =
        namespace === "dock"
          ? `slide ${options.dock.position.peek()}`
          : animation === "slide top"
            ? `slide ${bar.position.peek()}`
            : animation

      return `layerrule animation ${resolvedAnimation}, match:namespace ${namespace}`
    }),
  )
}

function windowBlur() {
  const noIgnorealpha = ["verification", "powermenu"]

  sendBatch(
    app
      .get_windows()
      .flatMap(({ namespace }: JSX.IntrinsicElements["window"]) => {
        return [
          `layerrule blur on, match:namespace ${namespace}`,
          noIgnorealpha.some((skip) => (namespace as string).includes(skip))
            ? ""
            : `layerrule ignore_alpha 0.3, match:namespace ${namespace}`,
        ]
      }),
  )
}

export default function initHyprland() {
  windowAnimation()
  windowBlur()

  hyprland.connect("config-reloaded", () => {
    windowAnimation()
    windowBlur()
    initHyprlandTheme(options.theme.mode.peek() as ThemeMode)
  })
}
