import * as React from "react";
import * as PropTypes from "prop-types";
import { Select, SelectProps } from "../select/select";
import { ButtonSize } from "../button/button";
import { Omit } from "@lib/common-interfaces";

const classNames = require("classnames");
const css = require("./filter-label.scss");

export interface FilterLabelProps extends Omit<SelectProps, "aria-labelledby"> {
  label: string;
  styles?: any;
  [key: string]: any;
}

/**
 * @deprecated
 * Use Select with a trigger of `<DropdownButton subtle label={label}>{selectedOption.text}</DropdownButton>` instead.
 */
export class FilterLabel extends React.Component<FilterLabelProps, {}> {
  public static propTypes: React.ValidationMap<FilterLabelProps> = {
    label: PropTypes.string.isRequired,
  };
  public static defaultProps = { styles: css };

  public render() {
    const {
      label,
      styles,
      onClose,
      onChange,
      onSearch,
      multiple,
      placeholder,
      value,
      defaultValue,
      triggerClassName,
      spinning,
      compact,
      searchable,
      minListWidth,
      ...passthrough
    } = this.props;
    const className = classNames(this.props["className"], styles["filter-label"]);
    const selectProps: SelectProps = {
      onClose,
      onChange,
      onSearch,
      multiple,
      placeholder,
      value,
      defaultValue,
      triggerClassName,
      spinning,
      compact,
      searchable,
      minListWidth,
    };
    return (
      <div {...passthrough} className={className} role="presentation">
        <div className={styles.label}>{label}</div>
        <Select
          aria-label={label}
          {...selectProps}
          className={styles.select}
          triggerClassName={styles.trigger}
          size={ButtonSize.XSmall}
          minListWidth={200}
          data-test-id="crash-groups-version"
        >
          {this.props.children}
        </Select>
      </div>
    );
  }
}
