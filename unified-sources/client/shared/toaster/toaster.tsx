import * as React from "react";
import { CSSTransitionGroup } from "react-transition-group";
import { observer } from "mobx-react";
import { Toasty, ScreenReaderToasty } from "@lib/common-interfaces/toaster";
import { Toast } from "./toast";
import { ScreenReaderToast } from "./toast-screen-reader";
const css = require("./toaster.scss");

export interface ToasterProps extends React.HTMLAttributes<HTMLElement> {
  persistentToasts: Toasty[];
  transientToast?: Toasty;
  screenReaderToast?: ScreenReaderToasty;
  onPerformedAction(toast: Toasty): void;
  onDismissToast(toast: Toasty): void;
  onEnterTransientToast(): void;
  onLeaveTransientToast(): void;
  styles?: any;
}

export interface ToasterState {
  replacing?: boolean;
}

export class Toaster extends React.Component<ToasterProps, ToasterState> {
  public static Observer = observer(Toaster);
  public static defaultProps = { styles: css };
  public state: ToasterState = { replacing: false };

  public UNSAFE_componentWillReceiveProps(nextProps: ToasterProps) {
    this.setState({
      replacing: this.props.transientToast && nextProps.transientToast && this.props.transientToast !== nextProps.transientToast,
    });
  }

  public render() {
    const { replacing } = this.state;
    const {
      styles,
      persistentToasts,
      transientToast,
      screenReaderToast,
      className,
      onDismissToast,
      onEnterTransientToast,
      onLeaveTransientToast,
      onPerformedAction,
    } = this.props;
    const transientDuration = replacing ? styles.transitionReplaceDuration : styles.transitionOutDuration;
    const inDuration = parseInt(styles.transitionInDuration, 10);
    const toastHeight = parseInt(styles.toastHeight, 10);

    return (
      <div className={[className, styles.toaster].join(" ")} data-test-id="toaster">
        <CSSTransitionGroup
          component="div"
          style={{ transform: `translateY(-${persistentToasts.length * toastHeight}px)` }}
          className={styles.transientTransitionGroup}
          transitionAppear
          transitionAppearTimeout={inDuration}
          transitionEnterTimeout={inDuration + parseInt(styles.transitionReplaceDuration, 10)}
          transitionLeaveTimeout={parseInt(transientDuration, 10)}
          transitionName={{
            appear: styles.enter,
            appearActive: styles.enterActive,
            enter: styles.enter,
            enterActive: styles.enterActive,
            leave: styles.leave,
            leaveActive: replacing ? styles.leaveActiveQuickly : styles.leaveActive,
          }}
        >
          {transientToast ? (
            <Toast
              key={transientToast.id}
              data-test-id="toaster-transient-toast"
              styles={styles}
              onEnter={onEnterTransientToast}
              onLeave={onLeaveTransientToast}
              {...transientToast}
              onPerformedAction={() => onPerformedAction(transientToast)}
              onDismiss={() => onDismissToast(transientToast)}
            />
          ) : null}
        </CSSTransitionGroup>
        <CSSTransitionGroup
          component="div"
          className={styles.persistentTransitionGroup}
          transitionAppear
          transitionAppearTimeout={inDuration}
          transitionEnterTimeout={inDuration}
          transitionLeaveTimeout={parseInt(styles.transitionOutDuration, 10)}
          transitionName={{
            appear: styles.enter,
            appearActive: styles.enterActive,
            enter: styles.enter,
            enterActive: styles.enterActive,
            leave: styles.leave,
            leaveActive: styles.leaveActive,
          }}
        >
          {persistentToasts.map((toast, i) => (
            <div
              key={toast.id}
              className={styles.toastWrapper}
              style={{ transform: `translateY(-${(persistentToasts.length - i - 1) * toastHeight}px)` }}
            >
              <Toast
                styles={styles}
                data-test-class="toaster-persistent-toast"
                dismissable
                {...toast}
                onPerformedAction={() => onPerformedAction(toast)}
                onDismiss={() => onDismissToast(toast)}
              />
            </div>
          ))}
        </CSSTransitionGroup>
        <ScreenReaderToast
          key="screen-reader-toast"
          styles={styles}
          message={transientToast ? transientToast.message : undefined}
          role={transientToast ? "alert" : undefined}
          {...screenReaderToast}
        />
      </div>
    );
  }
}
