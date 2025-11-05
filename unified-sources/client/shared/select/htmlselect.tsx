import * as React from "react";
import { get, map, pipe, toArray } from "lodash/fp";

/**
 * DOM element for single or multiple selection
 */
export interface HTMLSelectElement extends Element {
  selectedOptions: ArrayLike<Element>;
  value: string[] | string;
}

/**
 * Props passed to a HTMLSelectProps component
 */
export interface HTMLSelectProps {
  onChange?(value?: string[] | string): void;
  multiple?: boolean;
  value?: string | string[];
  [key: string]: any;
}

/**
 * DOM element for single or multiple selection
 */
export class HTMLSelect extends React.Component<HTMLSelectProps, {}> {
  /**
   * Rendered HTML element
   */
  public htmlSelect: HTMLSelectElement | null = null;

  /**
   * Gets whether HTMLSelect is a controlled or uncontrolled component
   * Details: https://facebook.github.io/react/docs/forms.html#controlled-components
   * @readonly
   * @private
   * @type {boolean}
   */
  private get isControlled(): boolean {
    return this.props.hasOwnProperty("value");
  }

  /**
   * Gets selected option(s)
   * @type {(string[] | string | undefined)}
   */
  get value(): string[] | string | undefined {
    const values = pipe(get("htmlSelect.selectedOptions"), toArray, map(get("value")))(this) as string[];
    return this.props.multiple ? values : values[0] || undefined;
  }

  /**
   * Sets selected option(s)
   * @type {(string[] | string | undefined)}
   */
  set value(value: string[] | string | undefined) {
    if (this.htmlSelect && value) {
      this.htmlSelect.value = value;
    }
  }

  /**
   * Calls onChange handler from props when HTMLSelect is uncontrolled
   * @returns {void}
   */
  public onChange = (): void => {
    if (this.isControlled) {
      return;
    }
    if (this.props.onChange) {
      this.props.onChange(this.value);
    }
  };

  /**
   * Renders an HTMLSelect component
   * @returns {React.ReactElement<any>} Popover component
   */
  public render() {
    /**
     * Props not specifically handled by HTMLSelect
     * These should be passed through to the HTML element
     * @constant {*}
     */
    const { onChange, ...passthrough } = this.props;

    return (
      <select onChange={this.onChange} ref={(htmlSelect) => (this.htmlSelect = htmlSelect)} {...passthrough}>
        {React.Children.map<JSX.Element, React.ReactElement<any>>(this.props.children as React.ReactElement<any>[], (child, index) => (
          <option key={index} value={child.props.value} tabIndex={-1} aria-hidden="true">
            {child.props.text}
          </option>
        ))}
      </select>
    );
  }
}
