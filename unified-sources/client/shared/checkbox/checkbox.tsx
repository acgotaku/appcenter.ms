import * as React from "react";
import * as PropTypes from "prop-types";
import { omit, pick, uniqueId, extend } from "lodash";
import { isEdge } from "../utils";
const css = require("./checkbox.scss");
import * as classNamesBind from "classnames/bind";
const cx = classNamesBind.bind(css);

export interface HtmlAttributes {
  [key: string]: string | undefined;
}

interface BinaryBaseProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  indeterminate?: boolean;
  value?: string;
  disabled?: boolean;
  emphasized?: boolean;
  label?: string;
  tabIndex?: number;
  withoutFocusStyle?: boolean;
  hasExternalLabel?: boolean;
  styles?: any;
}

const binaryBaseProps: React.WeakValidationMap<BinaryBaseProps> = {
  checked: PropTypes.bool,
  indeterminate: PropTypes.bool,
  value: PropTypes.string,
  disabled: PropTypes.bool,
  emphasized: PropTypes.bool,
  label: PropTypes.string,
  tabIndex: PropTypes.number,
  onChange: PropTypes.func,
  role: PropTypes.string,
};
const binaryBaseKeys = Object.keys(binaryBaseProps);
const binaryBaseAttributes = Object.keys(omit(binaryBaseProps, "indeterminate", "label", "emphasized"));

class BinaryBase extends React.Component<BinaryBaseProps, {}> {
  public static propTypes = binaryBaseProps;
  public static defaultProps = { styles: css };
  public id?: string;
  public input: HTMLInputElement | null = null;
  constructor(props: BinaryBaseProps) {
    super(props);
    this.createId();
  }
  public onClick = () => {
    if (!this.props.hasExternalLabel && this.input) {
      this.input.click();
    }
  };
  public onInputClick = (event) => {
    // Just called on Edge when the input is indeterminate.
    if (this.props.onChange) {
      this.props.onChange(event);
    }
  };
  public createId = (): string | undefined => {
    if (this.props.children) {
      return (this.id = uniqueId());
    }
  };
  public getLabelId = (): string | undefined => {
    if (this.props.children) {
      return `label-${this.id}`;
    }
  };
  public getAriaAttribute = (): HtmlAttributes | null => {
    const { children, label } = this.props;
    const attribute = this.props["aria-describedby"] ? { "aria-describedby": this.props["aria-describedby"] } : {};
    switch (true) {
      case !!label:
        attribute["aria-label"] = label;
        return attribute;
      case !!children:
        attribute["aria-labelledby"] = this.props["aria-labelledby"] || this.getLabelId();
        return attribute;
      default:
        return null;
    }
  };
  public getLabelAttributes = (): HtmlAttributes | undefined => {
    if (this.props.children) {
      return {
        id: this.getLabelId(),
      };
    }
  };
  public render() {
    const wrapperProps = omit(this.props, binaryBaseKeys, "children", "styles", "withoutFocusStyle", "hasExternalLabel");
    let inputProps = pick(this.props, binaryBaseAttributes);
    const isLabel = this.props.children && !this.props.hasExternalLabel;
    const Tag = isLabel ? "label" : "span";
    const addtlTagProps = { "aria-hidden": isLabel ? undefined : true, tabindex: isLabel ? undefined : "-1" };
    // On Edge, the indeterminate inputs don't trigger any 'onchange' event. As a workaround,
    // we trigger the `onChange` callback on the 'onclick' event.
    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7344418/
    if (isEdge && this.props.indeterminate) {
      inputProps = extend(omit(inputProps, "onChange"), { onClick: this.onInputClick });
    }
    return (
      <div
        ref="wrapper"
        role="presentation"
        {...(wrapperProps as React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>)}
      >
        <input
          ref={(x) => (this.input = x)}
          type="checkbox"
          aria-checked={this.props.checked}
          className={this.props.withoutFocusStyle ? css.withoutFocus : null}
          {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
          {...this.getAriaAttribute()}
        />
        <Tag
          data-test-class={this.props["data-test-class"] || "checkbox-label"}
          {...this.getLabelAttributes()}
          {...addtlTagProps}
          className={cx("box", { emphasized: this.props.emphasized })}
          onClick={this.onClick}
        >
          {this.props.children}
        </Tag>
      </div>
    );
  }
}

const checkboxProps: React.WeakValidationMap<BinaryBaseProps & { toggle?: boolean }> = {
  ...binaryBaseProps,
  toggle: PropTypes.bool,
};
export class Checkbox extends React.Component<BinaryBaseProps & { toggle?: boolean }, {}> {
  public static propTypes = checkboxProps;
  public static defaultProps = { styles: css };
  public base: BinaryBase | null = null;
  public componentDidMount() {
    if (this.base && this.base.input) {
      this.base.input.indeterminate = !!this.props.indeterminate;
    }
  }
  public componentDidUpdate() {
    if (this.base && this.base.input) {
      this.base.input.indeterminate = !!this.props.indeterminate;
    }
  }
  public render() {
    const passthrough = omit(this.props, "className", "styles", "toggle");
    const className = [this.props.className, css.checkbox].join(" ");
    const DEPRECATED = typeof this.props.toggle === "boolean";
    if (process.env.NODE_ENV !== "production" && DEPRECATED) {
      throw new Error(
        "DEPRECATION: Passing `toggle` to `Checkbox` is deprecated. " + "Please refactor from `<Checkbox toggle />` to `<Toggle />`."
      );
    }
    return <BinaryBase ref={(x) => (this.base = x)} className={className} data-test-class="checkbox-label" {...passthrough} />;
  }
}

export class Toggle extends React.Component<BinaryBaseProps, {}> {
  public static propTypes = binaryBaseProps;
  public static defaultProps = { styles: css };
  public render() {
    const passthrough = omit(this.props, "className", "styles", "role");
    const className = [this.props.className, css.toggle].join(" ");
    const UNSUPPORTED = typeof this.props.indeterminate === "boolean";
    if (UNSUPPORTED) {
      console.warn(
        "UNSUPPORTED: Passing `indeterminate` to `Toggle` is unsupported. " +
          "Please refactor from `<Toggle indeterminate />` to `<Toggle />`."
      );
    }
    return <BinaryBase className={className} data-test-class="toggle" role="switch" {...passthrough} />;
  }
}
