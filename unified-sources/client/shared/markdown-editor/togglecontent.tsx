import * as React from "react";
import { MarkdownContainerSelectionState, MarkdownEditorContext, markdownEditorContextTypes } from "./markdowneditor-context";
import { observer } from "mobx-react";
import { t } from "@root/lib/i18n";
import { notifyScreenReader } from "@root/stores/notification-store";

export interface ToggleContentProps extends React.HTMLAttributes<HTMLElement> {
  editor: React.ReactElement<any>;
  preview: React.ReactElement<any>;
}

@observer
export class ToggleContent extends React.Component<ToggleContentProps, {}> {
  public static displayName = "MarkdownEditor.ToggleContent";
  public context!: MarkdownEditorContext;

  public static contextTypes = { markdownContainerContext: markdownEditorContextTypes.markdownContainerContext };

  public UNSAFE_componentWillUpdate(nextProps, nextState, nextContext: MarkdownEditorContext) {
    const {
      markdownContainerContext: { currentSelection },
    } = nextContext;
    const message =
      currentSelection === MarkdownContainerSelectionState.EDITOR
        ? t("common:markdownEditor.editor.enabled")
        : t("common:markdownEditor.editor.disabled");
    notifyScreenReader({ message, delay: 500 });
  }

  public render() {
    const { editor, preview, ...passthrough } = this.props;

    return (
      <div {...passthrough}>
        {this.context.markdownContainerContext.currentSelection === MarkdownContainerSelectionState.EDITOR ? editor : preview}
      </div>
    );
  }
}
