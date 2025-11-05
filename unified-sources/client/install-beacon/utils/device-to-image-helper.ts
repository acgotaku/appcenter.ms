import { Device } from "@root/data/management";

const iPadImgSrc = require("@root/install-beacon/assets/devices/iPad_sml.png");
const iPhone5ImgSrc = require("@root/install-beacon/assets/devices/iPhone5_sml.png");
const iPhone6ImgSrc = require("@root/install-beacon/assets/devices/iPhone6_sml.png");
const iPhone7ImgSrc = require("@root/install-beacon/assets/devices/iPhone7_sml.png");
const iPhone10ImgSrc = require("@root/install-beacon/assets/devices/iPhone10_sml.png");

export default function getDeviceThumbnail(device: Device) {
  const { deviceName } = device;
  if (deviceName!.includes("iPhone")) {
    if (deviceName!.includes("5")) {
      return iPhone5ImgSrc;
    } else if (deviceName!.includes("6")) {
      return iPhone6ImgSrc;
    } else if (deviceName!.includes("7")) {
      return iPhone7ImgSrc;
    } else {
      return iPhone10ImgSrc;
    }
  } else {
    return iPadImgSrc;
  }
}
