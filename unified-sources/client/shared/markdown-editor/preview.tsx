import * as React from "react";
import { Markdown } from "../markdown";

export class Preview extends React.Component<{ className?: string; value: string }, {}> {
  public static displayName = "MarkdownEditor.Preview";

  public render() {
    const { value, ...passthrough } = this.props;
    return <Markdown {...passthrough}>{value}</Markdown>;
  }
}
