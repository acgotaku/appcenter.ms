import { OS } from "@lib/common-interfaces/app";
import * as uaParser from "ua-parser-js";
import { supportsTouch } from "./supports-touch";

export function getOsNameFromUserAgent(): string {
  const parsedOs = getOsFromUserAgent();
  const osStrings: string[] = parsedOs.name ? parsedOs.name.split(" ") : [];
  return osStrings[0] || "";
}

export function getOsFromUserAgent(): IUAParser.IOS {
  const parser = new uaParser.UAParser();
  const parsedOs = parser.getOS();
  let osName = parsedOs.name;

  // if OS is "Mac OS" from user agent, and if the device supports touch, then its an iOS (ipad or iphone)
  // this is to fix an issue in iPadOS 13 where safari's default user agent returns "Mac OS" as OS name.
  if (osName && osName.toLowerCase().startsWith("mac") && supportsTouch()) {
    osName = OS.IOS;
  }

  return { ...parsedOs, name: osName || "" };
}

export function getBrowserFromUserAgent(): IUAParser.IBrowser {
  const parser = new uaParser.UAParser();
  const browser = parser.getBrowser();
  let browserName = browser.name;

  // iPadOS 13's Safari now opens in desktop mode by default, and in this mode, the user agent has "Safari" as browser name.
  // which is different than iOS 12 where Safari's user agent had "Mobile Safari" as browser name.
  // use supportsTouch() util to return the correct compatible browser name.
  if (browserName && browserName.toLowerCase().indexOf("safari") !== -1 && supportsTouch()) {
    browserName = "Mobile Safari";
  }

  return { ...browser, name: browserName };
}
