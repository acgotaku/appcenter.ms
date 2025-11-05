import * as React from "react";
import { observer } from "mobx-react";
import { layoutStore, Breakpoint } from "@root/stores/layout-store";

export enum Media {
  Tablet,
  Desktop,
}

const mediaToBreakpoint: { [K in Media]: Breakpoint } = {
  [Media.Tablet]: Breakpoint.Tablet,
  [Media.Desktop]: Breakpoint.Small,
};

export interface MediaComponentProps {
  maxWidth: Media;
  children: () => React.ReactNode;
}

export const Hide = observer<React.SFC<MediaComponentProps>>(({ maxWidth, children }) => {
  if (layoutStore.documentWidth <= mediaToBreakpoint[maxWidth]) {
    return null;
  }
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children()}</>; // Fragment is a workaround for https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
});
Hide.displayName = "Hide";

export const Show = observer<React.SFC<MediaComponentProps>>(({ maxWidth, children }) => {
  if (layoutStore.documentWidth > mediaToBreakpoint[maxWidth]) {
    return null;
  }
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children()}</>; // Fragment is a workaround for https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
});
Show.displayName = "Show";

export const MobileOnly: React.SFC<Pick<MediaComponentProps, "children">> = (props) => <Show maxWidth={Media.Tablet} {...props} />;
export const DesktopOnly: React.SFC<Pick<MediaComponentProps, "children">> = (props) => <Hide maxWidth={Media.Tablet} {...props} />;
MobileOnly.displayName = "MobileOnly";
DesktopOnly.displayName = "DesktopOnly";
