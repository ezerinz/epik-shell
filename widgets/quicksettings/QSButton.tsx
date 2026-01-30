import GObject from "gi://GObject?version=2.0"
import { Opt } from "../../utils/option"
import { Gtk } from "ags/gtk4"
import { Accessor, createBinding } from "ags"

type QSMenuButtonProps = JSX.IntrinsicElements["menubutton"] & {
  children?: any
  iconName: string
  label: string
  setup?: (self: Gtk.MenuButton) => void
}

export function QSMenuButton({
  children,
  iconName,
  label,
  setup,
}: QSMenuButtonProps) {
  return (
    <menubutton
      $={setup}
      tooltipText={label}
      cssClasses={["qs-button"]}
      iconName={iconName}
    >
      {/* <image halign={Gtk.Align.CENTER} iconName={iconName} /> */}
      {children}
    </menubutton>
  )
}

type QSButtonProps<T extends GObject.Object> =
  JSX.IntrinsicElements["button"] & {
    iconName: string | Accessor<string>
    label: string | Accessor<string>
    connection?: [T | Accessor<any> | Opt<any>, any, ((arg0: any) => boolean)?]
    setup?: (self: Gtk.Button) => void
  }

export default function QSButton<T extends GObject.Object>({
  iconName,
  label,
  setup,
  onClicked,
  connection,
}: QSButtonProps<T>) {
  function getCssClasses(): string[] | Accessor<string[]> {
    if (!connection) return ["qs-button"]

    const [object, property, cond] = connection
    const computeClasses = (v: any) => {
      const classes = ["qs-button"]
      if (cond ? cond(v) : v) classes.push("active")
      return classes
    }

    return object instanceof Accessor
      ? object.as(computeClasses)
      : property != null
        ? createBinding(object, property).as(computeClasses)
        : ["qs-button"]
  }

  return (
    <button
      $={setup}
      cssClasses={getCssClasses()}
      onClicked={onClicked}
      tooltipText={label}
    >
      <image iconName={iconName} halign={Gtk.Align.CENTER} />
    </button>
  )
}
