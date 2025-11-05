import * as React from "react";
import { Dialog } from "@root/shared";

const styles = require("./message-dialog.scss");

interface MessageDialogProps {
  visible: boolean;
  onRequestClose: () => void;
  title: string;
  message: string;
  buttonsArea: JSX.Element;
}

export class MessageDialog extends React.Component<MessageDialogProps, any> {
  public render() {
    const { title, message, buttonsArea, ...passthrough } = this.props;

    const classesNames = message.includes("\n") ? [styles.message, styles.newline].join(" ") : styles.message;
    return (
      <Dialog title={title} {...passthrough}>
        <header role="heading" className={styles.header} aria-level={2}>
          {title}
        </header>
        <div className={classesNames}>{message}</div>
        {buttonsArea}
      </Dialog>
    );
  }
}
