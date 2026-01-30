# Epik Shell

A desktop shell based on [AGS](https://github.com/Aylur/ags/).

## Screenshots

![2025-01-30_02-33-03](https://github.com/user-attachments/assets/12d46e4f-bbec-4c90-865f-3cbb36866bc9)
![2025-01-30_02-36-54](https://github.com/user-attachments/assets/1fa2dc55-41f8-46d6-bfac-afef2e83c32c)
![2026-01-30_22-07-01](https://github.com/user-attachments/assets/9cf68018-11f6-4ae9-9396-6df654758d8a)
![2025-01-30_02-37-16](https://github.com/user-attachments/assets/d9702b1a-2816-48a5-a9f0-00b7999447dd)
---

## Notes

- Most widgets are copied from [Aylur dotfiles](https://github.com/Aylur/dotfiles), the creator of Astal/AGS. Thanks, Aylur!
- Some features may not work as expected. Feel free to ask if you encounter any issues.
- **Only Hyprland is supported**, although some widgets might work with other Wayland compositors.

---

## Dependencies

### Required

- `astal` & `aylurs-gtk-shell`
- `dart-sass`

### Optional

- `hyprpicker`
- `swappy`
- `wf-recorder`
- `wayshot`
- `slurp`
- `wl-clipboard`
- `brightnessctl`

```bash
paru -S aylurs-gtk-shell-git libastal-git libastal-4-git libastal-hyprland-git libastal-battery-git libastal-bluetooth-git libastal-io-git libastal-mpris-git libastal-network-git libastal-notifd-git libastal-powerprofiles-git libastal-wireplumber-git dart-sass hyprpicker swappy wf-recorder wayshot slurp wl-clipboard brightnessctl
```

---

## Quick Start Guide

1. Clone the repository
   ```bash
   git clone https://github.com/ezerinz/epik-shell
   ```
2. Navigate to project directory
   ```bash
   cd epik-shell
   ```
3. Run
   ```bash
   ags run -d .
   ```
   
---

## Configuration
Epik Shell looks for a configuration file in the config directory (`~/.config/epik-shell/config.json`).
Configuration comes with the following defaults:

You can check some configurations in the [wiki](https://github.com/ezerinz/epik-shell/wiki/Configuration-Recipes)
> [!WARNING]
> Don't copy and paste this entire block into your `config.json`, it's just to show which configurations are available.

```jsonc
{
  "dock": {
    "position": "bottom", // "top" | "bottom"
    "pinned": ["firefox", "Alacritty", "org.gnome.Nautilus", "localsend"], // array of application classname
  },
  "bar": {
    "position": "top", // "top" | "bottom"
    "separator": true,
  },
  "desktop_clock": {
    "position": "top_left", // "top_left" | "top" | "top_right" | "left" | "center" | "right" | "bottom_left" | "bottom" | "bottom_right"
  },
  "theme": {
    "bar": {
      "bg_color": "$bg", // css color values (name -> red, rgb -> rgb(50, 50, 50), etc), or use theme color with "$" prefix ($bg, $accent, etc)
      "opacity": 1,
      "border_radius": 6, // in px, support css style (top, right, bottom, left -> [10, 15, 20, 10])
      "margin": 10, // in px, support css style
      "padding": 3, // in px, support css style
      "border_width": 2,
      "border_color": "$fg", // css color values or use theme color
      "shadow": {
        "offset": [6, 6], // in px, can be [horizontal, vertical] or single number
        "blur": 0,
        "spread": 0,
        "color": "$fg", // css color values or use theme color
        "opacity": 1,
      },
      "button": {
        "bg_color": "$bg",
        "fg_color": "$fg",
        "opacity": 1,
        "border_radius": 8,
        "border_width": 0,
        "border_color": "$fg",
        "padding": [0, 4],
        "shadow": {
          "offset": [0, 0],
          "blur": 0,
          "spread": 0,
          "color": "$fg",
          "opacity": 1,
        },
      },
    },
    "window": {
      "opacity": 1,
      "border_radius": 6,
      "margin": 10,
      "padding": 10,
      "dock_padding": 4,
      "desktop_clock_padding": 4,
      "border_width": 2,
      "border_color": "$fg",
      "shadow": {
        "offset": [6, 6],
        "blur": 0,
        "spread": 0,
        "color": "$fg",
        "opacity": 1,
      },
    },
    "light": {
      "bg": "#fbf1c7",
      "fg": "#3c3836",
      "accent": "#3c3836",
      "red": "#cc241d",
    },
    "dark": {
      "bg": "#282828",
      "fg": "#ebdbb2",
      "accent": "#ebdbb2",
      "red": "#cc241d",
    },
  },
}
```

---

## GTK Theme

### Theme Settings

- **Theme:** `adw-gtk3`

### Making GTK Apps Match Astal Theme

1. Install `libadwaita-without-adwaita`.
2. This configuration generates a `colors.css` file in `$HOME/.themes` based on theme settings in `src/theme.json`. Import the `colors.css` file into the `adw-gtk3` theme to apply it to your GTK apps.

Locate the following files:

- `adw-gtk3/gtk-3.0/gtk.css`
- `adw-gtk3/gtk-4.0/gtk.css`
- `adw-gtk3-dark/gtk-3.0/gtk-dark.css`
- `adw-gtk3.dark/gtk-4.0/gtk-dark.css`

Add the following line after the `define-color` section:

> **This assumes your adw-gtk3 folder is inside $HOME/.themes. If it's not, adjust the path accordingly.**

```css
/* Import after many define-color lines */
@import "../../colors.css";
```
