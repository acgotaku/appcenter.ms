import * as React from "react";
import { isEmpty } from "lodash";
import { IconName } from "../icon/icon";
import { InputVariant } from "./input-base";
import { InputState } from "./input";
import { SearchInput, SearchInputProps } from "./search-input";
const classNames = require("classnames");
const css = require("./input.scss");

export interface SearchBarProps extends SearchInputProps {
  containerProps?: any;
}

export class SearchBar extends React.Component<SearchBarProps, InputState> {
  public static defaultProps = {
    containerProps: {},
    placeholder: "Search",
    styles: css,
  };
  public render() {
    const { className, containerProps, ...passthrough } = this.props;

    const { className: containerClassName, styles, icon, variant, ...omittedContainerProps } = containerProps;

    const DEPRECATED = !isEmpty(this.props.containerProps);
    const containerPropsPassthrough = {
      ...omittedContainerProps,
      containerClassName: classNames(className, containerClassName),
    };
    if (process.env.NODE_ENV !== "production" && DEPRECATED) {
      throw new Error(
        "DEPRECATION: Passing `containerProps` to `SearchBar` is deprecated. " +
          "To prevent breakage, `containerProps` will be spread automatically. " +
          "Please refactor from `<SearchBar containerProps={{ someProp: () => undefined }} />` to `<SearchBar someProp={() => undefined} />`."
      );
    }

    return (
      <SearchInput
        {...passthrough}
        {...containerPropsPassthrough}
        className={this.props.styles!.searchbar}
        icon={IconName.Search}
        variant={InputVariant.Card}
      />
    );
  }
}
