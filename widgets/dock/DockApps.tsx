import AstalApps from "gi://AstalApps"
import AstalHyprland from "gi://AstalHyprland"
import AstalMpris from "gi://AstalMpris"
import Pango from "gi://Pango"
import options from "../../options"
import { Gtk } from "ags/gtk4"
import gtk4app from "ags/gtk4/app"
import { createBinding, createComputed, For, With } from "ags"
import { exec } from "ags/process"

const hyprland = AstalHyprland.get_default()
const application = new AstalApps.Apps()
const iconTheme = new Gtk.IconTheme({ themeName: gtk4app.iconTheme })

type AppButtonProps = JSX.IntrinsicElements["button"] & {
  app: AstalApps.Application
  pinned?: boolean
  term: string
  client?: AstalHyprland.Client
}
function AppButton({
  app,
  onClicked,
  term,
  pinned = false,
  client,
}: AppButtonProps) {
  const substitute: Record<string, any> = {
    Alacritty: "terminal",
    localsend: "send-to",
    "spotify-client": "org.gnome.Lollypop-spotify",
    "org.gnome.Nautilus": "system-file-manager",
  }

  const iconName = `${substitute[app.iconName] ?? app.iconName}-symbolic`

  return (
    <button
      onClicked={onClicked}
      cssClasses={createBinding(hyprland, "focusedClient").as((fcsClient) => {
        const classes = ["app-button"]
        if (!fcsClient || !term || !fcsClient.class) return classes

        const isFocused = !pinned
          ? client?.address === fcsClient.address
          : fcsClient.class.toLowerCase().includes(term.toLowerCase())

        if (isFocused) classes.push("focused")
        return classes
      })}
    >
      <overlay>
        <box cssClasses={["box"]} />
        <image
          $type="overlay"
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          iconName={`${iconName}`}
          pixelSize={iconTheme.has_icon(`${iconName}`) ? 32 : 38}
        />
        <box
          $type="overlay"
          cssClasses={["indicator"]}
          valign={Gtk.Align.END}
          halign={Gtk.Align.CENTER}
          visible={createBinding(hyprland, "clients").as((clients) => {
            return clients
              .map((e) => e.class.toLowerCase())
              .includes(term.toLowerCase())
          })}
        />
      </overlay>
    </button>
  )
}

function AppsList() {
  const pinnedApps = options.dock.pinned.as((p) => {
    return p
      .map((term) => ({
        app: application.list.find((e) => e.entry.split(".desktop")[0] == term),
        term,
      }))
      .filter(({ app }) => app)
  })

  const clients = createBinding(hyprland, "clients")
  const filteredClients = createComputed(() => {
    return clients()
      .reverse()
      .filter(
        (c) =>
          !options.dock
            .pinned()
            .map((e) => e.toLowerCase())
            .includes(c.class.toLowerCase()),
      )
  })

  return (
    <box>
      <box>
        <For each={pinnedApps}>
          {({ app, term }) => (
            <AppButton
              app={app!}
              term={term}
              pinned={true}
              onClicked={() => {
                for (const client of hyprland.get_clients()) {
                  if (client.class.toLowerCase().includes(term.toLowerCase())) {
                    return client.focus()
                  }
                }
                app!.launch()
              }}
            />
          )}
        </For>
      </box>
      <box>
        <For each={filteredClients}>
          {(client: AstalHyprland.Client) => {
            const app = application.list.find((e) =>
              e.entry
                .split(".desktop")[0]
                .toLowerCase()
                .match(client.class.toLowerCase()),
            )
            if (!app) {
              return <></>
            }
            return (
              <AppButton
                app={app}
                onClicked={() => {
                  client.focus()
                }}
                term={client.class}
                client={client}
              />
            )
          }}
        </For>
      </box>
    </box>
  )
}

function MediaPlayer({ player }: { player: AstalMpris.Player }) {
  if (!player) {
    return <box />
  }
  const title = createBinding(player, "title").as((t) => t || "Unknown Track")
  const artist = createBinding(player, "artist").as(
    (a) => a || "Unknown Artist",
  )
  const coverArt = createBinding(player, "coverArt")

  const playIcon = createBinding(player, "playbackStatus").as((s) =>
    s === AstalMpris.PlaybackStatus.PLAYING
      ? "media-playback-pause-symbolic"
      : "media-playback-start-symbolic",
  )

  return (
    <box cssClasses={["media-player"]} hexpand>
      <image
        overflow={Gtk.Overflow.HIDDEN}
        pixelSize={35}
        cssClasses={["cover"]}
        file={coverArt}
      />
      <box orientation={Gtk.Orientation.VERTICAL} hexpand>
        <label
          ellipsize={Pango.EllipsizeMode.END}
          halign={Gtk.Align.START}
          label={title}
          maxWidthChars={15}
        />
        <label
          ellipsize={Pango.EllipsizeMode.END}
          halign={Gtk.Align.START}
          label={artist}
          maxWidthChars={15}
        />
      </box>
      <button
        halign={Gtk.Align.END}
        valign={Gtk.Align.CENTER}
        onClicked={() => player.play_pause()}
        visible={createBinding(player, "canControl")}
      >
        <image iconName={playIcon} pixelSize={18} />
      </button>
      <button
        halign={Gtk.Align.END}
        valign={Gtk.Align.CENTER}
        onClicked={() => player.next()}
        visible={createBinding(player, "canGoNext")}
      >
        <image iconName="media-skip-forward-symbolic" pixelSize={24} />
      </button>
    </box>
  )
}

export default function DockApps() {
  const mpris = AstalMpris.get_default()
  const player = createBinding(mpris, "players").as((players) => players[0])
  return (
    <box cssClasses={["window-content", "dock-container"]} hexpand={false}>
      <AppsList />
      <box>
        <With value={player}>{(p) => <MediaPlayer player={p} />}</With>
      </box>
      <Gtk.Separator orientation={Gtk.Orientation.VERTICAL} />
      <AppButton
        app={{ iconName: "user-trash" } as AstalApps.Application}
        onClicked={() => exec("nautilus trash:///")}
        term={""}
      />
    </box>
  )
}
