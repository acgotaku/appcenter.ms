import * as PropTypes from "prop-types";

/**
 * State of the containers selection
 */
export enum MarkdownContainerSelectionState {
  EDITOR = 0,
  PREVIEW = 1,
}

export type MarkdownEditorContainerContext = {
  currentSelection: MarkdownContainerSelectionState;
  onSelectionChanged?: (selection: MarkdownContainerSelectionState) => void;
};

export type MarkdownEditorContext = {
  markdownContainerContext: MarkdownEditorContainerContext;
};

export const markdownEditorContextTypes = {
  markdownContainerContext: PropTypes.object,
};
