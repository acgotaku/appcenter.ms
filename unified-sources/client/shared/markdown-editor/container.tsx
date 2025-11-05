import * as React from "react";
import { MarkdownContainerSelectionState, MarkdownEditorContext, markdownEditorContextTypes } from "./markdowneditor-context";
import { observable, runInAction } from "mobx";

/**
 * State.
 *
 * @interface ContainerState
 */
interface ContainerState {
  currentSelection: MarkdownContainerSelectionState;
}

export class Container extends React.Component<React.HTMLAttributes<HTMLElement>, ContainerState> {
  public static displayName = "MarkdownEditor.Container";
  constructor(props: React.HTMLAttributes<HTMLElement>, context: MarkdownEditorContext) {
    super(props, context);
    this.state = { currentSelection: MarkdownContainerSelectionState.EDITOR };
  }

  public static childContextTypes = markdownEditorContextTypes;

  public onSelectionChanged = (newValue) => {
    runInAction(() => (this.childContext.currentSelection = newValue));
  };

  private childContext = observable({
    currentSelection: MarkdownContainerSelectionState.EDITOR,
    onSelectionChanged: this.onSelectionChanged,
  });

  public getChildContext = () => {
    return {
      markdownContainerContext: this.childContext,
    };
  };

  public render() {
    return <div {...this.props}>{this.props.children}</div>;
  }
}
