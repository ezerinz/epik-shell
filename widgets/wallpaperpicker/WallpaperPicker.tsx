import { GLib, timeout } from "astal";
import PopupWindow from "../common/PopupWindow";
import GdkPixbuf from "gi://GdkPixbuf";
import { App, Astal, Gtk, hook } from "astal/gtk4";
import { Gio } from "astal";
import options from "../../options";
import { bash, ensureDirectory, sh } from "../../utils";
import { sendBatch } from "../../utils/hyprland";

const { wallpaper } = options;
const cachePath = `${GLib.get_user_cache_dir()}/epik-shell/wallpapers`;
const imageFormats = [".jpeg", ".jpg", ".webp", ".png"];

function getWallpaperList() {
  const path = wallpaper.folder.get();
  const dir = Gio.file_new_for_path(path);
  const fileEnum = dir.enumerate_children(
    "standard::name",
    Gio.FileQueryInfoFlags.NONE,
    null,
  );

  const files: string[] = [];
  let i = fileEnum.next_file(null);
  while (i) {
    let fileName = i.get_name();
    if (imageFormats.some((fmt) => fileName.endsWith(fmt))) {
      files.push(fileName);
    }
    i = fileEnum.next_file(null);
  }
  return files;
}

function cacheImage(
  inputPath: string,
  cachePath: string,
  newWidth: number,
  customName?: string,
  fastest?: boolean,
) {
  const baseName = GLib.path_get_basename(inputPath);
  const extension = baseName.split(".").pop()!.toLowerCase();
  const outputFileName = customName ? `${customName}.${extension}` : baseName;
  const outputPath = `${cachePath}/${outputFileName}`;

  try {
    let pixbuf = GdkPixbuf.Pixbuf.new_from_file(inputPath);

    const aspectRatio = pixbuf.get_width() / pixbuf.get_height();
    const scaledHeight = Math.round(newWidth / aspectRatio);

    const scaledPixbuf = pixbuf.scale_simple(
      newWidth,
      scaledHeight,
      fastest ? GdkPixbuf.InterpType.NEAREST : GdkPixbuf.InterpType.BILINEAR,
    );

    const outputFormat = extension === "png" ? "png" : "jpeg";
    scaledPixbuf?.savev(outputPath, outputFormat, [], []);

    return outputPath;
  } catch {
    const black_pixbuf = GdkPixbuf.Pixbuf.new(
      GdkPixbuf.Colorspace.RGB,
      true,
      8,
      newWidth,
      (newWidth * 9) / 16,
    );
    black_pixbuf.fill(0x0);
    black_pixbuf.savev(outputPath, "jpeg", [], []);
    return outputPath;
  }
}

function wallpaperPicker() {
  const wallpaperFolder = wallpaper.folder.get();
  const wallpaperDir = Gio.file_new_for_path(wallpaperFolder);
  if (!wallpaperDir.query_exists(null)) {
    wallpaperDir.make_directory_with_parents(null); // Create directory if it doesn't exist
  }

  ensureDirectory(cachePath);

  return (
    <PopupWindow
      name={"wallpaperpicker"}
      visible
      setup={(self) => {
        sendBatch([
          `layerrule animation slide ${options.bar.position.get()}, ${self.namespace}`,
          `layerrule blur, ${self.namespace}`,
          `layerrule ignorealpha 0.3, ${self.namespace}`,
        ]);

        hook(self, App, "window-toggled", (_, win) => {
          if (win.name == "wallpaperpicker" && !win.visible) {
            self.set_child(null);
            self.destroy();
          }
        });
      }}
      layout={options.bar.position().get()}
    >
      <box
        vertical
        vexpand={false}
        cssClasses={["window-content", "wallpaperpicker-container"]}
        setup={(self) => {
          hook(self, App, "window-toggled", (_, win) => {
            if (win.name == "wallpaperpicker" && !win.visible) {
              self.set_children([]);
            }
          });
        }}
      >
        <box
          spacing={6}
          setup={(self) => {
            hook(self, App, "window-toggled", (_, win) => {
              if (win.name == "wallpaperpicker" && !win.visible) {
                self.set_children([]);
              }
            });
          }}
        >
          <label hexpand xalign={0} label={"Wallpaper"} />
          <label cssClasses={["directory"]} label={wallpaper.folder.get()} />
          <button
            tooltipText={"Clear cache"}
            onClicked={() => {
              if (GLib.file_test(cachePath, GLib.FileTest.IS_DIR)) {
                bash(`rm -r ${cachePath}`);
              }
            }}
            iconName="user-trash-full-symbolic"
          />
          <button
            tooltipText={"Change folder"}
            onClicked={() => {
              App.get_window("wallpaperpicker")?.hide();
              const folderChooser = new Gtk.FileDialog({
                title: "Choose Folder",
                initialFolder: Gio.file_new_for_path(wallpaper.folder.get()),
              });

              folderChooser.select_folder(null, null, (_, res) => {
                try {
                  const result = folderChooser.select_folder_finish(res);
                  if (result != null && result.get_path() != null) {
                    wallpaper.folder.set(result.get_path());
                    wallpaperPicker();
                  }
                } catch (e) {
                  if (`${e}`.toLowerCase().includes("dismissed")) {
                    wallpaperPicker();
                  } else {
                    console.error(`${e}`);
                  }
                }
              });
            }}
            iconName={"folder-symbolic"}
          />
        </box>
        <Gtk.Separator />
        <Gtk.ScrolledWindow>
          <box
            spacing={6}
            vexpand
            setup={(self) => {
              function populateBox(box: Astal.Box, path: string) {
                timeout(100, () => {
                  const wallpaperList = getWallpaperList(path);

                  const wallpapersToCache = wallpaperList.filter(
                    (image) =>
                      !GLib.file_test(
                        `${cachePath}/${image}`,
                        GLib.FileTest.EXISTS,
                      ),
                  );

                  wallpapersToCache.forEach((image) => {
                    cacheImage(`${path}/${image}`, cachePath, 200);
                  });

                  box.set_children(
                    wallpaperList.map((w) => (
                      <button
                        tooltipText={w}
                        onClicked={() => {
                          sh([
                            "swww",
                            "img",
                            "--transition-type",
                            "random",
                            `${path}/${w}`,
                          ]).then(() => {
                            const current = cacheImage(
                              `${path}/${w}`,
                              cachePath,
                              450,
                              `${w.split(".").shift()}_current`,
                            );
                            GLib.remove(wallpaper.current.get());
                            wallpaper.current.set(current);
                          });
                        }}
                      >
                        <Gtk.Picture
                          cssClasses={["image"]}
                          overflow={Gtk.Overflow.HIDDEN}
                          contentFit={Gtk.ContentFit.COVER}
                          widthRequest={200}
                          file={Gio.file_new_for_path(`${cachePath}/${w}`)}
                        />
                      </button>
                    )),
                  );
                });
              }

              populateBox(self, wallpaper.folder.get());
              hook(self, App, "window-toggled", (_, win) => {
                if (win.name == "wallpaperpicker" && !win.visible) {
                  self.set_children([]);
                }
              });
            }}
          >
            <label
              label={"Caching wallpapers..."}
              hexpand
              halign={Gtk.Align.CENTER}
            />
          </box>
        </Gtk.ScrolledWindow>
      </box>
    </PopupWindow>
  );
}

export function toggleWallpaperPicker() {
  const windowExist = App.get_windows().some(
    ({ name }) => name == "wallpaperpicker",
  );
  if (!windowExist) {
    wallpaperPicker();
  } else {
    const window = App.get_window("wallpaperpicker");
    window!.hide();
  }
}
