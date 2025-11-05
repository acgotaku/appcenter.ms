import * as React from "react";
import { PanelOutlet, PanelOutletProps } from "../../panels";
import { Modal, ModalProps } from "../modal";

export interface StandaloneModalProps extends Pick<ModalProps & PanelOutletProps, "children" | "parentPanelPosition"> {
  visible: boolean;
  onRequestClose: () => void;
}

/**
 * Wraps Modal so it can easily be used without being a route component.
 */
export const StandaloneModal: React.FunctionComponent<StandaloneModalProps> = ({
  visible,
  children,
  onRequestClose,
  parentPanelPosition,
}) => (
  <PanelOutlet passRouterToChild={false} parentPanelPosition={parentPanelPosition}>
    {visible ? (
      <Modal isTop willTransitionIn onRequestClose={onRequestClose}>
        {children}
      </Modal>
    ) : null}
  </PanelOutlet>
);
