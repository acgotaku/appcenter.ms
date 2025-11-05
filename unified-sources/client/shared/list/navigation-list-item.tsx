import * as React from "react";
import * as PropTypes from "prop-types";
import * as classNames from "classnames/bind";
import { pick } from "lodash";
import hoistNonReactStatics = require("hoist-non-react-statics");
import { NavigationListItemProps } from "./navigation-list";
import { PartialBy } from "@lib/common-interfaces/omit";
import { UseArrowKeyFocusOptions, ArrowKeyFocuser } from "@root/shared/hooks/use-arrow-key-focus";
const css = require("./navigation-list.scss");
const cx = classNames.bind(css);

export interface NavigationListItemOptions {
  passthrough?: (keyof NavigationListItemProps)[];
  arrowKeyFocus?: boolean | Partial<UseArrowKeyFocusOptions>;
}

/** Just the props handled by NavigationListItem itself */
export interface NLInjectedProps {
  className: string;
  "data-akf-default"?: boolean;
}

/** The props handled by NavigationListItem + ArrowKeyFocuser */
export interface NavigationListItemInjectedProps extends NLInjectedProps {}

/**
 * HOC to wrap the components returned in List’s `renderItem` prop (or equivalently, Table’s `renderRow` prop).
 * It takes information injected into `renderItem` and transforms it into a `className` that correctly styles
 * the list items when they become a navigation list in secondary panels.
 * @param passthrough Keys of props that would normally be consumed and not passed through to the wrapped component that should be passed through
 */
export const navigationListItem = ({ passthrough = [], arrowKeyFocus }: NavigationListItemOptions = {}) => <
  P extends NavigationListItemInjectedProps
>(
  WrappedComponent: React.ComponentClass<P>
) => {
  const akfOptions: Partial<UseArrowKeyFocusOptions> | undefined =
    typeof arrowKeyFocus === "boolean" ? { enableArrowKeyFocus: arrowKeyFocus } : arrowKeyFocus;
  class NavigationListItem extends React.Component<
    NavigationListItemProps & Partial<UseArrowKeyFocusOptions> & PartialBy<P, keyof NLInjectedProps>
  > {
    public static displayName = `navigationListItem(${WrappedComponent.displayName || WrappedComponent.name})`;
    // HOC has trouble reconciling this
    public static propTypes: any /* Required<React.ValidationMap<NavigationListItemProps & ArrowKeyFocuserTargetProps>> */ = {
      narrow: PropTypes.bool,
      active: PropTypes.bool,
      compact: PropTypes.bool,
      style: PropTypes.object,
      onKeyDown: PropTypes.func,
    };

    public render() {
      const {
        compact,
        narrow,
        active,
        className,
        enableArrowKeyFocus,
        focusContainer,
        focusableElementFilter,
        orientation,
        ...props
      } = this.props as NavigationListItemProps & Partial<UseArrowKeyFocusOptions> & NavigationListItemInjectedProps;
      const additionalPassthrough = pick(this.props, passthrough);
      return (
        <ArrowKeyFocuser
          orientation="horizontal"
          enableArrowKeyFocus={enableArrowKeyFocus}
          focusContainer={focusContainer}
          focusableElementFilter={focusableElementFilter}
          {...akfOptions}
        >
          {(arrowKeyFocusProps) => (
            <WrappedComponent
              {...(props as P & NavigationListItemInjectedProps & NavigationListItemProps)}
              {...additionalPassthrough}
              {...arrowKeyFocusProps}
              {...(active ? { "data-akf-default": true } : null)}
              className={cx("item", className, { compact, narrow, active })}
            />
          )}
        </ArrowKeyFocuser>
      );
    }
  }

  hoistNonReactStatics(NavigationListItem, WrappedComponent as any);
  return NavigationListItem;
};

// Same-ish type except `NavigationListItemProps` is wrapped in `Partial<>`

/**
 * HOC to wrap the components returned in List’s `renderItem` prop (or equivalently, Table’s `renderRow` prop).
 * It takes information injected into `renderItem` and transforms it into a `className` that correctly styles
 * the list items when they become a navigation list in secondary panels.
 * @param passthrough Keys of props that would normally be consumed and not passed through to the wrapped component that should be passed through
 */
export const optionallyNavigationListItem = navigationListItem as (
  options: NavigationListItemOptions
) => <P extends Partial<NavigationListItemInjectedProps>>(
  WrappedComponent: React.ComponentType<P>
) => React.ComponentClass<P & Partial<NavigationListItemProps> & Partial<UseArrowKeyFocusOptions>>;
