import * as React from "react";
import { uniqueId } from "lodash";
const classNames = require("classnames");
const css = require("./textarea.scss");

/**
 * Format of an ARIA attribute
 * @interface AriaAttribute
 */
interface AriaAttribute {
  [key: string]: string;
}

/**
 * Props passed to a TextArea component
 */
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  placeholder?: string;
  description?: string;
  resizable?: boolean;
  styles?: any;
}

/**
 * Base TextArea component
 */
export class TextArea extends React.Component<TextAreaProps, {}> {
  /**
   * Unique identifier
   * @type {string}
   */
  public id = uniqueId();
  public textarea: HTMLTextAreaElement | null = null;

  public static defaultProps = { styles: css };

  /**
   * Generates identifier for an TextArea associated label
   * @returns {string}
   */
  public static genLabelId(id: string) {
    return `label-${id}`;
  }

  /**
   * Generates identifier for an TextArea associated description
   * @returns {string}
   */
  public static genDescriptionId(id: string) {
    return `desc-${id}`;
  }

  /**
   * Gets unique identifier for an TextArea associated label
   * @returns {string}
   */
  public getLabelId(): string {
    const { id = this.id } = this.props;
    return TextArea.genLabelId(id);
  }

  /**
   * Gets unique identifier for an TextArea associated description
   * @returns {string}
   */
  public getDescriptionId(): string {
    const { id = this.id } = this.props;
    return TextArea.genDescriptionId(id);
  }

  /**
   * Gets ARIA attribute for an Input’s accessible name
   * @returns {AriaAttribute}
   */
  public getAriaAttribute(): AriaAttribute | undefined {
    const { label, placeholder, description } = this.props;
    const attribute = {};
    switch (true) {
      case !!description:
        attribute["aria-describedby"] = this.props["aria-describedby"] || this.getDescriptionId();
      case !!label:
        attribute["aria-labelledby"] = this.props["aria-labelledby"] || this.getLabelId();
        return attribute;
      case !!placeholder:
        attribute["aria-label"] = this.props["aria-label"] || (this.props["aria-labelledby"] ? null : placeholder); // placeholder as a last resort
        return attribute;
      default:
        return undefined;
    }
  }

  /**
   * This is here solely to make it work with Formsy.
   * Returns the current value of the actual HTML textarea in the DOM.
   * @returns {string}
   */
  public getValue(defaultValue: string) {
    const value = this.textarea ? this.textarea.value : undefined;
    return value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  }

  /**
   * Solely here to make this work with Formsy.
   * Resets the value of the textarea element.
   */
  public resetValue() {
    if (this.textarea) {
      this.textarea.value = "";
    }
  }

  /**
   * Renders a TextArea component
   * @returns {JSX.Element} TextArea component
   */
  public render() {
    /**
     * Props not specifically handled by TextArea
     * These should be passed through to the HTML textarea element
     * @constant {*}
     */
    const { label, id = this.id, resizable = false, description, styles, children, ...passthrough } = this.props;

    /**
     * CSS class name(s) applied to the HTML button element
     * @constant {string}
     */
    const className: string = classNames(this.props.className, styles.textarea, { [styles.resizable]: resizable });

    return (
      <div>
        {label ? (
          <label id={this.getLabelId()} htmlFor={id} className={styles.label}>
            {label}
          </label>
        ) : null}
        <textarea {...this.getAriaAttribute()} id={id} {...passthrough} ref={(ref) => (this.textarea = ref)} className={className} />
        {description ? (
          <div id={this.getDescriptionId()} className={styles.description}>
            {description}
          </div>
        ) : null}
      </div>
    );
  }
}
