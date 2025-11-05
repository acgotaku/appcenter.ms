import * as React from "react";
import { without, noop } from "lodash";
import {
  Dropdown,
  DefaultizedCommonDropdownProps,
  UngroupedDropdownPropsFragment,
  GroupedDropdownPropsFragment,
} from "../../dropdown/v2";
import { Option } from "./option";
import { Omit } from "@lib/common-interfaces";
import * as styles from "../select.scss";

export interface CommonSelectProps<T> extends Omit<DefaultizedCommonDropdownProps<T>, "onChange" | "defaultValue" | "trigger"> {
  renderTrigger: (value: T | T[] | undefined) => JSX.Element;
  onSelectOption: (option: T) => void;
  renderItem: (item: T) => JSX.Element;
}

type UngroupedSelectPropsFragment<T> = UngroupedDropdownPropsFragment<T>;

type GroupedSelectPropsFragment<T> = GroupedDropdownPropsFragment<T>;

type SingleSelectPropsFragment<T> = {
  renderTrigger: (selectedOption: T | undefined) => JSX.Element;
  multiple?: false;
  value?: T;
  defaultValue?: T;
};

type MultipleSelectPropsFragment<T> = {
  renderTrigger: (selectedOptions: T[]) => JSX.Element;
  multiple: true;
  value?: T[];
  defaultValue?: T[];
  onDeselectOption: (option: T) => void;
};

export interface SelectState<T> {
  value: T | T[] | undefined;
}

export type SelectProps<T> = CommonSelectProps<T> &
  (UngroupedSelectPropsFragment<T> | GroupedSelectPropsFragment<T>) &
  (SingleSelectPropsFragment<T> | MultipleSelectPropsFragment<T>);

/**
 * A dropdown with selectable options.
 * @example
 * <Select
 *   items={users}
 *   renderItem={(user) => <AvatarItem name={user.name} email={user.email} />}
 *   getValue={(user) => user.email}
 *   getText={(user) => `${user.name} (${user.email})`}
 *   renderTrigger={(selectedUser) => (
 *     <Trigger>
 *       <DropdownButton subtle label="User">
 *         {selectedUser ? selectedUser.name : ''}
 *       </DropdownButton>
 *     </Trigger>
 *   )}
 * />
 */
export class Select<T> extends React.Component<SelectProps<T>, SelectState<T>> {
  static defaultProps = {
    onSelectOption: noop,
    onDeselectOption: noop,
  };

  public state: SelectState<T> = {
    value: this.props.defaultValue || (this.props.multiple ? [] : undefined),
  };

  private get isControlled(): boolean {
    return this.props.hasOwnProperty("value");
  }

  private get value() {
    return this.isControlled ? this.props.value : this.state.value;
  }

  private isSelected(itemValue: T) {
    const currentValue = this.value;
    if (Array.isArray(currentValue)) {
      // The negative side of this ternary enables items with empty-string values
      // to serve as a catch-all, appearing selected when none is selected.
      // This seems quite magical and specific, but it was part of the old Select
      // and is actually a common design use case, so I’m keeping it. It should probably
      // have a more explicit API in the future. Counterpart is in `onSelectOption` below.
      return currentValue.length ? currentValue.includes(itemValue) : !this.props.getValue(itemValue);
    }
    return itemValue === currentValue;
  }

  private onSelectOption = (value: T) => {
    if (!this.isControlled) {
      if (this.props.multiple) {
        // See note in `isSelected` above. The `else` side of this condition
        // unchecks all the others, considering an empty-string value to be a catch-all.
        if (this.props.getValue(value)) {
          this.setState({ value: [...(this.state.value as T[]), value] });
        } else {
          this.setState({ value: [] });
        }
      } else {
        this.setState({ value });
      }
    }
    this.props.onSelectOption(value);
  };

  private onDeselectOption = (value: T, event: React.SyntheticEvent<HTMLElement>) => {
    if (this.props.multiple) {
      if (!this.isControlled) {
        this.setState({ value: without(this.state.value as T[], value) });
      }
      this.props.onDeselectOption(value);
    }
  };

  render() {
    const {
      renderTrigger,
      multiple,
      onSelectOption,
      onDeselectOption,
      defaultValue,
      getText,
      renderItem,
      isItemDisabled,
      ...passthrough
    } = { ...this.props, onDeselectOption: undefined };
    return (
      <Dropdown
        getText={getText}
        getInitialFocusedItem={multiple ? undefined : () => this.value as T | undefined}
        isItemDisabled={isItemDisabled}
        sticky={multiple}
        className={styles.select}
        {...passthrough}
        trigger={renderTrigger(this.value)}
        onMatchedItemWhileClosed={this.onSelectOption}
        renderItem={(item, itemProps) => (
          <Option
            selected={this.isSelected(item)}
            text={getText(item)}
            onSelectOption={() => this.onSelectOption(item)}
            multiple={this.props.multiple}
            onDeselectOption={(event) => this.onDeselectOption(item, event)}
            disabled={isItemDisabled && isItemDisabled(item)}
            {...itemProps}
          >
            {renderItem(item)}
          </Option>
        )}
      />
    );
  }
}
