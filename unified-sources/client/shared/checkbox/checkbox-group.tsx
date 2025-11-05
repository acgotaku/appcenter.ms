import * as React from "react";
import { Paragraph, Size, TextColor } from "../typography";
const css = require("./checkbox-group.scss");

export interface CheckboxGroupProps extends React.HTMLAttributes<HTMLElement> {
  validationMessage?: React.ReactNode;
}

export class CheckboxGroup extends React.PureComponent<CheckboxGroupProps> {
  public render() {
    const { className, children, validationMessage, ...props } = this.props;
    return (
      <div className={[className, css.checkboxGroup].join(" ")} {...props}>
        {children}
        {typeof validationMessage === "string" ? (
          <Paragraph size={Size.Medium} color={TextColor.Error}>
            {validationMessage}
          </Paragraph>
        ) : (
          validationMessage
        )}
      </div>
    );
  }
}
