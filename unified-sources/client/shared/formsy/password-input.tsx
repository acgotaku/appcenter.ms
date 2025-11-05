import * as React from "react";
import { Input as InputBase, InputProps } from "../index";
import { PasswordValidator } from "./password-validator";
import { Icon, IconName, IconArea } from "../icon/icon";
import { IconSize } from "../common-interfaces";
import { Color } from "../utils/color";
import { t } from "@root/lib/i18n";
import formsy, { convertValidationsToObject } from "./mixin";

const classNames = require("classnames");
const css = require("./formsy.scss");

export interface PasswordInputProps extends InputProps {
  name?: string;
  groupClassName?: string;
  label?: string;
  isRequired?: boolean;
  styles?: any;
  requiredError?: string;
  validationError?: string;
  validations?: any;
  validationErrors?: any;
  oldPasswordFieldName?: string;
}

@formsy
export class PasswordInput extends React.Component<PasswordInputProps, {}> {
  private input: InputBase | null = null;
  public static validator: PasswordValidator = new PasswordValidator();

  public static defaultProps = {
    styles: css,
  };

  public UNSAFE_componentWillMount() {
    this.updateValidations(this.props);
  }

  public UNSAFE_componentWillReceiveProps(props: PasswordInputProps) {
    this.updateValidations(props, this.props);
  }

  public createValidations(props: PasswordInputProps) {
    const validations = {
      isStrongPassword: (values, value) => {
        return PasswordInput.validator.validate(value);
      },
    };

    if (props.oldPasswordFieldName) {
      validations["isNotEqualOldPassword"] = (values, value) => {
        const oldPassword = values[props.oldPasswordFieldName!];
        return !oldPassword || oldPassword !== value ? true : t("common:input.password.passwordsShouldNotMatchError");
      };
    }

    return validations;
  }

  public updateValidations(props: PasswordInputProps, prevProps?: PasswordInputProps) {
    const parentValidations = convertValidationsToObject(props.validations);
    const validations: any = {
      ...this.createValidations(props),
      ...parentValidations,
    };

    // Comes from the mixin
    (this as any).setValidations(validations, props.isRequired);
  }

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

  public _onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { onChange } = this.props;
    // TODO Need to analyze the password input as typed
    this.context.validate(this);
    if (onChange) {
      onChange(event);
    }
  };

  public render() {
    const {
      name,
      groupClassName,
      label,
      isRequired,
      requiredError,
      validations,
      validationErrors,
      validationError,
      oldPasswordFieldName,
      styles,
      ...passthrough
    } = this.props;
    const that = this as any;

    // only add error class if input is not valid and user has modified the value or the form has been submitted.
    const hasError = !that.isValid() && (that.isFormSubmitted() || !that.isPristine());
    const showSuccess = that.hasValue() && !that.isPristine() && !hasError;
    const validationMessage = that.getErrorMessage() || t("common:input.password.strengthMessage");

    const groupCN = classNames(styles["form-group"], groupClassName, {
      [styles["has-error"]]: hasError,
    });
    const messageStyle = showSuccess ? "password-success-message" : hasError ? "password-error-message" : "password-message";

    return (
      <div className={groupCN}>
        {label ? (
          <label className={styles["label"]} htmlFor={name}>
            {label}
          </label>
        ) : null}
        <InputBase
          {...passthrough}
          name={this.props.name}
          type="password"
          ref={(ref) => (this.input = ref)}
          onChange={this._onChange}
          aria-readonly={this.props.disabled}
          aria-describedby="validation-message"
        />
        <div
          data-test-id="input-validation-message"
          data-test-state={showSuccess ? "success" : hasError ? "error" : "none"}
          id="validation-message"
          className={styles[messageStyle]}
        >
          {validationMessage}
          {showSuccess ? <Icon icon={IconName.Check} size={IconSize.XSmall} area={IconArea.Normal} color={Color.Green} /> : null}
        </div>
      </div>
    );
  }
}
