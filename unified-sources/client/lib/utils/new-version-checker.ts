import { get, noop } from "lodash";
import { portalServer } from "../http";

let timerId: NodeJS.Timer;
const duration = 5 * 60 * 1000; // 5 mins.
const oldCommit: string = get(window, "initProps.config.commit", "unknown");

let newVersionAvailable = false;

export const isNewVersionAvailable = () => newVersionAvailable;

const checkForNewVersion = () => {
  timerId = setTimeout(checkForNewVersion, duration);
  portalServer.get<{ commit?: string }>("/commit").then((response) => {
    if (response.commit && response.commit !== oldCommit) {
      clearTimeout(timerId);
      newVersionAvailable = true;
    }
  }, noop);
};

checkForNewVersion();
