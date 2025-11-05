import * as React from "react";
import * as PropTypes from "prop-types";
import { Block, BlockProps, BlockPadding, MaterialShadow, BlockBorderRadius } from "../block";
import { FakeButton } from "../fake-button";
import { Link } from "react-router";
import { PageContext } from "../page";

const css = require("./card.scss");
const classNames = require("classnames/bind");
const cx = classNames.bind(css);

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Content to render at the top of the Card. See `HeaderArea` documentation for details. */
  header?: BlockProps["header"];
  /** Renders the `header` with its own padding and a light bottom border. */
  dividedHeader?: BlockProps["dividedHeader"];
  /** Content to render at the top of the Card. See `HeaderArea` documentation for details. */
  footer?: BlockProps["footer"];
  /** Renders the `header` with its own padding and a light bottom border. */
  dividedFooter?: BlockProps["dividedFooter"];
  /** Renders a light gray border around the card. */
  bordered?: boolean;
  /** Removes the default padding from the card. Useful for using other components that include their own padding directly inside Card, like `QueryBuilder` or padded Grids. */
  withoutPadding?: boolean;
  /** Customizes the component or element used as the root element of the card. */
  tagName?: BlockProps["tagName"];
  children?: BlockProps["children"];
  withoutBorderRadius?: boolean;
  /**
   * The path to link to, e.g. /users/123.
   * @type {LocationDescriptor}
   */
  to?: string;
}

export interface CardState {
  contentsFocused: boolean;
}

export class Card extends React.Component<CardProps, CardState> {
  public static propTypes: React.WeakValidationMap<CardProps> = {
    withoutPadding: PropTypes.bool,
    onClick: PropTypes.func,
  };

  public state = {
    contentsFocused: false,
  };

  get tagName() {
    if (this.props.tagName) {
      return this.props.tagName;
    }
    if (this.props.to) {
      return Link;
    }
    if (this.props.onClick) {
      return FakeButton;
    }
    return "div";
  }

  public onFocus = (event: React.FocusEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) {
      this.setState({ contentsFocused: true });
    }
  };

  public onBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) {
      this.setState({ contentsFocused: false });
    }
  };

  public render() {
    const { withoutPadding, className, withoutBorderRadius, ...props } = this.props;
    const { contentsFocused } = this.state;
    // Narrator doesn’t announce nested role=button elements.
    // This removes the role when something inside the Card gets focus.
    const roleProp = contentsFocused ? { role: undefined } : undefined;
    const isNavigable = this.tagName === Link || this.tagName === FakeButton;
    const focusProps = isNavigable ? { onFocus: this.onFocus, onBlur: this.onBlur } : null;

    return (
      <PageContext.Consumer>
        {({ edgeToEdge }) => (
          <Block
            tagName={this.tagName}
            shadow={MaterialShadow.CardSubtle}
            padding={withoutPadding ? BlockPadding.None : BlockPadding.Default}
            borderRadius={withoutBorderRadius ? BlockBorderRadius.None : BlockBorderRadius.Medium}
            className={cx({ edgeToEdge }, className)}
            {...props}
            {...roleProp}
            {...focusProps}
          />
        )}
      </PageContext.Consumer>
    );
  }
}
