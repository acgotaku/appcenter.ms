import * as React from "react";
import { SearchInputProps, SearchInput } from "./search-input";
const css = require("./input.scss");

export const MobileSearchInput: React.SFC<SearchInputProps> = (props) => <SearchInput {...props} className={css.mobile} />;

MobileSearchInput.displayName = "MobileSearchInput";
