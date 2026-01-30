import options from "../options"
import { bash, gsettings } from "."
import { Opt } from "./option"
import GLib from "gi://GLib?version=2.0"
import { writeFileAsync } from "ags/file"
import app from "ags/gtk4/app"
import AstalHyprland from "gi://AstalHyprland?version=0.1"

const { theme } = options
const { window, bar } = theme

export type ThemeMode = "dark" | "light"
type ShorthandProperty = {
  top: number
  right: number
  bottom?: number
  left?: number
}

async function initGtk(mode: ThemeMode, reset = false) {
  const targetDir = `${GLib.get_home_dir()}/.themes/colors.css`
  const colors = theme[mode]
  const defineColor = (key: string, value: string, alpha = 1.0) =>
    `@define-color ${key} alpha(${value}, ${alpha});`

  const gtkVar = [
    defineColor("window_bg_color", colors.bg.peek(), window.opacity.peek()),
    defineColor("view_fg_color", colors.fg.peek(), window.opacity.peek()),
    defineColor("view_bg_color", colors.bg.peek(), window.opacity.peek()),
    defineColor("sidebar_bg_color", colors.bg.peek(), window.opacity.peek()),
    defineColor("headerbar_bg_color", colors.bg.peek(), window.opacity.peek()),
    defineColor("popover_bg_color", colors.bg.peek(), window.opacity.peek()),
  ]

  // generate colors.css in $HOME/.themes/
  await writeFileAsync(targetDir, gtkVar.join("\n"))
    .then(() => {
      gsettings.set_string("color-scheme", `prefer-${mode}`)
      if (reset) {
        gsettings.reset("gtk-theme")
      }
      gsettings.set_string(
        "gtk-theme",
        `adw-gtk3${mode === "light" ? "" : "-dark"}`,
      )
    })
    .catch(console.error)
}

function shorthand(
  value: number | number[],
  length: number,
): ShorthandProperty {
  if (typeof value === "number") {
    return length <= 2
      ? { top: value, right: value }
      : { top: value, right: value, bottom: value, left: value }
  }

  const [top, right = top, bottom = top, left = right] = value
  return length <= 2 ? { top, right } : { top, right, bottom, left }
}

function applyOffsets(
  short: ShorthandProperty,
  element: typeof theme.bar | typeof theme.window,
) {
  const borderWidth = element.border_width.peek()
  const shadowHOffset = element.shadow.offset.peek()[0]
  const shadowVOffset = element.shadow.offset.peek()[1]

  short.top += borderWidth + (shadowVOffset <= 0 ? Math.abs(shadowVOffset) : 0)
  short.right += borderWidth + (shadowHOffset > 0 ? shadowHOffset : 0)
  short.bottom! += borderWidth + (shadowVOffset > 0 ? shadowVOffset : 0)
  short.left! +=
    borderWidth + (shadowHOffset <= 0 ? Math.abs(shadowHOffset) : 0)

  return short
}

function defineVar(opt: Opt, type = "string", slice = 2, arrayLength = 4) {
  const value = opt.peek()

  const typeChecks: Record<string, any> = {
    number_only: (val: any) => typeof val === "number",
    number: (val: any) => typeof val === "number",
    string: (val: any) => typeof val === "string" || typeof val === "boolean",
    number_or_array: (val: any) =>
      typeof val === "number" || Array.isArray(val),
  }

  if (!typeChecks[type](value)) {
    throw new Error(
      `Invalid value, ${opt.id} needs ${type.split("_").join(" ")}`,
    )
  }

  let modifiedVal: Record<string, number> | string | unknown
  switch (type) {
    case "number":
      modifiedVal = `${value}px`
      break
    case "number_or_array":
      let short: any = shorthand(value as number | number[], arrayLength)

      if (opt.id.startsWith("theme.window.margin")) {
        short = applyOffsets(short, window)
      }
      if (opt.id.startsWith("theme.bar.margin")) {
        const barPos = options.bar.position.peek()
        short.bottom = barPos == "top" ? 0 : short.bottom
        short.top = barPos == "bottom" ? 0 : short.top
        short = applyOffsets(short, bar)
      }
      modifiedVal = Object.keys(short)
        .map((key) => `${short[key]}px`)
        .join(" ")
      break
    default:
      modifiedVal = value
      break
  }

  const key = opt.id.split(".").slice(-slice).join("-").replace("_", "-")
  return `$${key}: ${modifiedVal};`
}

async function initScss(mode: ThemeMode) {
  const targetDir = `${SRC}/styles/variables.scss`
  const scss = `${SRC}/styles/styles.scss`
  const css = `${GLib.get_tmp_dir()}/styles.css`
  const colors = theme[mode]

  const scssVar = [
    defineVar(colors.bg, "string", 1),
    defineVar(colors.fg, "string", 1),
    defineVar(colors.accent, "string", 1),
    defineVar(colors.red, "string", 1),
    defineVar(window.opacity, "number_only"),
    defineVar(window.border_radius, "number_or_array"),
    defineVar(window.margin, "number_or_array"),
    defineVar(window.padding, "number_or_array"),
    defineVar(window.dock_padding, "number_or_array"),
    defineVar(window.desktop_clock_padding, "number_or_array"),
    defineVar(window.border_width, "number"),
    defineVar(window.border_color),
    defineVar(window.shadow.offset, "number_or_array", 3, 2),
    defineVar(window.shadow.blur, "number", 3),
    defineVar(window.shadow.spread, "number", 3),
    defineVar(window.shadow.color, "string", 3),
    defineVar(window.shadow.opacity, "number_only", 3),
    defineVar(options.bar.separator),
    defineVar(bar.border_radius, "number_or_array"),
    defineVar(bar.bg_color),
    defineVar(bar.opacity, "number_only"),
    defineVar(bar.margin, "number_or_array"),
    defineVar(bar.padding, "number_or_array"),
    defineVar(bar.border_width, "number"),
    defineVar(bar.border_color),
    defineVar(bar.shadow.offset, "number_or_array", 3, 2),
    defineVar(bar.shadow.blur, "number", 3),
    defineVar(bar.shadow.spread, "number", 3),
    defineVar(bar.shadow.color, "string", 3),
    defineVar(bar.shadow.opacity, "number_only", 3),
    defineVar(bar.button.bg_color, "string", 3),
    defineVar(bar.button.fg_color, "string", 3),
    defineVar(bar.button.opacity, "number_only", 3),
    defineVar(bar.button.padding, "number_or_array", 3),
    defineVar(bar.button.border_radius, "number_or_array", 3),
    defineVar(bar.button.border_width, "number", 3),
    defineVar(bar.button.border_color, "string", 3),
    defineVar(bar.button.shadow.offset, "number_or_array", 4, 2),
    defineVar(bar.button.shadow.blur, "number", 4),
    defineVar(bar.button.shadow.spread, "number", 4),
    defineVar(bar.button.shadow.color, "string", 4),
    defineVar(bar.button.shadow.opacity, "number_only", 4),
  ]

  await writeFileAsync(targetDir, scssVar.join("\n")).catch(console.error)
  await bash(`sass ${scss} ${css}`)
  app.apply_css(css, true)
}

export async function initHyprlandTheme(mode: ThemeMode) {
  const generateConfig = (keyword: string, value: any) => `${keyword} ${value}`
  const margin: Record<string, number> = applyOffsets(
    shorthand(window.margin.peek(), 4),
    window,
  )
  const fgColor = `rgb(${theme[mode].fg.peek().replace("#", "")})`
  const shadowOffset: Record<string, number> = shorthand(
    window.shadow.offset.peek(),
    2,
  )

  const config = [
    generateConfig("general:border_size", window.border_width.peek() - 1),
    generateConfig(
      "general:gaps_out",
      Object.keys(margin)
        .map((key) => margin[key] - 2)
        .join(","),
    ),
    generateConfig("general:col.active_border", fgColor),
    generateConfig("decoration:rounding", window.border_radius.peek()),
    generateConfig(
      "decoration:shadow:offset",
      Object.keys(shadowOffset)
        .map((key) => shadowOffset[key] - 2)
        .join(", "),
    ),
    generateConfig("decoration:shadow:color", fgColor),
  ]

  const hl = AstalHyprland.get_default()
  const cmd = config.map((c) => `keyword ${c}`).join("; ")
  return new Promise((resolve, reject) => {
    hl.message_async(`[[BATCH]]/${cmd};"`, (_, res) => {
      try {
        resolve(hl.message_finish(res))
      } catch (error) {
        reject(error)
      }
    })
  })
}

export default async function () {
  options.handler(["theme", "bar.position", "bar.separator"], async () => {
    const mode = options.theme.mode.peek() as ThemeMode
    await initGtk(mode, true).catch(console.error)
    await initScss(mode).catch(console.error)
    await initHyprlandTheme(mode).catch(console.error)
  })

  const mode = options.theme.mode.peek() as ThemeMode
  await initGtk(mode).catch(console.error)
  await initScss(mode).catch(console.error)
  await initHyprlandTheme(mode).catch(console.error)
}
