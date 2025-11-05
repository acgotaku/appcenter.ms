import * as React from "react";
import * as classNames from "classnames/bind";
import { ToggleButtons, ToggleButtonsProps } from "../toggle-buttons";
import { Button, ButtonProps, ButtonSize } from "../../button";
import { Color } from "../../utils";
import { IconName } from "../../icon";
import { Tooltip } from "../../tooltip";
import { Trigger } from "../../trigger";
import { OverlayTransition } from "@root/shared/overlay";
const css = require("../toggle-buttons.scss");
const cx = classNames.bind(css);

export interface IconToggleButtonsProps extends React.HTMLAttributes<HTMLElement> {
  /** An array of IconNames that will be mapped into a series of Buttons displaying icons. */
  icons: IconName[];
  /** Accessible descriptions of each button. */
  ariaLabels: string[];
  /** Generates explanatory Tooltips for each button from `ariaLabels`. */
  tooltips?: boolean;
  /** The index of the selected button. Use `null` to clear the selection. */
  selectedIndex?: ToggleButtonsProps["selectedIndex"];
  /** The color to use for each non-selected Button. */
  defaultColor?: ButtonProps["color"];
  /** The color to use for the selected Button. */
  selectedColor?: ButtonProps["color"];
  /** A callback called when any of the Buttons is clicked. Called with the index of the button and the click event. */
  onPress: (index: number, event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * A variant of ToggleButtons that renders icon-only Buttons, distinguishing
 * selected state by a variation in color.
 */
export class IconToggleButtons extends React.PureComponent<IconToggleButtonsProps> {
  public static defaultProps = {
    defaultColor: Color.LightGray,
    selectedColor: Color.DarkGray,
  };

  public render() {
    const { icons, defaultColor, selectedColor, ariaLabels, tooltips, onPress, ...passthrough } = this.props;
    return (
      <ToggleButtons buttonCount={icons.length} {...passthrough}>
        {(props, selected, index) => {
          const button = (
            <Button
              {...props}
              className={cx(props.className, { selected })}
              icon={icons[index]}
              smallerIcon
              size={ButtonSize.Small}
              color={selected ? selectedColor : defaultColor}
              onClick={(event) => onPress(index, event)}
              aria-label={ariaLabels[index]}
              aria-pressed={selected}
            />
          );

          return tooltips ? (
            <Tooltip transition={OverlayTransition.None} portaled key={index}>
              <Trigger>{button}</Trigger>
              {ariaLabels[index]}
            </Tooltip>
          ) : (
            button
          );
        }}
      </ToggleButtons>
    );
  }
}
