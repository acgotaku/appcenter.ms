export enum Color {
  Gray = "Gray",
  Blue = "Blue",
  White = "White",
  LightGray = "LightGray",
  DarkGray = "DarkGray",
  Black = "Black",
  DarkBlue = "DarkBlue",
  Red = "Red",
  Green = "Green",
  DarkGreen = "DarkGreen",
  Teal = "Teal", // FIXME: This won't be a supported color after https://ghe-us.microsoft.com/mobile-services/mobile-center-portal/issues/1530
  Amber = "Amber", // FIXME: This won't be a supported color after https://ghe-us.microsoft.com/mobile-services/mobile-center-portal/issues/1530
  Violet = "Violet",
  DarkViolet = "DarkViolet",
}

export type ButtonColor =
  | Color.Gray
  | Color.Blue
  | Color.White
  | Color.LightGray
  | Color.DarkGray
  | Color.Black
  | Color.DarkBlue
  | Color.Red
  | Color.Green;

export enum TextColor {
  Primary = "Primary",
  Secondary = "Secondary",
  Disabled = "Disabled",
  Hint = "Hint",
  Link = "Link",
  Danger = "Danger",
  Error = "Error",
  Warning = "Warning",
  Success = "Success",
  Brand = "Brand",
  Black = "Black",
  White = "White",
}

export enum StatusColor {
  Gray = "Gray",
  Blue = "Blue",
  White = "White",
  Black = "Black",
  Red = "Red",
  Green = "Green",
  Teal = "Teal",
  Amber = "Amber",
  Cyan = "Cyan",
}
