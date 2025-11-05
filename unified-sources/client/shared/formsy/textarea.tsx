import * as React from "react";
import * as PropTypes from "prop-types";
import { uniqueId } from "lodash";
import { TextArea as TextAreaBase } from "../index";
import formsy from "./mixin";
import { LiveRegion } from "../live-region";
import { isEdge } from "../utils";

const classNames = require("classnames");
const passthrough = require("react-passthrough");

const css = require("./formsy.scss");

@passthrough({
  force: ["name"],
  omit: ["isRequired", "styles", "validations", "validationErrors", "requiredError", "validationError"],
})
@formsy
export class TextArea extends React.Component<any, {}> {
  private textarea: any = null;

  public static propTypes = {
    name: PropTypes.string.isRequired,
    groupClassName: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.object]),
    onBlur: PropTypes.func,
  };

  public getValue(defaultValue: any) {
    const value = this.textarea ? this.textarea.getValue(defaultValue) : null;
    return value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  }

  public static defaultProps = { styles: css };

  /**
   * Solely here to make this work with Formsy.
   * Resets the value of the textarea element.
   */
  public resetValue() {
    if (this.textarea) {
      this.textarea.resetValue();
    }
  }

  // run validation on blur
  public _onBlur(event: any) {
    // validate is added by Formsy.Form
    this.context.validate(this);
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  }

  public render() {
    const { styles, isRequired, name } = this.props;
    const that = this as any;
    // only add error class if textarea is not valid and user has modified the value or the form has been submitted.
    const hasError = !that.isValid() && (that.isFormSubmitted() || !that.isPristine());
    const groupClassName = classNames(styles["form-group"], that.props.groupClassName, {
      [styles["has-error"]]: hasError,
    });
    const errorMessage = hasError ? that.getErrorMessage() : null;
    const errorMessageId = uniqueId(`${name}-error-message-`);
    const textAreaProps = Object.assign(that.passthrough(), {
      label: that.props.label,
      "aria-required": isRequired,
      "aria-invalid": hasError || that.props["aria-invalid"],
      "aria-describedby": hasError ? errorMessageId : that.props["aria-describedby"] || null,
      ref: (ref) => (that.textarea = ref),
      onBlur: that._onBlur.bind(that),
    });

    // Edge + Narrator doesn't announce aria-describedby when label/aria-labelledby present
    // This adds error message to aria-labelledby to work around the issue
    if (isEdge && hasError) {
      textAreaProps.id = textAreaProps.id || `textarea-${uniqueId()}`;
      textAreaProps["aria-labelledby"] = `${TextAreaBase.genLabelId(textAreaProps.id)} ${errorMessageId}`;
      // Prevent Edge + NVDA to announce error the second time
      textAreaProps["aria-describedby"] = null;
    }

    return (
      <div className={groupClassName}>
        <TextAreaBase {...textAreaProps} />
        <LiveRegion id={errorMessageId} role="alert" active={Boolean(errorMessage)}>
          <div className={styles["error-message"]}>{errorMessage}</div>
        </LiveRegion>
      </div>
    );
  }
}
