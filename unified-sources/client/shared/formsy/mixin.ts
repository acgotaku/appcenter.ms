import * as PropTypes from "prop-types";
const reactMixin = require("react-mixin");

export const convertValidationsToObject = (validations: any) => {
  if (typeof validations === "string") {
    return validations.split(/,(?![^{\[]*[}\]])/g).reduce((_validations: any, validation: any) => {
      let args = validation.split(":");
      const validateMethod = args.shift();

      args = args.map((arg: any) => {
        try {
          return JSON.parse(arg);
        } catch (e) {
          return arg; // It is a string if it can not parse it
        }
      });

      if (args.length > 1) {
        throw new Error("Formsy does not support multiple args on string validations. Use object format of validations instead.");
      }

      _validations[validateMethod] = args.length ? args[0] : true;
      return _validations;
    }, {});
  }
  return validations || {};
};

const mixin: any = {
  getInitialState() {
    return {
      _showRequired: false,
      _isValid: true,
      _isPristine: true,
      _defaultValue: this.props.defaultValue || "",
      _validationError: "",
      _externalError: null as any,
      _formSubmitted: false,
    };
  },
  getDefaultProps() {
    return {
      validationError: "",
      validationErrors: {},
    };
  },

  componentWillMount() {
    if (!this.props.name) {
      throw new Error("Form Input requires a name property when used");
    }

    if (!this.context._attachToForm) {
      throw new Error("Form Mixin requires component to be nested in a Form");
    }

    this.setValidations(this.props.validations, this.props.isRequired);
    this.context._attachToForm(this);
  },

  // We have to make the validate method is kept when new props are added
  componentWillReceiveProps(nextProps: any) {
    this.setValidations(nextProps.validations, nextProps.isRequired);
  },

  // Detach it when component unmounts
  componentWillUnmount() {
    this.context._detachFromForm(this);
  },

  setValidations(validations: any, isRequired: any) {
    // Add validations to the store itself as the props object can not be modified
    this._validations = convertValidationsToObject(validations) || {};
    this._requiredValidations = isRequired === true ? { isDefaultRequiredValue: true } : convertValidationsToObject(isRequired);
  },

  hasValue() {
    return this.getValue() !== "";
  },
  getErrorMessage() {
    return !this.isValid() || this.showRequired() ? this.state._externalError || this.state._validationError : null;
  },
  isFormDisabled() {
    return this.context._isFormDisabled();
  },
  isValid() {
    return this.state._isValid;
  },
  isPristine() {
    return this.state._isPristine;
  },
  isFormSubmitted() {
    return this.state._formSubmitted;
  },
  isRequired() {
    return !!this.props.isRequired;
  },
  showRequired() {
    return this.state._showRequired;
  },
  showError() {
    return !this.showRequired() && !this.isValid();
  },
  isValidValue(value: any) {
    return this.context._isValidValue.call(null, this, value);
  },
};

export default (Class: React.ComponentClass<any>) => {
  Class.contextTypes = {
    ...Class.contextTypes,
    validate: PropTypes.func,
    _attachToForm: PropTypes.func,
    _detachFromForm: PropTypes.func,
    _isFormDisabled: PropTypes.func,
    _isValidValue: PropTypes.func,
  };

  return reactMixin.decorate(mixin)(Class);
};
