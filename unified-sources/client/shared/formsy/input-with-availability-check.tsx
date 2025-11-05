import * as React from "react";
import * as PropTypes from "prop-types";
import { Input } from "../index";
import { Icon, IconName } from "../icon/icon";
import { LiveRegion } from "../live-region";
import { IconSize } from "../common-interfaces";
import { Color } from "../utils/color";
import formsy from "./mixin";
import { debounce } from "lodash";

const className = require("classnames");
const passthrough = require("react-passthrough");
const css = require("./formsy.scss");

@passthrough({
  force: ["name"],
  omit: [
    "isRequired",
    "styles",
    "validations",
    "validationErrors",
    "requiredError",
    "validationError",
    "availabilityMessageName",
    "availabilityCheckDebounce",
    "onCheckAvailability",
    "available",
    "checkDefaultValue",
  ],
})
@formsy
export class InputWithAvailabilityCheck extends React.Component<any, {}> {
  private input: any = null;
  private debouncedCheck: any;

  public static propTypes = {
    name: PropTypes.string.isRequired,
    groupClassName: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.object]),
    label: PropTypes.string,
    availabilityMessageName: PropTypes.string,
    onCheckAvailability: PropTypes.func,
    available: PropTypes.bool,
    availabilityCheckDebounce: PropTypes.number,
    checkDefaultValue: PropTypes.bool,
  };

  public static defaultProps = { styles: css };

  constructor(props: any) {
    super(props);
    const self = this;
    const debounceDelay: number = props.availabilityCheckDebounce || 400;
    this.debouncedCheck = debounce((username, callback) => {
      self.props.onCheckAvailability(username);
    }, debounceDelay);
  }

  public UNSAFE_componentWillMount() {
    // add a validation rule and error message for the availibility result
    if (this.props.validations) {
      this.props.validations["checkAvailabilityResult"] = this._checkAvailabilityResult;
    }
    if (this.props.validationErrors) {
      this.props.validationErrors["checkAvailabilityResult"] = this.props.availabilityMessageName
        ? `${this.props.availabilityMessageName} is taken`
        : "Value is taken";
    }
  }

  public UNSAFE_componentWillReceiveProps(nextProps: any) {
    if (nextProps.available !== this.props.available) {
      this.context.validate(this);
    }
  }

  public getValue = (defaultValue: any) => {
    const value = this.input ? this.input.getValue(defaultValue) : null;
    return value || (typeof defaultValue !== "undefined" ? defaultValue : "");
  };

  /**
   * Resets the value of the input element
   */
  public resetValue = () => {
    if (this.input) {
      this.input.resetValue();
    }
  };

  // run validation on change
  public _onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { onChange } = this.props;
    // validate is added by Formsy.Form
    this.context.validate(this);
    const that = this as any;
    if (!that.isPristine()) {
      // only do the external availability check if the current value isn't the original value
      if (this.props.onCheckAvailability && this.input.getValue() !== "" && this.props.defaultValue !== this.input.getValue()) {
        this.debouncedCheck(event.currentTarget.value);
      }
    }

    if (onChange && typeof onChange === "function") {
      onChange(event);
    }
  };

  /**
   * Used by the availability validation rule to determine whether the current
   * value is available
   */
  public _checkAvailabilityResult = (values: any, value: any) => {
    return this.props.defaultValue === this.input.getValue() || this.props.available;
  };

  private setRef = (ref) => {
    this.input = ref;
  };

  public render() {
    const { name, styles } = this.props;
    const that = this as any;
    // only add error class if input is not valid and user has modified the value or the form has been submitted.
    const hasError = !that.isValid() && (that.isFormSubmitted() || !that.isPristine());
    const groupClassName = className(styles["form-group"], that.props.groupClassName, {
      [styles["has-error"]]: hasError,
    });
    const errorMessage = hasError ? that.getErrorMessage() : null;
    const messageId = `${name}-message`;
    const checkableValue = that.props.checkDefaultValue || (that.props.defaultValue || "") !== that.getValue();
    const showAvailable = checkableValue && that.props.available;
    const availabilityMessage = that.props.availabilityMessageName
      ? `${that.props.availabilityMessageName} available`
      : "Value available";
    const passthrough = {
      "aria-invalid": hasError,
      "aria-required": that.props.isRequired,
      "aria-describedby": hasError ? messageId : null,
      ...that.passthrough(),
    };

    return (
      <div className={groupClassName}>
        {that.props.label ? (
          <label className={className(styles.label, that.props.isRequired ? styles.required : undefined)} htmlFor={that.props.name}>
            {that.props.label}
          </label>
        ) : null}
        <Input {...passthrough} ref={this.setRef} onChange={that._onChange} />
        <LiveRegion id={messageId} role="alert" active={Boolean(errorMessage || showAvailable)}>
          {errorMessage ? (
            <div data-test-id="input-error-message" className={styles["error-message"]}>
              {errorMessage}
            </div>
          ) : showAvailable ? (
            <div data-test-id="input-availability-success-message" className={styles["success-message"]}>
              {availabilityMessage}
              <Icon
                data-test-id="input-availability-success-icon"
                icon={IconName.Check}
                size={IconSize.XSmall}
                color={Color.Green}
                aria-hidden
                tabIndex={-1}
              />
            </div>
          ) : null}
        </LiveRegion>
      </div>
    );
  }
}
