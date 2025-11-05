import * as React from "react";
import * as PropTypes from "prop-types";
import { noop } from "lodash";
import validationRules from "./validation-rules";
import utils from "./utils";

export interface FormProps {
  onSuccess?: Function;
  onError?: Function;
  onSubmit?: Function;
  onValidSubmit?: (
    model: { [key: string]: any },
    resetModel: () => void,
    updateInputsWithError: (errors: object) => void,
    submit: () => void
  ) => void;
  onInvalidSubmit?: Function;
  onSubmitted?: Function;
  onValid?: Function;
  onInvalid?: Function;
  onChange?: Function;
  disabled?: Boolean;
  method?: string;
  validationErrors?: any;
  className?: string;
  style?: React.CSSProperties;
  mapping?: Function;
  children?: React.ReactNode;
  id?: string;
}

export class Form extends React.Component<FormProps, {}> {
  public static childContextTypes = {
    validate: PropTypes.func,
    _attachToForm: PropTypes.func,
    _detachFromForm: PropTypes.func,
    _isFormDisabled: PropTypes.func,
    _isValidValue: PropTypes.func,
  };

  public static defaultProps = {
    onSuccess: noop,
    onError: noop,
    onSubmit: noop,
    onValidSubmit: noop,
    onInvalidSubmit: noop,
    onSubmitted: noop,
    onValid: noop,
    onInvalid: noop,
    onChange: noop,
    disabled: false,
    method: "get",
    validationErrors: null as any,
  };

  public getChildContext() {
    return {
      validate: this.validateComponent,
      _attachToForm: this.attachToForm,
      _detachFromForm: this.detachFromForm,
      _isFormDisabled: this.isFormDisabled,
      _isValidValue: (component: any, value: any) => this.runValidation(component, value).isValid,
    };
  }

  private form: HTMLFormElement | null = null;
  // Add a map to store the inputs of the form, a model to store
  // the values of the form and register child inputs
  private inputs = {};
  private model = {};
  private prevInputKeys = {};
  private internalState = {
    isValid: true,
    isSubmitting: false,
    canChange: false,
    formSubmitted: false,
  };

  public componentDidMount() {
    this.validate();
  }

  public UNSAFE_componentWillUpdate() {
    // Keep a reference to input keys before form updates,
    // to check if inputs has changed after render
    this.prevInputKeys = Object.keys(this.inputs);
  }

  public componentDidUpdate() {
    if (this.props.validationErrors) {
      this.setInputValidationErrors(this.props.validationErrors);
    }

    const newInputKeys = Object.keys(this.inputs);
    if (utils.arraysDiffer(this.prevInputKeys, newInputKeys)) {
      this.validate();
    }
  }

  // Method put on each input component to register
  // itself to the form
  private attachToForm = (component: any) => {
    (this.inputs as any)[component.props.name] = component;
    (this.model as any)[component.props.name] = component.getValue();
  };

  // Method put on each input component to unregister
  // itself from the form
  private detachFromForm = (component: any) => {
    delete (this.inputs as any)[component.props.name];
    delete (this.model as any)[component.props.name];
  };

  public getCurrentValues() {
    return Object.keys(this.inputs).reduce((data, name) => {
      const component = (this.inputs as any)[name];
      (data as any)[name] = component.getValue(); // eslint-disable-line no-param-reassign
      return data;
    }, {});
  }

  private isFormDisabled = () => {
    return this.props.disabled;
  };

  private mapModel() {
    return this.props.mapping ? this.props.mapping(this.model) : this.model;
  }

  public reset() {
    this.setFormPristine(true);
    this.resetModel();
  }

  // Reset each key in the model to the original / initial value
  private resetModel() {
    Object.keys(this.inputs).forEach((name) => {
      // resetValue function may or may not exist depending on if component implemented it
      if ((this.inputs as any)[name].resetValue) {
        (this.inputs as any)[name].resetValue();
      }
    });
    this.validate();
  }

  private runRules(value: any, currentValues: any, validations: any) {
    const results = {
      errors: [] as any[],
      failed: [] as any[],
      success: [] as any[],
    };
    if (Object.keys(validations).length) {
      Object.keys(validations).forEach((validationMethod) => {
        if ((validationRules as any)[validationMethod] && typeof validations[validationMethod] === "function") {
          throw new Error("Formsy does not allow you to override default validations: " + validationMethod);
        }

        if (!(validationRules as any)[validationMethod] && typeof validations[validationMethod] !== "function") {
          throw new Error("Formsy does not have the validation rule: " + validationMethod);
        }

        let validation: any;
        if (typeof validations[validationMethod] === "function") {
          validation = validations[validationMethod](currentValues, value);
          if (typeof validation === "string") {
            results.errors.push(validation);
            results.failed.push(validationMethod);
          } else if (!validation) {
            results.failed.push(validationMethod);
          }
          return;
        } else if (typeof validations[validationMethod] !== "function") {
          validation = (validationRules as any)[validationMethod](currentValues, value, validations[validationMethod]);
          if (typeof validation === "string") {
            results.errors.push(validation);
            results.failed.push(validationMethod);
          } else if (!validation) {
            results.failed.push(validationMethod);
          } else {
            results.success.push(validationMethod);
          }
          return;
        }

        return results.success.push(validationMethod);
      });
    }

    return results;
  }

  // Checks validation on current value or a passed value
  private runValidation(component: any, value?: any) {
    const currentValues = this.getCurrentValues();
    const validationErrors = component.props.validationErrors;
    const validationError = component.props.validationError;
    const value2 = arguments.length === 2 ? value : component.getValue();

    const validationResults = this.runRules(value2, currentValues, component._validations);
    const requiredResults = this.runRules(value2, currentValues, component._requiredValidations);

    // the component defines an explicit validate function
    if (typeof component.validate === "function") {
      validationResults.failed = component.validate() ? [] : ["failed"];
    }

    const isRequired = Object.keys(component._requiredValidations).length ? !!requiredResults.success.length : false;
    const isValid =
      !validationResults.failed.length && !(this.props.validationErrors && this.props.validationErrors[component.props.name]);

    return {
      isRequired: isRequired,
      isValid: isRequired ? false : isValid,
      isPristine: !component.state._isPristine ? false : value2 === component.state._defaultValue,
      error: (() => {
        if (isValid && !isRequired) {
          return "";
        }

        if (validationResults.errors.length) {
          return validationResults.errors[0];
        }

        if (this.props.validationErrors && this.props.validationErrors[component.props.name]) {
          return this.props.validationErrors[component.props.name];
        }

        if (isRequired) {
          return validationErrors[requiredResults.failed[0]] || component.props.requiredError || validationError;
        }

        if (!isValid) {
          return validationErrors[validationResults.failed[0]] || validationError;
        }
      }).call(this),
    };
  }

  private setFormPristine(isPristine: Boolean) {
    const inputs = this.inputs;
    const inputKeys = Object.keys(inputs);

    this.internalState.formSubmitted = !isPristine;

    // Iterate through each component and set it as pristine
    // or "dirty".
    inputKeys.forEach((name) => {
      const component = (inputs as any)[name];
      component.setState({
        _isPristine: isPristine,
        _formSubmitted: !isPristine,
      });
    });
  }

  private setInputValidationErrors(errors: any) {
    Object.keys(this.inputs).forEach((name) => {
      const component = (this.inputs as any)[name];
      const args = [
        {
          _isValid: !(name in errors),
          _validationError: errors[name],
          _isPristine: false,
        },
      ];
      component.setState.apply(component, args);
    });
  }

  // Update model, submit to url prop and send the model
  private submit = (event: any) => {
    if (event) {
      event.preventDefault();
    }

    this.validate();
    this.setFormPristine(false);
    this.updateModel();
    const model = this.mapModel();
    this.props.onSubmit!(model, this.resetModel, this.updateInputsWithError);
    if (this.internalState.isValid) {
      this.props.onValidSubmit!(model, this.resetModel, this.updateInputsWithError, () => this.form && this.form.submit());
    } else {
      this.focusFirstInputWithError();
      this.props.onInvalidSubmit!(model, this.resetModel, this.updateInputsWithError);
    }
  };

  private focusFirstInputWithError() {
    const firstInputName =
      Object.keys(this.inputs)
        .filter((name) => {
          const component = this.inputs[name];
          const { _isValid } = component.state;
          return !_isValid;
        })
        .shift() || "";
    const component = this.inputs[firstInputName];
    if (component?.input?.focus) {
      component.input.focus();
    }
  }

  // Go through errors from server and grab the components
  // stored in the inputs map. Change their state to invalid
  // and set the serverError message
  private updateInputsWithError(errors: Object) {
    Object.keys(errors).forEach((name) => {
      const component = (this.inputs as any)[name];

      if (!component) {
        throw new Error(
          "You are trying to update an input that does not exists. Verify errors object with input names. " + JSON.stringify(errors)
        );
      }

      const args = [
        {
          _isValid: false,
          _externalError: (errors as any)[name],
        },
      ];
      component.setState.apply(component, args);
    });
  }

  // Goes through all registered components and
  // updates the model values
  private updateModel() {
    Object.keys(this.inputs).forEach((name) => {
      const component = (this.inputs as any)[name];
      (this.model as any)[name] = component.getValue();
    });
  }

  // Validate the form by going through all child input components
  // and check their state
  private validate = () => {
    let allIsValid = true;
    const inputs = this.inputs;
    const inputKeys = Object.keys(inputs);

    // Run validation again in case affected by other inputs. The
    // last component validated will run the onValidationComplete callback
    inputKeys.forEach((name) => {
      const component = (inputs as any)[name];
      const validation = this.runValidation(component);
      if (validation.isValid && component.state._externalError) {
        validation.isValid = false;
      }
      if (!validation.isValid) {
        allIsValid = false;
      }
      component.setState({
        _isValid: validation.isValid,
        _showRequired: validation.isRequired,
        _isPristine: validation.isPristine,
        _validationError: validation.error,
        _externalError: !validation.isValid && component.state._externalError ? component.state._externalError : null,
      });
    });

    this.internalState.isValid = allIsValid;

    if (allIsValid) {
      this.props.onValid!();
    } else {
      this.props.onInvalid!();
    }

    // Tell the form that it can start to trigger change events
    this.internalState.canChange = true;
  };

  // Use the binded values and the actual input value to
  // validate the input and set its state. Then check the
  // state of the form itself
  private validateComponent = (component: any) => {
    // Trigger onChange
    if (this.internalState.canChange) {
      this.props.onChange!(this.getCurrentValues());
    }

    const validation = this.runValidation(component);
    // Run through the validations, split them up and call
    // the validator IF there is a value or it is required
    component.setState(
      {
        _isValid: validation.isValid,
        _showRequired: validation.isRequired,
        _isPristine: validation.isPristine,
        _validationError: validation.error,
        _externalError: null,
      },
      this.validate
    );
  };

  public render() {
    const {
      onSuccess,
      onError,
      onSubmit,
      onValidSubmit,
      onInvalidSubmit,
      onSubmitted,
      onValid,
      onInvalid,
      onChange,
      disabled,
      validationErrors,
      mapping,
      children,
      ...passthrough
    } = this.props;

    return React.createElement<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>(
      "form",
      {
        ref: (x) => (this.form = x),
        ...passthrough,
        onSubmit: this.submit,
      },
      children
    );
  }
}
