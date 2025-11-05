import * as React from "react";
import * as PropTypes from "prop-types";
import { RadioGroup as RadioGroupBase } from "../index";
import formsy from "./mixin";
import { LiveRegion } from "../live-region";

const classNames = require("classnames");

const passthrough = require("react-passthrough");

const css = require("./formsy.scss");

export interface RadioGroupProps {
  "aria-labelledby"?: string;
  [key: string]: any;
}

@passthrough({
  force: ["name", "value"],
  omit: ["isRequired", "styles", "validations", "validationErrors", "requiredError", "validationError"],
})
@formsy
export class RadioGroup extends React.Component<RadioGroupProps, {}> {
  private radioGroup: any = null;

  public static propTypes = {
    name: PropTypes.string.isRequired,
    groupClassName: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.object]),
    label: PropTypes.string,
    onChange: PropTypes.func,
  };

  public static defaultProps = { styles: css };

  public getValue(defaultValue: any) {
    const value = this.radioGroup ? this.radioGroup.getValue(defaultValue) : null;
    return value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  }

  /**
   * Solely here to make this work with Formsy.
   * Resets the value of the RadioGroup element.
   */
  public resetValue() {
    if (this.radioGroup) {
      this.radioGroup.resetValue();
    }
  }

  // run validation on blur
  public _onChange(event: any) {
    // validate is added by Formsy.Form
    this.context.validate(this);
    if (this.props.onChange) {
      this.props.onChange(event);
    }
  }

  private setRef = (ref) => {
    this.radioGroup = ref;
  };

  public render() {
    const { styles } = this.props;
    const that = this as any;
    // only add error class if radioGroup is not valid and user has modified the value or the form has been submitted.
    const hasError = !that.isValid() && (that.isFormSubmitted() || !that.isPristine());
    const groupClassName = classNames(styles["form-group"], that.props.groupClassName, {
      [styles["has-error"]]: hasError,
    });
    const errorMessage = hasError ? that.getErrorMessage() : null;

    return (
      <div className={groupClassName}>
        {that.props.label ? (
          <label className={styles["label"]} htmlFor={that.props.name}>
            {that.props.label}
          </label>
        ) : null}
        <RadioGroupBase {...that.passthrough()} ref={this.setRef} onChange={that._onChange.bind(that)}>
          {this.props.children}
        </RadioGroupBase>
        {errorMessage ? (
          <LiveRegion role="alert" className={styles["radio-group-err-msg"]}>
            {errorMessage}
          </LiveRegion>
        ) : null}
      </div>
    );
  }
}
