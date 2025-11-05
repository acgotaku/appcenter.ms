import * as React from "react";
import { TextArea, TextAreaProps } from "../textarea";

export class Editor extends React.Component<TextAreaProps, {}> {
  public static displayName = "MarkdownEditor.Editor";

  public render() {
    return <TextArea {...this.props} />;
  }
}
