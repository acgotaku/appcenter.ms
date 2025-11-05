import * as React from "react";
import { noop } from "lodash";

export interface VisibilityTogglerInjectedProps {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

export interface VisibilityTogglerProps {
  defaultVisible?: boolean;
  children: (controls: VisibilityTogglerInjectedProps) => React.ReactNode;
  onShow?: () => void;
  onHide?: () => void;
}

export interface VisibilityTogglerState {
  visible?: boolean;
}

/**
 * A state container for the visibility of an element. It takes a render function which is passed
 * the current visibility state and functions to change the state. Use this component when the
 * visibility of an element is purely a UI concern and not connected to any business logic. If,
 * for example, you want to validate some user input in a Dialog before hiding it, don’t use this
 * component—in that case, store visibility state in a UI store instead for greater control.
 *
 * @example
 * <VisibilityToggler>
 *   {({ visible, show, hide }) => (
 *     <>
 *       <Dialog visible={visible} onRequestClose={hide}>I’m a Dialog</Dialog>
 *       <Button onClick={show}>Show dialog</Button>
 *     </>
 *   )}
 * </VisibilityToggler>
 */
export class VisibilityToggler extends React.Component<VisibilityTogglerProps, VisibilityTogglerState> {
  static defaultProps = { defaultVisible: false, onShow: noop, onHide: noop };
  state = { visible: this.props.defaultVisible };

  private hide = () => {
    this.setState({ visible: false });
    this.props.onHide!();
  };

  private show = () => {
    this.setState({ visible: true });
    this.props.onShow!();
  };

  render() {
    return this.props.children({
      visible: !!this.state.visible,
      show: this.show,
      hide: this.hide,
    });
  }
}
