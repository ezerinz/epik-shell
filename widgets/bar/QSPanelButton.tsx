import PanelButton from "../common/PanelButton"
import { WINDOW_NAME } from "../quicksettings/QSWindow"
import AstalBattery from "gi://AstalBattery"
import AstalWp from "gi://AstalWp"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
import AstalNetwork from "gi://AstalNetwork"
import AstalBluetooth from "gi://AstalBluetooth"
import { createBinding, createComputed, With } from "ags"
import app from "ags/gtk4/app"

function NetworkIcon() {
  const network = AstalNetwork.get_default()

  const primary = createBinding(network, "primary")
  const icon = createComputed(() => {
    const p = primary()
    if (p == AstalNetwork.Primary.WIRED || p == AstalNetwork.Primary.UNKNOWN) {
      return createBinding(network.wired, "iconName")()
    } else {
      return createBinding(network.wifi, "iconName")()
    }
  })
  return (
    <box>
      <With value={icon}>{(icon) => <image iconName={icon} />}</With>
    </box>
  )
}

export default function QSPanelButton() {
  const battery = AstalBattery.get_default()
  const bluetooth = AstalBluetooth.get_default()
  const wp = AstalWp.get_default()
  const speaker = wp?.audio.defaultSpeaker!
  const powerprofile = AstalPowerProfiles.get_default()

  const isBtPowered = createBinding(bluetooth, "isPowered")
  const isBatteryPresent = createBinding(battery, "isPresent")
  const batteryIcon = createBinding(battery, "batteryIconName")
  const volumeIcon = createBinding(speaker, "volumeIcon")
  const activePowerProfile = createBinding(powerprofile, "activeProfile")
  const isMute = createBinding(wp.defaultMicrophone, "mute")

  return (
    <PanelButton
      window={WINDOW_NAME}
      onClicked={() => {
        app.toggle_window(WINDOW_NAME)
      }}
    >
      <box spacing={2}>
        <NetworkIcon />
        <box>
          <With value={isBtPowered}>
            {(isPowered) => (
              <image visible={isPowered} iconName={"bluetooth-symbolic"} />
            )}
          </With>
        </box>
        <box visible={isBatteryPresent()}>
          <With value={batteryIcon}>{(icon) => <image iconName={icon} />}</With>
        </box>
        <box>
          <With value={volumeIcon}>{(icon) => <image iconName={icon} />}</With>
        </box>
        <image
          visible={activePowerProfile((p) => p === "power-saver")}
          iconName={`power-profile-power-saver-symbolic`}
        />
        <box>
          <With value={isMute}>
            {(mute) => (
              <image visible={mute} iconName="microphone-disabled-symbolic" />
            )}
          </With>
        </box>
      </box>
    </PanelButton>
  )
}
