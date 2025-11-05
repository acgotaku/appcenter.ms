import * as React from "react";
import * as PropTypes from "prop-types";
import { omit } from "lodash";
import { Keys } from "../utils/keys";
import { HTMLTagNames } from "@lib/common-interfaces/html-tag-names";
const css = require("./anchor.scss");

export interface AnchorProps extends React.HTMLAttributes<HTMLElement> {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  tagName?: HTMLTagNames;
  styles?: any;
}

interface DefaultProps {
  preventDefault: boolean;
  stopPropagation: boolean;
  tagName: HTMLTagNames;
  styles: any;
}

type AnchorPropsWithDefaultProps = AnchorProps & DefaultProps;

/**
 * Anchor gives you the ability to render an arbitrary HTML element that is clickable, focusable,
 * and fires its click handler when the enter key is pressed and it has focus. By default it renders
 * a `<span>` tag, but it can give any element the same accessible behavior as an anchor tag has.
 * (The rendered tag can be customized with the `tagName` prop.)
 *
 * @example
 * <Grid>
 *   <RowCol to="/">
 *     <BunchOfContent />
 *     <Anchor onClick={deleteRow}>Delete</Anchor>
 *   </RowCol>
 * </Grid>
 */
export class Anchor extends React.Component<AnchorProps, {}> {
  public static propTypes: React.ValidationMap<AnchorProps> = {
    preventDefault: PropTypes.bool.isRequired,
    stopPropagation: PropTypes.bool.isRequired,
  };

  public static defaultProps = {
    preventDefault: true,
    stopPropagation: false,
    tagName: "span",
    styles: css,
  };

  private element?: HTMLElement;

  public onClick = (event: React.MouseEvent<HTMLElement>) => {
    if (this.props.preventDefault) {
      event.preventDefault();
    }

    if (this.props.stopPropagation) {
      event.stopPropagation();
    }

    if (this.props.onClick) {
      this.props.onClick(event);
    }
  };

  public onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.which === Keys.Enter) {
      event.preventDefault();
      if (this.element) {
        this.element.click();
      }
    }

    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }
  };

  public render() {
    const passthrough = omit(this.props, "onClick", "preventDefault", "stopPropagation", "tagName", "styles");
    const className = [this.props.className, this.props.styles.anchor].join(" ");
    const { tagName: TagName } = this.props as AnchorPropsWithDefaultProps;

    return (
      <TagName
        ref={(x) => (this.element = x)}
        href="#"
        tabIndex={0}
        {...passthrough}
        onClick={this.onClick}
        onKeyDown={this.onKeyDown}
        className={className}
      >
        {this.props.children}
      </TagName>
    );
  }
}
