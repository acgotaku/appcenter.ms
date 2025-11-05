import * as React from "react";
import { MarkdownContainerSelectionState, MarkdownEditorContext, markdownEditorContextTypes } from "./markdowneditor-context";
import { Button, ButtonSize } from "../button/button";
import { IconName, Color, Tooltip, Trigger } from "@root/shared";
import { withTranslation, WithTranslation } from "react-i18next";

const css = require("./markdowneditor.scss");

/**
 * State.
 *
 * @interface ContainerState
 */
interface ContainerState {
  currentSelection: MarkdownContainerSelectionState;
}

interface ToogleButtonsProps {
  "data-autofocus"?: boolean;
}

export const ToggleButtons = withTranslation(["distribute"])(
  class ToggleButtons extends React.Component<
    React.HTMLAttributes<HTMLElement> & WithTranslation & ToogleButtonsProps,
    ContainerState
  > {
    public static displayName = "MarkdownEditor.ToggleButtons";
    public state = { currentSelection: MarkdownContainerSelectionState.EDITOR };
    public context!: MarkdownEditorContext;

    public static contextTypes = { markdownContainerContext: markdownEditorContextTypes.markdownContainerContext };

    public onButtonClick = (selection: MarkdownContainerSelectionState) => {
      if (this.state.currentSelection === selection) {
        return;
      }
      if (this.context.markdownContainerContext.onSelectionChanged) {
        this.context.markdownContainerContext.onSelectionChanged(selection);
      }
      this.setState({ currentSelection: selection });
    };

    public render() {
      const { t, i18n, tReady, ...props } = this.props;
      const isPreviewActive = this.state.currentSelection === MarkdownContainerSelectionState.PREVIEW;
      const isEditActive = !isPreviewActive;
      return (
        <div className={css["wrapper"]} {...props}>
          <Tooltip portaled>
            <Trigger>
              <Button
                aria-label="Edit mode"
                aria-pressed={isEditActive}
                data-autofocus={this.props["data-autofocus"]}
                icon={IconName.Edit}
                size={ButtonSize.Small}
                color={isEditActive ? Color.Blue : Color.LightGray}
                onClick={() => this.onButtonClick(MarkdownContainerSelectionState.EDITOR)}
              />
            </Trigger>
            <span className={css["ellipsize"]}>{t!("distribute:button.edit")}</span>
          </Tooltip>
          <Tooltip portaled>
            <Trigger>
              <Button
                aria-label="Preview mode"
                aria-pressed={isPreviewActive}
                data-autofocus={this.props["data-autofocus"]}
                icon={IconName.Preview}
                size={ButtonSize.Small}
                color={isPreviewActive ? Color.Blue : Color.LightGray}
                onClick={() => this.onButtonClick(MarkdownContainerSelectionState.PREVIEW)}
              />
            </Trigger>
            <span className={css["ellipsize"]}>{t!("distribute:button.preview")}</span>
          </Tooltip>
        </div>
      );
    }
  }
);
