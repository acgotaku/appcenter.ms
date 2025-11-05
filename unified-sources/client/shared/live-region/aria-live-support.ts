import { isEdge, isFirefox, isSafari } from "../utils";
import { LiveRegionProps } from "./live-region";

enum LiveRoles {
  status = "status",
  alert = "alert",
  empty = "",
}

enum LiveValues {
  assertive = "assertive",
  polite = "polite",
  off = "off",
}

type SupportedLiveRegionAttributes = {
  role: LiveRoles[];
  "aria-live": LiveValues[];
  "aria-atomic": boolean;
  "aria-relevant": boolean;
  "aria-labelledby": boolean;
  "aria-describedby": boolean;
};

let supportedLiveAttributes: SupportedLiveRegionAttributes;
export function getSupportedLiveAttributes() {
  if (supportedLiveAttributes) {
    return supportedLiveAttributes;
  }
  const { empty, alert, status } = LiveRoles;
  const { polite, assertive, off } = LiveValues;
  supportedLiveAttributes = {
    role:
      isEdge || isSafari // tested only status, alert and without any roles
        ? [status, alert] // Edge doesn't annouce changrs when using aria-live without role
        : isFirefox
        ? [alert] // Firefox supports only alert role with NVDA
        : [status, alert, empty],
    "aria-live": isFirefox
      ? [assertive, off] // Firefox supports only assertive aria-live with NVDA
      : [polite, assertive, off],
    "aria-atomic": !isFirefox,
    "aria-relevant": !isFirefox,
    "aria-labelledby": true,
    "aria-describedby": true,
  };
  return supportedLiveAttributes;
}

type LiveRegionAriaProps = Pick<LiveRegionProps, keyof SupportedLiveRegionAttributes>;
export function getLiveAttributes(props: LiveRegionAriaProps) {
  const supported = getSupportedLiveAttributes();
  const result: LiveRegionAriaProps = {};
  for (const liveAttrName of Object.keys(supported)) {
    if (liveAttrName in props) {
      const isAttrSupported = Array.isArray(supported[liveAttrName])
        ? supported[liveAttrName].includes(props[liveAttrName] || "")
        : supported[liveAttrName];

      // Set the attribute if only supported
      if (isAttrSupported) {
        result[liveAttrName] = props[liveAttrName];
      }
    }
  }

  if (props.role !== result.role) {
    // required role is unsupported
    if (supported.role.includes(LiveRoles.empty)) {
      // check if supports aria-live without role
      const liveAttrSupport = supported["aria-live"];
      const replacement = props.role === LiveRoles.alert ? LiveValues.assertive : LiveValues.polite;

      // Set aria-live to get announcement to work
      // this assumes that it's better to have announcement
      // either assertive or polite if one is supported
      result["aria-live"] = liveAttrSupport.includes(replacement) ? replacement : liveAttrSupport[0];
    } else {
      // Doesn't support aria-live without role
      // set the most polite role as a replacement
      result.role = supported.role.includes(LiveRoles.status) ? LiveRoles.status : LiveRoles.alert;
    }
  } else if (props["aria-live"] !== result["aria-live"]) {
    // required aria-live is unsupported
    if (!result.role) {
      // check if the is no role set
      if (supported.role.includes(LiveRoles.empty)) {
        // check if supports aria-live without role
        result["aria-live"] = supported["aria-live"].includes(LiveValues.polite) // set the most possible polite aria-live
          ? LiveValues.polite
          : LiveValues.assertive;
      } else {
        // if no role set and empty role doesn't supported
        result.role = supported.role.includes(LiveRoles.status) // set the most pissible polite role
          ? LiveRoles.status
          : LiveRoles.alert;
      }
    }
  }

  return result;
}
