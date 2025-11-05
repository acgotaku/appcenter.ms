import * as React from "react";
import { omit } from "lodash";
import { IconName, IconSize, Icon } from "../icon/icon";
import { InputVariant, InputSize } from "./input-base";
import { InputProps, InputState } from "./input";
import { SearchInput } from "./search-input";
const css = require("./input.scss");

export interface BorderlessSearchBarProps extends InputProps {
  resultsCount: number;
}

export class BorderlessSearchBar extends React.Component<BorderlessSearchBarProps, InputState> {
  public static defaultProps = {
    placeholder: "Search",
    styles: css,
    size: InputSize.Small,
  };
  public render() {
    const props = omit(this.props, "className");

    return <SearchInput {...props} icon={<Icon icon={IconName.Search} size={IconSize.XSmall} />} variant={InputVariant.Borderless} />;
  }
}
