import * as PropTypes from "prop-types";

export interface RadioGroupContext {
  radioGroupContext: {
    name: string;
    groupValue: string | number | undefined;
    groupDisabled: boolean;
    onChange(value: string | number, event: React.ChangeEvent<HTMLInputElement>): void;
  };
}

export const radioGroupContextTypes = { radioGroupContext: PropTypes.any };
