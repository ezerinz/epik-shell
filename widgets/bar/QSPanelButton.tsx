import { App } from "astal/gtk4";
import PanelButton from "../common/PanelButton";
import { WINDOW_NAME } from "../quicksettings/QSWindow";
import AstalBattery from "gi://AstalBattery";
import AstalWp from "gi://AstalWp";
import { bind, Variable } from "astal";
import AstalPowerProfiles from "gi://AstalPowerProfiles";
import AstalNetwork from "gi://AstalNetwork";
import AstalBluetooth from "gi://AstalBluetooth";

function NetworkIcon() {
  const network = AstalNetwork.get_default();
  if (!network.wired)
    return <image iconName={bind(network.wifi, "iconName")} />;

  const icon = Variable.derive(
    [
      bind(network, "primary"),
      bind(network.wifi, "iconName"),
      bind(network.wired, "iconName"),
    ],
    (primary, wifiIcon, wiredIcon) => {
      if (
        primary == AstalNetwork.Primary.WIRED ||
        primary == AstalNetwork.Primary.UNKNOWN
      ) {
        return wiredIcon;
      } else {
        return wifiIcon;
      }
    },
  );
  return <image iconName={icon()} onDestroy={() => icon.drop()} />;
}

export default function QSPanelButton() {
  const battery = AstalBattery.get_default();
  const bluetooth = AstalBluetooth.get_default();
  const wp = AstalWp.get_default();
  const speaker = wp?.audio.defaultSpeaker!;
  const powerprofile = AstalPowerProfiles.get_default();

  return (
    <PanelButton
      window={WINDOW_NAME}
      onClicked={() => {
        App.toggle_window(WINDOW_NAME);
      }}
    >
      <box spacing={6}>
        <NetworkIcon />
        <image
          visible={bind(bluetooth, "isPowered")}
          iconName={"bluetooth-symbolic"}
        />
        <image
          visible={bind(battery, "isPresent")}
          iconName={bind(battery, "batteryIconName")}
        />
        <image iconName={bind(speaker, "volumeIcon")} />
        <image
          visible={bind(powerprofile, "activeProfile").as(
            (p) => p === "power-saver",
          )}
          iconName={`power-profile-power-saver-symbolic`}
        />
        <image
          visible={wp?.defaultMicrophone && bind(wp.default_microphone, "mute")}
          iconName="microphone-disabled-symbolic"
        />
      </box>
    </PanelButton>
  );
}
