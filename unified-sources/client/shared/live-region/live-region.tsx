import * as React from "react";
import * as PropTypes from "prop-types";
import { uniqueId } from "lodash";
import { getLiveAttributes } from "./aria-live-support";
import { isSafari, isFirefox } from "../utils";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";

type AriaRelavantType = React.HTMLAttributes<HTMLDivElement>["aria-relevant"];
export interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Defines wherether live-region is active and children will be rendered,
   * `true` is the default.
   */
  active: boolean;
  /**
   * In the following well-known predefined cases it is better to use a specific provided live region role:
   * - `"status"` for a status bar or area of the screen that provides an updated status of some kind.
   * Screen reader users have a special command to read the current status.
   * - `"alert"` for error or warning message that flashes on the screen.
   * Alerts are particularly important for client side validation notices to users.
   *
   * `"status"` is the default.
   */
  role?: "status" | "alert";
  /**
   * The `aria-live` is used to set the priority with which screen reader should treat
   * updates to live regions - the possible settings are: `"off"`, `"polite"` or `"assertive"`.
   * The default setting is `"off"`. This attribute is by far the most important.
   */
  "aria-live"?: "polite" | "assertive" | "off";
  /**
   * The `aria-atomic` is used to set whether or not the screen reader should always present the live region
   * as a whole, even if only part of the region changes - the possible settings are
   * false/true where `false` is the default.
   * - `true` The entire region should be read anytime anything in it changes.
   * - `false` Only the item that changes should be read when it changes.
   */
  "aria-atomic"?: boolean;
  /**
   * The `aria-relevant` is used to set what types of changes are relevant to a live region,
   * `"additions text"` is the default.
   */
  "aria-relevant"?: AriaRelavantType;
  /**
   * The `aria-labelledby` is used to associate a region with its labels, similar to `aria-controls`
   * but instead associating labels to the region and again label identifiers are separated with a space.
   */
  "aria-labelledby"?: string;
  /**
   * The `aria-describedby` is used to associate a region with its descriptions,
   * similar to `aria-controls` but instead associating descriptions to the region and description
   * identifiers are separated with a space.
   */
  "aria-describedby"?: string;
  tagName: React.ComponentType<React.HTMLAttributes<HTMLElement>> | HTMLTagNames;
}

function uniqLiveRegionKey() {
  return uniqueId("live-region-");
}

export class LiveRegion extends React.PureComponent<LiveRegionProps> {
  public static propTypes: React.ValidationMap<LiveRegionProps> = {
    active: PropTypes.bool.isRequired,
  };

  public static defaultProps = {
    active: true,
    role: "status",
    tagName: "div",
  };

  public state = {
    key: uniqLiveRegionKey(),
  };

  public UNSAFE_componentWillReceiveProps(nextProps, props) {
    // Safari/Firefox won't announce anything when adding live attributes to existing element.
    // This forces element recreation for such cases.
    if ((isSafari || isFirefox) && nextProps.active !== props.active) {
      this.setState({
        key: uniqLiveRegionKey(),
      });
    }
  }

  get a11yProps() {
    const { active, children } = this.props;

    // Prevent Firefox from announcing empty alerts
    if (isFirefox && (!active || !children)) {
      return {
        role: undefined,
        "aria-live": undefined,
      };
    }

    return getLiveAttributes(this.props);
  }

  public render() {
    const { children, active, tagName: Tag, ...passThrough } = this.props;
    return active ? (
      <Tag {...passThrough} {...this.a11yProps} key={this.state.key}>
        {children}
      </Tag>
    ) : null;
  }
}
