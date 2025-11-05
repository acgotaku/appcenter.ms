import * as React from "react";
import * as PropTypes from "prop-types";
import { uniqueId } from "lodash";
import { Input as InputBase } from "../index";
import { LeadingTextInput } from "../index";
import { LiveRegion } from "../live-region";
import { isEdge } from "../utils";
import formsy from "./mixin";

const passthrough = require("react-passthrough");
const classNames = require("classnames");

const css = require("./formsy.scss");

@passthrough({
  force: ["name"],
  omit: ["isRequired", "styles", "validations", "validationErrors", "requiredError", "validationError"],
})
@formsy
export class Input extends React.Component<any, {}> {
  private input: any = null;

  public static propTypes = {
    name: PropTypes.string.isRequired,
    groupClassName: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.object]),
    label: PropTypes.string,
    leadingText: PropTypes.string,
    onBlur: PropTypes.func,
    // comes from Formsy.From
    validate: PropTypes.func,
  };

  public static defaultProps = { styles: css };

  public getValue(defaultValue: any) {
    const value = this.input ? this.input.getValue(defaultValue) : null;
    return value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  }

  /**
   * Resets the value of the input element
   */
  public resetValue() {
    if (this.input) {
      this.input.resetValue();
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

  private setRef = (ref) => {
    this.input = ref;
  };

  public render() {
    const { styles, leadingText, disabled, name, isRequired } = this.props;
    const that = this as any;
    // only add error class if input is not valid and user has modified the value or the form has been submitted.
    const hasError = !that.isValid() && (that.isFormSubmitted() || !that.isPristine());
    const groupClassName = classNames(styles["form-group"], that.props.groupClassName, {
      [styles["has-error"]]: hasError,
    });
    const errorMessage = hasError ? that.getErrorMessage() : null;
    const errorMessageId = uniqueId(`${name}-error-message-`);
    const inputProps = Object.assign(that.passthrough(), {
      label: that.props.label,
      required: isRequired,
      "aria-required": isRequired,
      "aria-invalid": hasError || that.props["aria-invalid"],
      "aria-describedby": hasError ? errorMessageId : that.props["aria-describedby"] || null,
      "aria-readonly": disabled,
      ref: this.setRef,
      onBlur: that._onBlur.bind(that),
    });
    const inputType: any = leadingText ? LeadingTextInput : InputBase;

    // Edge + Narrator doesn't announce aria-describedby when label/aria-labelledby present
    // This adds error message to aria-labelledby to work around the issue
    if (isEdge && hasError) {
      inputProps.id = inputProps.id || uniqueId("input-");
      inputProps["aria-labelledby"] = `${InputBase.genLabelId(inputProps.id)} ${errorMessageId}`;
      // Prevent Edge + NVDA to announce error the second time
      inputProps["aria-describedby"] = null;
    }

    return (
      <div className={groupClassName}>
        {React.createElement(inputType, leadingText ? Object.assign(inputProps, { leadingText: leadingText }) : inputProps, null)}
        <LiveRegion id={errorMessageId} role="alert" active={Boolean(errorMessage)}>
          <div data-test-id="input-error-message" className={styles["error-message"]}>
            {errorMessage}
          </div>
        </LiveRegion>
      </div>
    );
  }
}
