import * as React from "react";

// eslint-disable-next-line react/jsx-no-useless-fragment
export const wrapPrimitive = (child: React.ReactChild) => (typeof child === "object" ? child : <>{child}</>);
