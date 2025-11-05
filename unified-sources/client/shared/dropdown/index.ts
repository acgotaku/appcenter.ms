import * as React from "react";
import { Dropdown as InternalDropdown, DropdownProps } from "./dropdown";

export * from "./dropdown";
export * from "./item";
export * from "./item-group";

// Remove InternalDropdownProps from signature
const Dropdown = InternalDropdown as React.ComponentClass<DropdownProps>;
export { Dropdown };
