import * as React from "react";
import * as PropTypes from "prop-types";

export type ListItemContext = {
  dropdownContext: {
    compact: boolean;
    dark: boolean;
    query?: string | null;
    searchable: boolean;
    onMouseEnter(event: React.MouseEvent<HTMLElement> & { currentTarget: HTMLDivElement }): void;
    onMouseLeave(event: React.MouseEvent<HTMLElement>): void;
    registerItem(text: string, value: string, getDOMNode: () => HTMLElement): void;
    unregisterItem(text: string, value?: string);
    onSearch(query: string): void;
    onSelect?(value: string, event: React.SyntheticEvent<HTMLElement>): void;
    focusedItemId: string | null;
  };
};

export type ItemContext = {
  dropdownContext: Pick<ListItemContext["dropdownContext"], "dark">;
  listItemContext: {
    disabled: boolean;
    danger: boolean;
  };
};

export const listItemContextTypes = { dropdownContext: PropTypes.any };
export const itemContextTypes = { dropdownContext: PropTypes.any, listItemContext: PropTypes.any };
