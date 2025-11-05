import * as React from "react";
import * as PropTypes from "prop-types";
import * as requiredIf from "react-required-if";
import { get, isEqual, omit, pickBy } from "lodash";
import * as Ajv from "ajv";
import * as AjvWithCustomErrors from "ajv-errors";
import { Input, InputProps } from "../input/input";
import { JSONSchema4 } from "json-schema";

type FormErrors<Values> = {
  [field in keyof Values]: {
    message: string;
    visible: boolean;
  };
};

type FieldProps<Values> = {
  handleSubmit: React.FormEventHandler<HTMLFormElement>;
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  handleBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  isSubmitting: boolean;
  values: Values;
  errors: Partial<FormErrors<Values>>;
};

interface FormProps<Values> {
  initialValues: Values;
  validationSchema?: JSONSchema4 & {
    type: "object";
    properties: {
      [field in keyof Values]?: JSONSchema4;
    };
    errorMessage: {
      properties: {
        [field in keyof Values]?: string;
      };
    };
  };
  errors: FormErrors<Values>;
  onSubmit?: (
    values: Values,
    actions: {
      setSubmitting: (isSubmitting: boolean) => void;
    }
  ) => void;
  children?: (props: FieldProps<Values>) => React.ReactNode;
  render?: (props: FieldProps<Values>) => React.ReactNode;
}

interface FormState<Values> {
  values: Values;
  errors: FormErrors<Values>;
}

class Form<Values> extends React.Component<FormProps<Values>, FormState<Values>> {
  public static propTypes: React.ValidationMap<FormProps<object>> = {
    initialValues: PropTypes.object.isRequired,
    children: requiredIf(PropTypes.func, (props) => !props.render),
    render: requiredIf(PropTypes.func, (props) => !props.children),
  };

  public static defaultProps: { validationSchema: object } = {
    validationSchema: {},
  };

  // `{ allErrors: true, jsonPointers: true }` is required for ajv-errors
  // https://github.com/epoberezkin/ajv-errors#usage
  private validator = AjvWithCustomErrors(new Ajv({ allErrors: true, jsonPointers: true }));
  private isSubmitting: boolean = false;

  public state: FormState<Values> = {
    values: this.props.initialValues,
    errors: this.props.errors,
  };

  public UNSAFE_componentWillReceiveProps(nextProps: FormProps<Values>) {
    // If a server-side error is passed to Form, display it.
    if (!isEqual(this.props.errors, nextProps.errors)) {
      this.setState({ errors: nextProps.errors });
    }
  }

  // Pick errors with `{ visible: true }`
  get visibleErrors(): Partial<FormErrors<Values>> {
    return pickBy(this.state.errors, (error) => error.visible);
  }

  public getValidationSchema = (field?: Extract<keyof Values, string>) => {
    // If no field is specified, return entire validation schema.
    if (!field) {
      return this.props.validationSchema;
    }

    // If specified field does not have associated validation, return empty schema.
    if (!get(this.props, `validationSchema.properties['${field}']`)) {
      return {};
    }

    if (this.props.validationSchema) {
      // Return validation schema associated with specified field.
      return {
        type: this.props.validationSchema.type,
        properties: {
          [field]: this.props.validationSchema.properties[field],
        },
        // According to the JSON Schema specification (v4),
        // `required` can be a boolean or an array
        required:
          this.props.validationSchema.required instanceof Array && this.props.validationSchema.required.includes(field) ? [field] : [],
      };
    }
  };

  public setSubmitting = (isSubmitting: boolean) => {
    this.isSubmitting = !!isSubmitting;
  };

  public handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Prevent full page refresh on form submit.
    e.preventDefault();

    // If one of the submitted fields contains an error,
    // - block form submission
    // - show the error
    if (!this.validator.validate(this.getValidationSchema(), this.state.values)) {
      const errors = this.validator.errors.reduce((errors, error) => {
        // ajv itself uses `.fieldName`
        // ajv-errors modifies the format to `/fieldName`
        const field = error.dataPath.replace(".", "").replace("/", "");
        const message = error.dataPath.includes(".") ? `${field} ${error.message}` : error.message;
        errors[field] = { message, visible: true };
        return errors;
      }, {});
      this.setState({ errors });
      return false;
    }

    // If the submitted fields did not not contain an error,
    // - submit the form
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.values, { setSubmitting: this.setSubmitting });
    }
  };

  public handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> & { target: { name: Extract<keyof Values, string> } }
  ) => {
    const field: Extract<keyof Values, string> = e.target.name;
    const value: any = e.target.value;

    // Update field value
    this.setState({
      values: Object.assign({}, this.state.values, { [field]: value }),
    });

    // If the changed field contained an error, and the change
    // resolves the error, remove the error message.
    if (this.visibleErrors.hasOwnProperty(field) && this.validator.validate(this.getValidationSchema(field), { [field]: value })) {
      const errors: FormErrors<Values> = omit(this.state.errors, field);
      this.setState({ errors });
    }
  };

  // This is a stub. It facilitates future validation strategies.
  //
  // Currently, `Form`s are validated on submit, and `Form` fields with errors are validated on change.
  // In other words, on blur events are currently unused.
  //
  // `handleBlur` is available to `Form` fields returned by `Form`’s `render` prop.
  // Please set the `onBlur` prop of `Form` fields to `handleBlur`.
  public handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    return;
  };

  public render() {
    const { render = this.props.children } = this.props;
    return render!({
      handleSubmit: this.handleSubmit,
      handleChange: this.handleChange,
      handleBlur: this.handleBlur,
      isSubmitting: this.isSubmitting,
      values: this.state.values,
      errors: this.visibleErrors,
    });
  }
}

export function createForm<Values>() {
  type TypedForm = new (props: FormProps<Values>) => Form<Values>;
  return Form as TypedForm;
}

export function createInput<Name extends string>() {
  interface FormInputProps extends InputProps {
    name: Name;
    onChange: InputProps["onChange"];
    onBlur: InputProps["onBlur"];
    value: InputProps["value"];
  }
  type TypedInput = new (props: FormInputProps) => Input<FormInputProps>;
  return Input as TypedInput;
}

export function createFormComponents<Values>() {
  return { Form: createForm<Values>(), Input: createInput<Extract<keyof Values, string>>() };
}
