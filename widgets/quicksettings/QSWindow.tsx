import {
  Accessor,
  createBinding,
  createComputed,
  createConnection,
  createEffect,
  createState,
  With,
} from "ags"
import options from "../../options"
import { Gtk } from "ags/gtk4"
import DarkModeQS from "./buttons/DarkModeQS"
import ColorPickerQS from "./buttons/ColorPickerQS"
import ScreenshotQS from "./buttons/ScreenshotQS"
import MicQS from "./buttons/MicQS"
import DontDisturbQS from "./buttons/DontDisturbQS"
import RecordQS from "./buttons/RecordQS"
import AstalBattery from "gi://AstalBattery?version=0.1"
import app from "ags/gtk4/app"
import GObject from "gi://GObject?version=2.0"
import AstalNetwork from "gi://AstalNetwork?version=0.1"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import BrightnessBox from "./BrightnessBox"
import VolumeBox from "./VolumeBox"
import PopupWindow from "../common/PopupWindow"
import BatteryPage from "./pages/BatteryPage"
import SpeakerPage from "./pages/SpeakerPage"
import WifiPage from "./pages/WifiPage"
import { WINDOW_NAME as POWERMENU_WINDOW } from "../powermenu/PowerMenu"
import Pango from "gi://Pango?version=1.0"
import Adw from "gi://Adw?version=1"
import { toggleWallpaperPicker } from "../WallpaperPicker"

export const WINDOW_NAME = "quicksettings"
export const [qsPage, setQsPage] = createState("main")
const { bar } = options

const layout = createComputed(() => {
  return `${bar.position()}_right`
})

function QSButtons() {
  return (
    <Gtk.FlowBox
      maxChildrenPerLine={3}
      activateOnSingleClick={false}
      homogeneous
      rowSpacing={6}
      columnSpacing={6}
    >
      <DarkModeQS />
      <ColorPickerQS />
      <ScreenshotQS />
      <MicQS />
      <DontDisturbQS />
      <RecordQS />
    </Gtk.FlowBox>
  )
}

function Header() {
  const battery = AstalBattery.get_default()

  return (
    <box hexpand={false} cssClasses={["header"]} spacing={6}>
      <label label={"Quick Setting"} hexpand xalign={0} />
      <button
        onClicked={() => {
          app.toggle_window(WINDOW_NAME)
          toggleWallpaperPicker()
        }}
        iconName={"preferences-desktop-wallpaper-symbolic"}
      />
      <button
        cssClasses={["battery"]}
        onClicked={() => {
          setQsPage("battery")
        }}
      >
        <box spacing={2}>
          <image
            iconName={createBinding(battery, "batteryIconName")}
            iconSize={Gtk.IconSize.NORMAL}
            cssClasses={["icon"]}
          />
          <label
            label={createBinding(battery, "percentage").as(
              (p) => `${Math.floor(p * 100)}%`,
            )}
          />
        </box>
      </button>
      <button
        cssClasses={["powermenu"]}
        onClicked={() => {
          app.toggle_window(WINDOW_NAME)
          app.toggle_window(POWERMENU_WINDOW)
        }}
      >
        <image
          iconName={"system-shutdown-symbolic"}
          iconSize={Gtk.IconSize.NORMAL}
        />
      </button>
    </box>
  )
}

function ArrowButton<T extends GObject.Object>({
  icon,
  title,
  subtitle,
  onClicked,
  onArrowClicked,
  connection: [gobject, property],
}: {
  icon: string | Accessor<string>
  title: string
  subtitle: string | Accessor<string>
  onClicked: () => void
  onArrowClicked: () => void
  connection: [T, any]
}) {
  return (
    <box
      cssClasses={createBinding(gobject, property).as((p) => {
        const classes = ["arrow-button"]
        p && classes.push("active")
        return classes
      })}
    >
      <button onClicked={onClicked}>
        <box halign={Gtk.Align.START} spacing={6}>
          <image iconName={icon} iconSize={Gtk.IconSize.LARGE} />
          <box orientation={Gtk.Orientation.VERTICAL} hexpand>
            <label xalign={0} label={title} cssClasses={["title"]} />
            <label
              xalign={0}
              label={subtitle}
              cssClasses={["subtitle"]}
              ellipsize={Pango.EllipsizeMode.END}
            />
          </box>
        </box>
      </button>
      <button iconName={"go-next-symbolic"} onClicked={onArrowClicked} />
    </box>
  )
}

function WifiArrowButton() {
  const wifi = AstalNetwork.get_default().wifi

  const getSsid = () =>
    wifi.state == AstalNetwork.DeviceState.ACTIVATED
      ? wifi.ssid
      : AstalNetwork.device_state_to_string()

  const label = createConnection(
    getSsid(),
    [wifi, "notify::state", () => getSsid()],
    [wifi, "notify::ssid", () => getSsid()],
  )

  return (
    <box>
      <With value={label}>
        {(l) => (
          <ArrowButton
            icon={createBinding(wifi, "iconName")}
            title="Wi-Fi"
            subtitle={l}
            onClicked={() => wifi.set_enabled(!wifi.get_enabled())}
            onArrowClicked={() => {
              wifi.set_enabled(true)
              wifi.scan()
              setQsPage("wifi")
            }}
            connection={[wifi, "enabled"]}
          />
        )}
      </With>
    </box>
  )
}

function WifiBluetooth() {
  const bluetooth = AstalBluetooth.get_default()
  const btAdapter = bluetooth.adapter
  const isConnected = createBinding(bluetooth, "isConnected")
  const deviceConnected = createComputed(() => {
    if (isConnected()) {
      return bluetooth.devices.find((d) => d.connected)?.name ?? "No device"
    }
    return "No device"
  })
  const wifi = AstalNetwork.get_default().wifi

  return (
    <box homogeneous spacing={6}>
      {!!wifi && <WifiArrowButton />}
      <box>
        <With value={deviceConnected}>
          {(label) => (
            <ArrowButton
              icon={createBinding(btAdapter, "powered").as(
                (p) => `bluetooth-${p ? "" : "disabled-"}symbolic`,
              )}
              title="Bluetooth"
              subtitle={label}
              onClicked={() => bluetooth.toggle()}
              onArrowClicked={() => console.log("Will add bt page later")}
              connection={[btAdapter, "powered"]}
            />
          )}
        </With>
      </box>
    </box>
  )
}

function MainPage() {
  return (
    <box
      name="main"
      cssClasses={["qs-page"]}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={6}
    >
      <Header />
      <Gtk.Separator />
      <WifiBluetooth />
      <QSButtons />
      <BrightnessBox />
      <VolumeBox />
    </box>
  )
}

export default function QSWindow() {
  return (
    <With value={layout}>
      {(l) => (
        <PopupWindow
          name={WINDOW_NAME}
          layout={l}
          setup={(win) => {
            win.connect("notify::visible", (win, _) => {
              if (!win.visible) {
                setQsPage("main")
              }
            })
          }}
        >
          <Adw.Clamp maximumSize={400}>
            <box
              cssClasses={["window-content", "qs-container"]}
              orientation={Gtk.Orientation.VERTICAL}
              widthRequest={400}
            >
              <stack
                $={(self) => {
                  const children: any[] = [
                    MainPage(),
                    BatteryPage(),
                    SpeakerPage(),
                    WifiPage(),
                  ]

                  children.forEach((c: Gtk.Widget) => {
                    self.add_named(c, c.name)
                  })

                  createEffect(() => (self.visible_child_name = qsPage()))
                }}
                transitionType={Gtk.StackTransitionType.SLIDE_LEFT_RIGHT}
              ></stack>
            </box>
          </Adw.Clamp>
        </PopupWindow>
      )}
    </With>
  )
}
