import GObject, { register, GLib, property } from "astal/gobject";
import { bash, notifySend, now, sh } from ".";
import { interval } from "astal";

const HOME = GLib.get_home_dir();

@register({ GTypeName: "Screenrecord" })
export default class ScreenRecord extends GObject.Object {
  static instance = null;

  static get_default() {
    if (!this.instance) this.instance = new ScreenRecord();
    return this.instance;
  }

  #recordings = `${HOME}/Videos/Screencasting`;
  #screenshots = `${HOME}/Pictures/Screenshots`;
  #file = "";
  #interval = "";

  #recording = false;
  #timer = 0;

  @property(Boolean)
  get recording() {
    return this.#recording;
  }

  @property(Number)
  get timer() {
    return this.#timer;
  }

  async start() {
    if (this._recording) return;

    // Utils.ensureDirectory(this.#recordings);
    this.#file = `${this.#recordings}/${now()}.mp4`;
    sh(
      `wf-recorder -g "${await sh("slurp")}" -f ${this.#file} --pixel-format yuv420p`,
    );

    this.#recording = true;
    this.notify("recording");

    this.#timer = 0;
    this.#interval = interval(1000, () => {
      this.notify("timer");
      this.#timer++;
    });
  }

  async stop() {
    if (!this.#recording) return;

    await bash("killall -INT wf-recorder");
    this.#recording = false;
    this.notify("recording");
    this.#interval.cancel();

    notifySend({
      icon: "folder-videos-symbolic",
      app_name: "Screen Recorder",
      summary: "Screen recording saved",
      body: this.#file,
    });
  }

  async screenshot(full = false) {
    const file = `${this.#screenshots}/${now()}.png`;
    // Utils.ensureDirectory(this.#screenshots);

    if (full) {
      await sh(`wayshot -f ${file}`);
    } else {
      const size = await sh("slurp -b#00000066 -w 0");
      if (!size) return;

      await sh(`wayshot -f ${file} -s "${size}"`);
    }

    bash(`wl-copy < ${file}`);

    notifySend({
      image: file,
      app_name: "Screenshot",
      summary: "Screenshot saved",
      body: file,
      actions: {
        "Show in Files": () => sh(`xdg-open ${this.#screenshots}`),
        View: () => sh(`xdg-open ${file}`),
        Edit: () => sh(`swappy -f ${file}`),
      },
    });
  }
}
