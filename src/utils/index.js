import { execAsync, Gio, GLib, Variable } from "astal";

export function ensureDirectory(path) {
  if (!GLib.file_test(path, GLib.FileTest.EXISTS))
    Gio.File.new_for_path(path).make_directory_with_parents(null);
}

export async function launchDefaultAsync(uri) {
  return new Promise((resolve, reject) => {
    Gio.AppInfo.launch_default_for_uri_async(uri, null, null, (_, res) => {
      try {
        resolve(Gio.AppInfo.launch_default_for_uri_finish(res));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export const now = () =>
  GLib.DateTime.new_now_local().format("%Y-%m-%d_%H-%M-%S");

export const time = Variable(GLib.DateTime.new_now_local()).poll(1000, () =>
  GLib.DateTime.new_now_local(),
);

export function range(max) {
  return Array.from({ length: max + 1 }, (_, i) => i);
}

export function notifySend({ app_name, image, icon, summary, body, actions }) {
  const actionsArray = Object.entries(actions || {}).map(
    ([label, callback], i) => ({
      id: `${i}`,
      label,
      callback,
    }),
  );
  execAsync(
    [
      "notify-send",
      `-h "string:image-path:${!!icon ? icon : image}"`,
      `"${summary ?? ""}"`,
      `"${body ?? ""}"`,
      `-a "${app_name ?? ""}"`,
      ...actionsArray.map((v) => `--action=\"${v.id}=${v.label}\"`),
    ].join(" "),
  )
    .then((out) => {
      if (!isNaN(out)) {
        actionsArray[parseInt(out)].callback();
      }
    })
    .catch(console.error);
}

export async function sh(cmd) {
  return execAsync(cmd).catch((err) => {
    console.error(typeof cmd === "string" ? cmd : cmd.join(" "), err);
    return "";
  });
}

export async function bash(strings, ...values) {
  const cmd =
    typeof strings === "string"
      ? strings
      : strings.flatMap((str, i) => str + `${values[i] ?? ""}`).join("");

  return execAsync(["bash", "-c", cmd]).catch((err) => {
    console.error(cmd, err);
    return "";
  });
}
