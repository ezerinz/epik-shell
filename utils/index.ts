import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createPoll } from "ags/time"
import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"
import GObject from "gi://GObject?version=2.0"

export function ensureDirectory(path: string) {
  if (!GLib.file_test(path, GLib.FileTest.EXISTS))
    Gio.File.new_for_path(path).make_directory_with_parents(null)
}

export async function launchDefaultAsync(uri: string) {
  return new Promise((resolve, reject) => {
    Gio.AppInfo.launch_default_for_uri_async(uri, null, null, (_, res) => {
      try {
        resolve(Gio.AppInfo.launch_default_for_uri_finish(res))
      } catch (error) {
        reject(error)
      }
    })
  })
}

export const now = () =>
  GLib.DateTime.new_now_local().format("%Y-%m-%d_%H-%M-%S")

export const time = createPoll(GLib.DateTime.new_now_local(), 1000, () =>
  GLib.DateTime.new_now_local(),
)

export function range(max: number) {
  return Array.from({ length: max + 1 }, (_, i) => i)
}

type NotifUrgency = "low" | "normal" | "critical"
export function notifySend({
  appName,
  appIcon,
  urgency = "normal",
  image,
  icon,
  summary,
  body,
  actions,
}: {
  appName?: string
  appIcon?: string
  urgency?: NotifUrgency
  image?: string
  icon?: string
  summary: string
  body: string
  actions?: {
    [label: string]: () => void
  }
}) {
  const actionsArray = Object.entries(actions || {}).map(
    ([label, callback], i) => ({
      id: `${i}`,
      label,
      callback,
    }),
  )
  execAsync(
    [
      "notify-send",
      `-u ${urgency}`,
      appIcon && `-i ${appIcon}`,
      `-h "string:image-path:${!!icon ? icon : image}"`,
      `"${summary ?? ""}"`,
      `"${body ?? ""}"`,
      `-a "${appName ?? ""}"`,
      ...actionsArray.map((v) => `--action=\"${v.id}=${v.label}\"`),
    ].join(" "),
  )
    .then((out) => {
      if (!isNaN(Number(out.trim())) && out.trim() !== "") {
        actionsArray[parseInt(out)].callback()
      }
    })
    .catch(console.error)
}

export async function sh(cmd: string | string[]) {
  return execAsync(cmd).catch((err) => {
    console.error(typeof cmd === "string" ? cmd : cmd.join(" "), err)
    return ""
  })
}

export async function bash(strings: string | string[], ...values: unknown[]) {
  const cmd =
    typeof strings === "string"
      ? strings
      : strings.flatMap((str, i) => str + `${values[i] ?? ""}`).join("")

  return execAsync(["bash", "-c", cmd]).catch((err) => {
    console.error(cmd, err)
    return ""
  })
}

export const gsettings = new Gio.Settings({
  schema: "org.gnome.desktop.interface",
})

export const cacheDir = `${GLib.get_user_cache_dir()}/epik-shell`

export function separatorBetween(
  elements: GObject.Object[],
  orientation: Gtk.Orientation,
) {
  const spacedElements: GObject.Object[] = []

  elements.forEach((element, index) => {
    if (index > 0) {
      spacedElements.push(new Gtk.Separator({ orientation: orientation }))
    }
    spacedElements.push(element)
  })

  return spacedElements
}
