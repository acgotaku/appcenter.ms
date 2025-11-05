import * as React from "react";
import { get, noop, xor, uniqueId } from "lodash";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { HTMLSelect } from "./htmlselect";
import { OptionProps } from "./option";
import { ItemGroupProps, isItemGroup } from "../dropdown/item-group";
import { DropdownButton, DropdownButtonProps } from "../button/button";
import { Dropdown, DropdownProps } from "../dropdown/dropdown";
import { Trigger, TriggerProps, isTrigger } from "../trigger/trigger";
import { isWindows } from "../utils";
import { OverlayPositionerProps } from "@root/shared/overlay-positioner";
import { replaceSpacesWithDashes } from "@root/lib/utils/strings";

const classNames = require("classnames");
const css = require("./select.scss");
const platformSpecificTriggerProps: Partial<TriggerProps> = isWindows ? { role: "listbox" } : { role: "button" };

/**
 * Props passed to a Select component
 */
export interface SelectProps {
  onClose?(value: string[] | string): void;
  onChange?(value: string[] | string): void;
  onSearch?(query: string): void;
  onKeyDown?: DropdownProps["onKeyDown"];
  onBlur?: DropdownProps["onBlur"];
  onFocus?: DropdownProps["onFocus"];
  minListWidth?: DropdownProps["minListWidth"];
  multiple?: boolean;
  compact?: boolean;
  placeholder?: string;
  value?: string | string[];
  defaultValue?: string | string[];
  triggerClassName?: string;
  styles?: any;
  searchable?: boolean;
  spinning?: boolean;
  name?: string;
  color?: DropdownButtonProps["color"];
  icon?: DropdownButtonProps["icon"];
  error?: DropdownButtonProps["error"];
  size?: DropdownButtonProps["size"];
  input?: DropdownButtonProps["input"];
  label?: DropdownButtonProps["label"];
  disabled?: DropdownButtonProps["disabled"];
  subtle?: DropdownButtonProps["subtle"];
  deferRender?: OverlayPositionerProps["deferRender"];
  backdrop?: OverlayPositionerProps["backdrop"];
  backdropClassName?: OverlayPositionerProps["backdropClassName"];
  portaled?: OverlayPositionerProps["portaled"];
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-live"?: "off" | "polite" | "assertive";
}

/**
 * Select component state
 */
export interface SelectState {
  value?: string[] | string;
}

/**
 * @deprecated
 * Use @root/shared/select/v2 instead.
 */
@observer
export class Select extends React.Component<SelectProps, SelectState> {
  /**
   * Fallback values used when props aren't passed to the Select component
   * @static
   */
  public static defaultProps = {
    onClose: noop,
    onChange: noop,
    onSearch: noop,
    triggerClassName: "",
    styles: css,
  };

  /**
   * Select component state
   * @type {SelectState}
   */
  public state: SelectState = {
    value: this.props.defaultValue,
  };

  /**
   * Rendered HTML element
   */
  public htmlSelect: HTMLSelect | null = null;
  private itemsByValue = observable.map({}, { deep: false });
  private triggerId = uniqueId("select-trigger-");

  /**
   * Calls onChange handler from props
   * @param {(string[] | string)} value
   * @returns {void}
   */
  public onChange = (value: string[] | string): void => {
    // Mutliple select - append or reset
    if (!this.isControlled && this.props.multiple) {
      this.setState({ value: value && value.length ? xor(this.value || [], ([] as string[]).concat(value)) : [] });
    }
    // Single select - replace
    if (!this.isControlled && !this.props.multiple) {
      this.setState({ value });
    }
    this.props.onChange!(value);
  };

  /**
   * Calls onClose handler from props
   * @param {(string[] | string)} value
   * @returns {void}
   */
  private onClose = () => {
    if (this.value) {
      this.props.onClose!(this.value);
    }
  };

  private onActivateItem = (value: string, event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    this.onChange(value);
  };

  /**
   * Gets whether Select is a controlled or uncontrolled component
   * Details: https://facebook.github.io/react/docs/forms.html#controlled-components
   * @readonly
   * @private
   * @type {boolean}
   */
  private get isControlled(): boolean {
    return this.props.hasOwnProperty("value");
  }

  public getSelectedItemText() {
    const value = this.value;
    if (typeof value === "string") {
      const item = this.itemsByValue.get(value);
      return item ? item.text : undefined;
    } else if (value) {
      return Array.from(this.itemsByValue.entries())
        .reduce((texts: string[], tuple) => texts.concat(value.includes(tuple[0]) ? [tuple[1].text] : []), [])
        .join(", ");
    }

    return undefined;
  }

  private getAriaLabel(triggerText?: string) {
    /**  If we explicitly pass an aria-label, then that's because we really want that to be the sole aria-label.
     We don't want to put the current value into the aria-label, because in a case where we explicitly pass aria-label,
     the current value isn't presented to non-screenreader users either, and so it doesn't and shouldn't be announced as aria-label either.
    */
    if (this.props["aria-label"]) {
      return this.props["aria-label"];
    }

    const ariaLabel = this.props.label || this.props.placeholder;
    if (triggerText) {
      return `${ariaLabel}, ${triggerText}`;
    }

    return ariaLabel;
  }

  /**
   * Gets icon associated with first selected value displayed in Select’s Trigger
   * @type {number}
   */
  get icon(): React.ReactElement<any> | undefined {
    const { children } = this.props;
    const values: string[] = ([] as string[]).concat(this.hasValue ? this.value! : []);
    return get(
      React.Children.toArray(children).find((child) => {
        if (typeof child === "object") {
          return values.includes(child.props.value);
        }
        return false;
      }) as React.ReactElement<any>,
      "props.icon",
      undefined
    );
  }

  /**
   * Gets selected option(s)
   * @readonly
   * @type {(string[] | string)}
   */
  get value() {
    return this.isControlled ? this.props.value : this.state.value;
  }

  /**
   * This is here solely to make it work with Formsy.
   * Returns the current value of the actual HTML input in the DOM.
   * @returns {string}
   */
  public getValue(defaultValue: string) {
    return this.value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  }

  public resetValue() {
    if (!this.isControlled) {
      this.setState({ value: this.props.defaultValue });
    }
  }

  /**
   * Gets whether any option(s) is selected
   * @readonly
   */
  get hasValue() {
    return this.props.multiple ? this.value && this.value.length : this.value;
  }

  private isSelected(option: string) {
    if (this.props.multiple) {
      return this.value && this.value.length ? this.value.includes(option) : !option; // A falsey option matches an empty selection state
    } else {
      return this.value === option;
    }
  }

  private getTrigger(): JSX.Element {
    const { placeholder, error, label, disabled, size, input, subtle, color, icon } = this.props;
    const children = React.Children.toArray(this.props.children) as React.ReactElement<any>[];
    const selectedItemText = this.getSelectedItemText();
    const triggerProps: Partial<TriggerProps> = {
      className: this.props.styles.trigger,
      "aria-live": this.props["aria-live"] || "assertive",
      ...platformSpecificTriggerProps,
    };

    if (this.props["aria-labelledby"]) {
      triggerProps["aria-labelledby"] = replaceSpacesWithDashes(this.props["aria-labelledby"]);
    } else if (this.getAriaLabel(selectedItemText)) {
      triggerProps["aria-label"] = this.getAriaLabel(selectedItemText);
      triggerProps.id = this.triggerId;
    }

    if (isTrigger(children[0])) {
      return React.cloneElement(children[0], triggerProps);
    } else {
      return (
        <Trigger {...triggerProps} className={this.props.triggerClassName}>
          <DropdownButton
            icon={icon || this.icon}
            error={error}
            label={label}
            disabled={disabled}
            size={size}
            input={input}
            subtle={subtle}
            color={color}
          >
            {selectedItemText || placeholder}
          </DropdownButton>
        </Trigger>
      );
    }
  }

  @action
  private registerItem = (text: string, value: string, getDOMNode: () => HTMLElement) => {
    if (typeof value === "string") {
      this.itemsByValue.set(value, { text, getDOMNode });
    }
  };

  @action
  private unregisterItem = (text: string, value: string) => {
    if (typeof value === "string") {
      // If `deferRender` is true, the option will unregister itself,
      // which would cause the trigger text to be lost without this conditional.
      // We keep the value/text mapping alive, but replace `getDOMNode` with a
      // null-returning function since we know the DOM node has been removed.
      if (this.props.deferRender) {
        this.itemsByValue.set(value, { text, getDOMNode: () => null });
      } else {
        this.itemsByValue.delete(value);
      }
    }
  };

  /**
   * Gets options, setting their `multiple` and `selected` props
   */
  get children(): React.ReactElement<OptionProps | ItemGroupProps>[] {
    const { multiple } = this.props;
    const children = React.Children.toArray(this.props.children) as React.ReactElement<any>[];
    const index = isTrigger(children[0]) ? 1 : 0;
    const cloneOption = (element, multiple) => {
      return React.cloneElement(element, {
        multiple,
        selected: this.isSelected(element.props.value),
      } as OptionProps);
    };

    return children.slice(index).map((element) => {
      if (isItemGroup(element)) {
        const itemGroupOptions = React.Children.toArray(element.props.children) as React.ReactElement<any>[];
        return React.cloneElement(
          element,
          {},
          itemGroupOptions.map((option) => cloneOption(option, multiple))
        );
      } else {
        return cloneOption(element, multiple);
      }
    });
  }

  public componentDidMount() {
    // If we get passed aria-labelledby (which we use for the trigger button), that means that our trigger itself doesn't have
    // it's own label, and so we cannot link to it in the overlay's aria-labelledby and must instead link to the "root" label - which the trigger uses
    if (this.props["aria-labelledby"]) {
      this.triggerId = replaceSpacesWithDashes(this.props["aria-labelledby"]);
    }
  }

  /**
   * Sync Select value to HTMLSelect
   */
  public componentDidUpdate(prevProps: SelectProps, prevState: SelectState) {
    if (!this.isControlled && this.value !== prevState.value && this.htmlSelect) {
      this.htmlSelect.value = this.value;
    }
  }

  public render() {
    const {
      multiple,
      className,
      styles,
      backdrop,
      onClose,
      onChange,
      onSearch,
      compact,
      placeholder,
      value: _,
      defaultValue,
      triggerClassName,
      name,

      // DropdownButton
      error,
      label,
      disabled,
      color,
      icon,
      size,
      input,
      subtle,
      ...passthrough
    } = this.props;

    /**
     * Passed to HTMLSelect if it should be a controlled component
     */
    const maybeValue = this.isControlled ? { value: this.value } : {};
    const value = this.value;
    const item = typeof value === "string" ? this.itemsByValue.get(value) : undefined;

    return (
      <>
        <Dropdown
          {...passthrough}
          className={classNames(styles.select, className)}
          sticky={multiple}
          onClose={this.onClose}
          onActivateItemWithKeyboard={this.onActivateItem}
          onActivateItem={this.onActivateItem}
          backdrop={backdrop}
          sizeListToTrigger={backdrop}
          role={isWindows ? "listbox" : "menu"}
          onRegisterItem={this.registerItem}
          onUnregisterItem={this.unregisterItem}
          getInitialFocusedItem={item ? item.getDOMNode : undefined}
          aria-labelledby={this.triggerId}
        >
          {this.getTrigger()}
          {this.children}
        </Dropdown>
        <HTMLSelect
          name={name}
          className={styles["html-select"]}
          multiple={multiple}
          onChange={this.onChange}
          ref={(htmlSelect) => (this.htmlSelect = htmlSelect)}
          tabIndex={-1}
          aria-hidden="true"
          role="presentation"
          {...maybeValue}
        >
          {this.children}
        </HTMLSelect>
      </>
    );
  }
}
