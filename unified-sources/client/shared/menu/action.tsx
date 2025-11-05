import * as React from "react";
import { Link } from "react-router";
import { findDOMNode } from "react-dom";
import { Copy, CopyProps } from "../copy";
import { ListItem } from "../dropdown/list-item";
import { listItemContextTypes, ListItemContext } from "../dropdown/list-item-context";
import { preventBubbling } from "../utils";

export interface ActionProps extends Partial<CopyProps>, React.AnchorHTMLAttributes<HTMLElement> {
  text: string;
  href?: string;
  to?: string;
  disabled?: boolean;
  danger?: boolean;
}

export class Action extends React.Component<ActionProps, {}> {
  public context!: ListItemContext;
  public static contextTypes = listItemContextTypes;

  private registerItem() {
    this.context.dropdownContext.registerItem(this.props.text, "", () => findDOMNode(this) as HTMLElement);
  }

  componentDidMount() {
    if (!this.props.disabled) {
      this.registerItem();
    }
  }

  public UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.disabled && !this.props.disabled) {
      this.context.dropdownContext.unregisterItem(this.props.text);
    } else if (!nextProps.disabled && this.props.disabled) {
      this.registerItem();
    } else if (nextProps.text !== this.props.text || nextProps.disabled !== this.props.disabled) {
      this.registerItem();
    }
  }

  public componentWillUnmount() {
    this.context.dropdownContext.unregisterItem(this.props.text);
  }

  public render() {
    const { text, children, href, to, clipboardData, onCopied, disabled, copiedMessage, ...props } = this.props;
    const clickBlocker = disabled ? { onClick: preventBubbling } : {};
    const specialtyProps = (() => {
      switch (true) {
        case typeof to === "string":
          return { tagName: Link, to };
        case typeof href === "string":
          return { tagName: "a", href };
        case typeof clipboardData !== "undefined":
          return { tagName: Copy, clipboardData, onCopied, copiedMessage };
        default:
          return {};
      }
    })();

    return (
      <ListItem text={text} disabled={disabled} {...props} {...specialtyProps} {...clickBlocker}>
        {children || text}
      </ListItem>
    );
  }
}
