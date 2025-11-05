import * as React from "react";
import * as PropTypes from "prop-types";
import { findDOMNode } from "react-dom";
import { ListItem } from "../dropdown/list-item";
import { ListItemContext, listItemContextTypes } from "../dropdown/list-item-context";
import { Checkbox } from "../checkbox";
import { isWindows } from "../utils";

const css = require("./option.scss");
const classNames = require("classnames/bind");

export interface OptionProps extends React.HTMLAttributes<HTMLElement> {
  value: string;
  text: string;
  selected?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  styles?: any;
}

export class Option extends React.Component<OptionProps, {}> {
  public context!: ListItemContext;
  public static displayName = "Option";
  public static contextTypes = listItemContextTypes;
  public static propTypes = {
    value: PropTypes.string.isRequired,
    selected: PropTypes.bool,
    multiple: PropTypes.bool,
    text: PropTypes.string.isRequired,
  };

  public static defaultProps = { styles: css };

  private registerItem(props: OptionProps) {
    this.context.dropdownContext.registerItem(props.text, props.value, () => findDOMNode(this) as HTMLElement);
  }

  private unregisterItem(props: OptionProps) {
    this.context.dropdownContext.unregisterItem(props.text, props.value);
  }

  public onClick = (event: React.SyntheticEvent<HTMLElement>) => {
    if (this.props.disabled) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      if (this.context.dropdownContext.onSelect) {
        this.context.dropdownContext.onSelect(this.props.value, event);
      }
    }
  };

  // Delay a fresh Option registration unil unregister of the previous one be called
  public componentDidMount() {
    if (!this.props.disabled) {
      this.registerItem(this.props);
    }
  }

  // Use cWU instead of cWRP because cWRP could be called multiple times
  public UNSAFE_componentWillUpdate(nextProps) {
    if (nextProps.disabled && !this.props.disabled) {
      this.unregisterItem(this.props);
    } else if (
      nextProps.text !== this.props.text ||
      nextProps.value !== this.props.value ||
      (!nextProps.disabled && this.props.disabled)
    ) {
      this.unregisterItem(this.props);
      this.registerItem(nextProps);
    }
  }

  public componentWillUnmount() {
    this.unregisterItem(this.props);
  }

  public render() {
    const { value, selected, multiple, text, children, styles, ...props } = this.props;
    const className = classNames.call(styles, props.className, multiple ? "option" : "single", { selected });
    const content = children || text;

    return (
      <ListItem
        text={text}
        selected={selected}
        {...props}
        role={isWindows ? "option" : "menuitem"}
        aria-label={selected ? `✓, ${text}` : text}
        aria-selected={selected}
        className={className}
        onClick={this.onClick}
        tabIndex={-1}
      >
        {multiple ? (
          <Checkbox checked={selected} value={value} onChange={this.onClick} className={styles.checkbox} tabIndex={-1} />
        ) : null}
        {content}
      </ListItem>
    );
  }
}
