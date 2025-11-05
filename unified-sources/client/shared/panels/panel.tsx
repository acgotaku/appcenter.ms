import * as React from "react";
import { findDOMNode } from "react-dom";
import * as PropTypes from "prop-types";
import * as classNames from "classnames/bind";
import * as memoize from "memoizee";
import { InjectedRouter } from "react-router";
import { once } from "lodash";
import * as Sentry from "@sentry/react";
import { SimpleEmitter } from "../utils";
import { logger } from "@root/lib/telemetry";
import { safeLocalStorage } from "@root/lib/utils/safe-local-storage";
import { notify, Notification } from "@root/stores/notification-store";
import { PanelWrapperChildContext } from "./panelify";
import { PanelPosition } from "./panel-position";
import { KeyboardEventManagerChildContext } from "../keyboard-event-manager/keyboard-event-manager";
import { GlobalProgress } from "../global-progress";
import { RefocusManagerChildContext } from "../refocus-manager";
import { AutofocusAfterTransition } from "../autofocus";
const css = require("./panel.scss");
const cx = classNames.bind(css);
const isProductionLike = process.env.NODE_ENV === "production";

const notifyOnce = once((notification: Notification) => {
  const key = "devErrorToastShown";
  if (!safeLocalStorage.getItem(key)) {
    notify(notification);
    safeLocalStorage.setItem(key, "true");
  }
});

const notifyOncePerUniqueError = memoize(
  (_: string, notification: Notification) => {
    notify(notification);
  },
  { length: 1 }
);

const panelPosition = (position: PanelPosition): string => PanelPosition[position].toLocaleLowerCase() || "hidden";

export const PanelPositionContext = React.createContext(PanelPosition.Primary);

export interface PanelProps {
  position: PanelPosition;
  isTop: boolean;
  isRoot: boolean;
  isFullWidth: boolean;
  willTransitionIn: boolean;
}

export interface PanelInjectedProps {
  panelPosition: PanelPosition;
  router: InjectedRouter;
}

export interface PanelChildContext {
  panelPosition: PanelPosition;
  panelEvents: {
    pendingEntranceEvent: boolean;
    didTransition: SimpleEmitter<PanelPosition>;
  };
}

export class Panel extends React.PureComponent<PanelProps, {}> {
  private element: HTMLElement | null = null;
  public context!: KeyboardEventManagerChildContext & PanelWrapperChildContext & RefocusManagerChildContext;

  public static propTypes = {
    children: PropTypes.any,
    isFullWidth: PropTypes.bool,
    position: PropTypes.number,
    isTop: PropTypes.bool,
  };

  public static contextTypes: React.WeakValidationMap<
    KeyboardEventManagerChildContext & PanelWrapperChildContext & RefocusManagerChildContext
  > = {
    requestClose: PropTypes.func,
    keyboardEventManager: PropTypes.any,
    refocusManager: PropTypes.any,
  };

  public static childContextTypes = {
    panelPosition: PropTypes.number,
    panelEvents: PropTypes.object,
  };

  private panelEvents: PanelChildContext["panelEvents"] = {
    pendingEntranceEvent: this.props.willTransitionIn,
    didTransition: new SimpleEmitter<PanelPosition>(),
  };

  public getChildContext(): PanelChildContext {
    return {
      // TODO: Get rid of this eventually in favor of PanelPositionContext
      panelPosition: this.props.position,
      panelEvents: this.panelEvents,
    };
  }

  public componentDidMount() {
    if (this.context.requestClose) {
      this.context.keyboardEventManager.addEscapeListener(this.context.requestClose);
    }
    if (this.element) {
      this.context.refocusManager.registerContainer(this.element, false);
    }
  }

  public componentDidUpdate(prevProps: PanelProps) {
    if (this.props.position === PanelPosition.Secondary && prevProps.position !== PanelPosition.Secondary) {
      document.body.classList.add(css.transitioningToSecondary);
    }
  }

  public componentWillUnmount() {
    if (this.context.requestClose) {
      this.context.keyboardEventManager.removeEscapeListener(this.context.requestClose);
    }
    if (this.element) {
      this.context.refocusManager.unregisterContainer(this.element);
    }
  }

  public static getDerivedStateFromError() {
    return {};
  }

  // Prevent errors inside Panels from destroying everything: https://reactjs.org/blog/2017/07/26/error-handling-in-react-16.html#new-behavior-for-uncaught-errors
  public componentDidCatch(error: Error) {
    if (isProductionLike) {
      // React silently swallows the error in production builds. Report it manually here.
      logger.error("Panel.componentDidCatch()", error);
      Sentry.captureException(error);
    } else {
      // React re-throws the error in development builds, it is reported at the upper level.
      // Display experimental "Reload" UI.
      notifyOnce({
        persistent: true,
        message: "Note: these messages are disabled in staging and production.",
      });

      notifyOncePerUniqueError(error.message, {
        persistent: true,
        message: "Oops, App Center is experiencing some hiccups. Reload the page if you experience issues.",
        buttonText: "Reload",
        action: () => location.reload(),
      });
    }
  }

  private onTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    document.body.classList.remove(css.transitioningToSecondary);
    this.panelEvents.didTransition.emit(this.props.position);
    this.panelEvents.pendingEntranceEvent = false;
  };

  public render() {
    const { position, isTop, isRoot, isFullWidth, children } = this.props;
    const role = isTop ? "main" : isFullWidth ? null : "navigation";
    const className = cx(panelPosition(position), {
      "full-width": isFullWidth,
    });

    return (
      <PanelPositionContext.Provider value={position}>
        <React.Suspense fallback={<GlobalProgress loading />}>
          <AutofocusAfterTransition
            role={role}
            disabled={isRoot}
            className={className}
            ref={(x) => (this.element = findDOMNode(x) as HTMLElement)}
            refocusOriginalElement
            force
          >
            <span aria-hidden className={css.transitionWatcher} onTransitionEnd={this.onTransitionEnd} tabIndex={-1} />
            {children}
          </AutofocusAfterTransition>
        </React.Suspense>
      </PanelPositionContext.Provider>
    );
  }
}

export const isPanel = (target: any): boolean => Boolean(target && target.isPanel);
