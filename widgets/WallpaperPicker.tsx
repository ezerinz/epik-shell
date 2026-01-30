import PopupWindow from "./common/PopupWindow"
import GdkPixbuf from "gi://GdkPixbuf"
import options from "../options"
import { bash, ensureDirectory, sh } from "../utils"
import GLib from "gi://GLib?version=2.0"
import Gio from "gi://Gio?version=2.0"
import { Gtk } from "ags/gtk4"
import app from "ags/gtk4/app"
import { Accessor, createRoot } from "ags"
import { timeout } from "ags/time"
const { wallpaper } = options
const cachePath = `${GLib.get_user_cache_dir()}/epik-shell/wallpapers`
const imageFormats = [".jpeg", ".jpg", ".webp", ".png"]

function getWallpaperList(path: string) {
  const dir = Gio.file_new_for_path(path)
  const fileEnum = dir.enumerate_children(
    "standard::name",
    Gio.FileQueryInfoFlags.NONE,
    null,
  )

  const files: string[] = []
  let i = fileEnum.next_file(null)
  while (i) {
    let fileName = i.get_name()
    if (imageFormats.some((fmt) => fileName.endsWith(fmt))) {
      files.push(fileName)
    }
    i = fileEnum.next_file(null)
  }
  return files
}

function cacheImage(
  inputPath: string,
  cachePath: string,
  newWidth: number,
  customName?: string,
  fastest?: boolean,
) {
  const baseName = GLib.path_get_basename(inputPath)
  const extension = baseName.split(".").pop()!.toLowerCase()
  const outputFileName = customName ? `${customName}.${extension}` : baseName
  const outputPath = `${cachePath}/${outputFileName}`
  ensureDirectory(cachePath)

  try {
    let pixbuf = GdkPixbuf.Pixbuf.new_from_file(inputPath)

    const aspectRatio = pixbuf.get_width() / pixbuf.get_height()
    const scaledHeight = Math.round(newWidth / aspectRatio)

    const scaledPixbuf = pixbuf.scale_simple(
      newWidth,
      scaledHeight,
      fastest ? GdkPixbuf.InterpType.NEAREST : GdkPixbuf.InterpType.BILINEAR,
    )

    const outputFormat = extension === "png" ? "png" : "jpeg"
    scaledPixbuf?.savev(outputPath, outputFormat, [], [])
    pixbuf.run_dispose()
    scaledPixbuf?.run_dispose()

    return outputPath
  } catch {
    const black_pixbuf = GdkPixbuf.Pixbuf.new(
      GdkPixbuf.Colorspace.RGB,
      true,
      8,
      newWidth,
      (newWidth * 9) / 16,
    )
    black_pixbuf.fill(0x0)
    black_pixbuf.savev(outputPath, "jpeg", [], [])
    return outputPath
  }
}

function WallpaperPicker() {
  return createRoot((dispose) => {
    const removeChildren = (box: Gtk.Box) => {
      const children: Gtk.Widget[] = []
      let child = box.get_first_child()
      while (child != null) {
        children.push(child)
        child = child.get_next_sibling()
      }

      children.forEach((child) => {
        box.remove(child)
      })
    }

    return (
      <PopupWindow
        name={"wallpaperpicker"}
        layout={options.bar.position.peek()}
        visible
        setup={(self) => {
          app.connect("window-toggled", (_, win) => {
            if (win.name == "wallpaperpicker" && !win.visible) {
              self.set_child(null)
              self.destroy()
              dispose()
            }
          })
        }}
      >
        <box
          orientation={Gtk.Orientation.VERTICAL}
          vexpand={false}
          cssClasses={["window-content", "wallpaperpicker-container"]}
          $={(self) => {
            app.connect("window-toggled", (_, win) => {
              if (win.name == "wallpaperpicker" && !win.visible) {
                removeChildren(self)
              }
            })
          }}
        >
          <box
            spacing={6}
            $={(self) => {
              app.connect("window-toggled", (_, win) => {
                if (win.name == "wallpaperpicker" && !win.visible) {
                  removeChildren(self)
                }
              })
            }}
          >
            <label hexpand xalign={0} label={"Wallpaper"} />
            <label cssClasses={["directory"]} label={wallpaper.folder()} />
            <button
              tooltipText={"Clear cache"}
              onClicked={() => {
                if (GLib.file_test(cachePath, GLib.FileTest.IS_DIR)) {
                  bash(`rm -r ${cachePath}`)
                }
              }}
              iconName="user-trash-full-symbolic"
            />
            <button
              tooltipText={"Change folder"}
              onClicked={() => {
                app.toggle_window("wallpaperpicker")
                const folderChooser = new Gtk.FileDialog({
                  title: "Choose Folder",
                  initialFolder: Gio.file_new_for_path(wallpaper.folder.peek()),
                })

                folderChooser.select_folder(null, null, (_, res) => {
                  try {
                    const result = folderChooser.select_folder_finish(res)
                    if (result != null && result.get_path() != null) {
                      wallpaper.folder.set(result.get_path()!)
                      app.toggle_window("wallpaperpicker")
                    }
                  } catch (e) {
                    if (`${e}`.toLowerCase().includes("dismissed")) {
                      app.toggle_window("wallpaperpicker")
                    } else {
                      console.error(`${e}`)
                    }
                  }
                })
              }}
              iconName={"folder-symbolic"}
            />
          </box>
          <Gtk.Separator />
          <Gtk.ScrolledWindow>
            <box
              spacing={6}
              vexpand
              $={(self) => {
                function populateBox(box: Gtk.Box, path: string) {
                  timeout(100, () => {
                    const wallpaperList = getWallpaperList(path)

                    const wallpapersToCache = wallpaperList.filter(
                      (image) =>
                        !GLib.file_test(
                          `${cachePath}/${image}`,
                          GLib.FileTest.EXISTS,
                        ),
                    )

                    wallpapersToCache.forEach((image) => {
                      cacheImage(`${path}/${image}`, cachePath, 200)
                    })

                    removeChildren(box)
                    wallpaperList.forEach((w) => {
                      const button = new Gtk.Button({
                        tooltipText: w,
                        child: new Gtk.Picture({
                          cssClasses: ["image"],
                          overflow: Gtk.Overflow.HIDDEN,
                          contentFit: Gtk.ContentFit.COVER,
                          widthRequest: 200,
                          file: Gio.file_new_for_path(`${cachePath}/${w}`),
                        }),
                      })
                      button.connect("clicked", () => {
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
                          )
                          GLib.remove(wallpaper.current.peek())
                          wallpaper.current.set(current)
                        })
                      })
                      box.append(button)
                    })
                  })
                }

                app.connect("window-toggled", (_, win) => {
                  if (win.name == "wallpaperpicker") {
                    if (win.visible) {
                      populateBox(self, wallpaper.folder.peek())
                    } else {
                      removeChildren(self)
                    }
                  }
                })
              }}
            >
              <label
                label={"Caching wallpapers..."}
                hexpand
                halign={Gtk.Align.CENTER}
              />
              ,
            </box>
          </Gtk.ScrolledWindow>
        </box>
      </PopupWindow>
    )
  })
}

export function toggleWallpaperPicker() {
  const windowExist = app
    .get_windows()
    .some(({ name }) => name == "wallpaperpicker")
  if (!windowExist) {
    WallpaperPicker()
  } else {
    const window = app.get_window("wallpaperpicker")
    window!.hide()
  }
}
