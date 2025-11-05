import * as React from "react";
import { Text, Size } from "../typography";
import { Color } from "../utils/color";
import { Pill } from "../pill";
const css = require("./top-bar.scss");

export interface PreviewTitleAreaProps {
  title: string;
  hidePreview?: boolean;
}

export class PreviewTitleArea extends React.Component<PreviewTitleAreaProps, {}> {
  public static defaultProps: PreviewTitleAreaProps = { title: "Title", hidePreview: false };

  public render() {
    const { title, hidePreview } = this.props;

    return (
      <div className={css.preview}>
        <Text size={Size.Medium} bold>
          {title}
        </Text>
        {hidePreview ? null : <Pill color={Color.Amber}>Preview</Pill>}
      </div>
    );
  }
}
