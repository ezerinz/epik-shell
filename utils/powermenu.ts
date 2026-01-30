import { getter, register } from "ags/gobject"
import app from "ags/gtk4/app"
import GObject from "gi://GObject?version=2.0"

const options = {
  sleep: "systemctl suspend",
  reboot: "systemctl reboot",
  logout: "pkill Hyprland",
  shutdown: "shutdown now",
}

@register({ GTypeName: "Powermenu" })
export default class Powermenu extends GObject.Object {
  static instance: Powermenu

  static get_default() {
    if (!this.instance) this.instance = new Powermenu()
    return this.instance
  }

  #title = ""
  #cmd = ""

  @getter(String)
  get title() {
    return this.#title
  }

  @getter(String)
  get cmd() {
    return this.#cmd
  }

  action(action: string) {
    ;[this.#cmd, this.#title] = {
      sleep: [options.sleep, "Sleep"],
      reboot: [options.reboot, "Reboot"],
      logout: [options.logout, "Log Out"],
      shutdown: [options.shutdown, "Shutdown"],
    }[action]!

    this.notify("cmd")
    this.notify("title")
    app.get_window("powermenu")?.hide()
    app.get_window("verification")?.show()
  }
}
