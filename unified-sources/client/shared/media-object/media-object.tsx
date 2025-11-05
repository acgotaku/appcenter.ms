import * as React from "react";
import * as PropTypes from "prop-types";
import { omit } from "lodash";
import { Icon } from "../icon/icon";
import { Gravatar } from "../gravatar/gravatar";
import { Space } from "../common-interfaces";
import { exclusiveWith } from "../utils/prop-types";
import { Skeletal } from "../skeleton/skeleton";
import * as classNames from "classnames/bind";
import { flowRight as compose, eq, get } from "lodash/fp";
const css = require("./media-object.scss");
const { cloneElement } = React;

export interface MediaObjectProps extends Skeletal, React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  textOnly?: boolean;
  hSpace?: Space;
  vSpace?: Space;
  /** Allows text elements to wrap. By default, wrapping is not allowed and text will be ellipsized. */
  allowWrapping?: boolean;
  styles?: { [key: string]: string };
  /** Centers the icon vertically (default: true). */
  centered?: boolean;
}

export class MediaObject extends React.Component<MediaObjectProps, {}> {
  public static propTypes = {
    inline: PropTypes.bool,
    textOnly: PropTypes.bool,
    hSpace: PropTypes.number,
    vSpace: exclusiveWith(PropTypes.number, "inline", true),
    allowWrapping: PropTypes.bool,
    styles: PropTypes.object,
    centered: PropTypes.bool,
  };

  public static defaultProps = { styles: css, centered: true };

  private renderImage(element: React.ReactElement<any>, skeleton = false) {
    if (skeleton && (element.type === Icon || element.type === Gravatar)) {
      return cloneElement(element, { skeleton: true });
    } else if (skeleton) {
      return cloneElement(element, { className: classNames(element.props.className, this.props.styles!["image-skeleton"]) });
    }

    return element;
  }

  private renderTitle(element: React.ReactElement<any>, skeleton = false) {
    return skeleton
      ? cloneElement(element, {
          className: classNames(this.props.styles!["title-skeleton"], element.props.className),
        })
      : element;
  }

  private renderSubtitle(element: React.ReactElement<any>, skeleton = false) {
    if (skeleton && this.props.inline) {
      return null;
    }

    return skeleton
      ? cloneElement(element, {
          className: classNames(this.props.styles!["subtitle-skeleton"], element.props.className),
        })
      : element;
  }

  public render() {
    const { inline, skeleton, textOnly, vSpace, hSpace, allowWrapping, styles, centered } = this.props;
    const children = React.Children.toArray(this.props.children) as React.ReactElement<any>[];
    const className = classNames.call(
      styles,
      centered ? "header-centered" : "header",
      this.props.className,
      vSpace ? `v-space-${Space[vSpace].toLowerCase()}` : null,
      hSpace ? `h-space-${Space[hSpace].toLowerCase()}` : null,
      { textOnly }
    );
    const passthrough = omit(this.props, "skeleton", "styles", Object.keys(MediaObject.propTypes));
    const image = textOnly ? null : children[0];
    const title = image ? children[1] : children[0];
    const subtitle = image ? children[2] : children[1];
    const disallowWrapping = !allowWrapping;

    return (
      <div {...passthrough} className={className}>
        {image ? this.renderImage(image, skeleton) : null}
        <div className={classNames.call(styles, inline ? "inline-text" : "stacked-text", { allowWrapping, disallowWrapping })}>
          {this.renderTitle(title, skeleton)}
          {subtitle ? this.renderSubtitle(subtitle, skeleton) : null}
        </div>
      </div>
    );
  }
}

/**
 * Whether a ReactElement is a Trigger
 */
export const isMediaObject = compose(eq(MediaObject), get("type"));
