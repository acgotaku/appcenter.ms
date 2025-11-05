import * as MurmurHash3 from "imurmurhash";

export enum StyleTypes {
  Container = "container",
  Text = "text",
  Icon = "icon",
}

export enum ColorSets {
  Colors = "colors",
  Light1Colors = "light1Colors",
  Dark1Colors = "dark1Colors",
  Light2Colors = "light2Colors",
  Dark2Colors = "dark2Colors",
}

export const IdenticonColors = {
  colors: ["#1FAECE", "#44B8A8", "#91CA47", "#9378CD", "#F56D4F", "#F1C40F"],
  light1Colors: ["#9EEDFF", "#A3DCD4", "#DEFFB3", "#C4B7E1", "#FFD4CC", "#F6ECC6"],
  dark1Colors: ["#0D6C8C", "#066559", "#4E7C13", "#4D23CD", "#B91F04", "#8B5C04"],
  light2Colors: ["#ABE5F2", "#BCEBE5", "#D9EEBE", "#CEC0EC", "#FDD7CE", "#F7EECA"],
  dark2Colors: ["#286680", "#107063", "#427402", "#584294", "#B7321A", "#A25701"],
};

export const getColor = (value: string, colors: string[] = IdenticonColors.colors) => {
  const hash = MurmurHash3(value).result();
  const index = hash % colors.length;
  return colors[index];
};

export const getColorClassName = (value: string, style: StyleTypes, color: ColorSets) => {
  const hash = MurmurHash3(value).result();
  const index = hash % IdenticonColors.colors.length;
  return `${style}-${color}-${index + 1}`;
};
