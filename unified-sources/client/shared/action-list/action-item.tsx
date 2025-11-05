import * as React from "react";
import * as classNames from "classnames";
import { Grid, Row, Col } from "../grid/index";
import { RowProps } from "../grid/row";
import { Icon, IconName, IconSize } from "../icon";
import { Checkbox } from "../checkbox";
import { omit, noop } from "lodash";
import { useFocus } from "../hooks";
const css = require("./action-item.scss");

export interface CommonActionItemInterface<T extends HTMLElement = HTMLElement> extends RowProps<T>, React.HTMLAttributes<T> {
  disabled?: boolean;
}

const childrenValidator: React.Validator<any> = (props, propName, componentName) => {
  let error: Error | null = null;

  React.Children.toArray(props[propName]).forEach((child: React.ReactChild) => {
    if (typeof child === "object" && child.type !== Col) {
      error = new Error(`${componentName} children should be of type Col.`);
    }
  });

  return error;
};

export interface SingleSelectActionItemProps extends CommonActionItemInterface {
  name?: string;
  checked?: boolean;
  onChange?(event: React.ChangeEvent<HTMLInputElement>): void;
  value?: string | string[];
}

export const SingleSelectActionItem: React.FunctionComponent<SingleSelectActionItemProps> = (props) => {
  const { checked, children, className, disabled, name, onChange, styles, value } = props;
  const [isFocused, focusProps] = useFocus();
  const singleSelectActionItemStyles = classNames(
    className,
    checked && styles["single-select-checked"],
    disabled && styles["single-select-disabled"],
    styles["single-select"],
    { [styles.focus]: isFocused }
  );
  const passthrough = omit(props, "checked", "children", "className", "disabled", "name", "onChange", "styles", "value");
  return (
    <Row data-test-class="action-item" {...passthrough} tagName="label" className={singleSelectActionItemStyles}>
      <input
        checked={checked}
        aria-checked={checked}
        disabled={disabled}
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
        {...focusProps}
      />
      {children}
    </Row>
  );
};

SingleSelectActionItem.displayName = "SingleSelectActionItem";
SingleSelectActionItem.defaultProps = { styles: css, onFocus: noop, onBlur: noop };
SingleSelectActionItem.propTypes = { children: childrenValidator };

export const HorizontalSingleSelectActionItem: React.FunctionComponent<SingleSelectActionItemProps> = (props) => {
  const { checked, children, className, disabled, name, onChange, styles, value } = props;
  const [isFocused, focusProps] = useFocus();
  const horizontalSingleSelectActionItemStyles = classNames(
    className,
    checked && styles["horizontal-single-select-checked"],
    disabled && styles["horizontal-single-select-disabled"],
    styles["horizontal-single-select"],
    { [styles.focus]: isFocused }
  );
  const passthrough = omit(props, "checked", "children", "className", "disabled", "name", "onChange", "styles", "value");
  return (
    <Col data-test-class="horizontal-action-item" {...passthrough} className={horizontalSingleSelectActionItemStyles}>
      <label className={styles["horizontal-single-select-label"]}>
        <input
          checked={checked}
          aria-checked={checked}
          disabled={disabled}
          name={name}
          onChange={onChange}
          type="radio"
          value={value}
          {...focusProps}
        />
        {children}
      </label>
    </Col>
  );
};

HorizontalSingleSelectActionItem.displayName = "HorizontalSingleSelectActionItem";
HorizontalSingleSelectActionItem.defaultProps = { styles: css, onFocus: noop, onBlur: noop };
HorizontalSingleSelectActionItem.propTypes = { children: childrenValidator };

export interface MultiSelectActionItemProps extends CommonActionItemInterface {
  checked?: boolean;
  onChange?(event: React.SyntheticEvent<HTMLInputElement>): void;
  value: string;
}

export const MultiSelectActionItem: React.FunctionComponent<MultiSelectActionItemProps> = (props) => {
  const { checked, children, className, disabled, onChange, styles, value } = props;
  const [isFocused, focusProps] = useFocus();
  const multiSelectActionItemStyles = classNames(
    className,
    (checked && styles["multi-select-checked"]) || (disabled && styles["multi-select-disabled"]) || styles["multi-select"],
    { [styles.focus]: isFocused }
  );

  const passthrough = omit(props, "checked", "children", "className", "disabled", "onChange", "styles", "value");
  return (
    <Row data-test-class="action-item" tagName="label" className={multiSelectActionItemStyles}>
      <Checkbox
        withoutFocusStyle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles["multi-select-checkbox"]}
        value={value}
        hasExternalLabel
        {...focusProps}
      />
      <Grid className={styles["multi-select-grid"]}>
        <Row {...passthrough} className={styles["multi-select-row"]}>
                  {children}
        </Row>
      </Grid>
    </Row>
  );
};

MultiSelectActionItem.displayName = "MultiSelectActionItem";
MultiSelectActionItem.defaultProps = { styles: css };
MultiSelectActionItem.propTypes = { children: childrenValidator };

export interface LinkActionItemInterface extends CommonActionItemInterface<HTMLAnchorElement> {
  noChevron?: boolean;
}

export class LinkActionItem extends React.Component<LinkActionItemInterface, {}> {
  public static defaultProps: Object = { styles: css };

  public static propTypes = {
    children: childrenValidator,
  };

  public render() {
    const { children, className, disabled, href, to, styles, noChevron } = this.props;
    const linkActionItemStyles = classNames(className, disabled ? styles["link-item-disabled"] : styles["link-item"]);
    const disabledProps = disabled ? { "aria-disabled": true, tabIndex: -1 } : {};
    const passthrough = omit(this.props, "children", "className", "disabled", "href", "styles", "to", "noChevron");
    return (
      <Row
        preserveHyperlinkWHCMColor
        data-test-class="action-item"
        {...passthrough}
        {...disabledProps}
        href={href}
        to={to}
        className={linkActionItemStyles}
      >
        {children}
        {!noChevron ? (
          <Col width={1} className={styles["link-item-icon"]}>
            <Icon icon={IconName.ChevronRight} size={IconSize.XSmall} />
          </Col>
        ) : null}
      </Row>
    );
  }
}
