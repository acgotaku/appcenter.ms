import * as React from "react";
import { Dialog } from "./dialog";
import { noop, uniqueId } from "lodash";
import { ButtonContainer } from "../button-container";
import { PrimaryButton, Button } from "../button";
import { Color, ButtonColor } from "../utils/color";
import { Paragraph, Title, Size, Space, TextColor } from "../typography";
import { Autofocus } from "../autofocus";
const css = require("./confirmation-dialog.scss");
const { cloneElement } = React;

export interface ConfirmationDialogProps {
  visible: boolean;
  danger?: boolean;
  title: string | React.ReactElement<any>;
  description?: string | React.ReactElement<any>;
  cancelButton?: string | React.ReactElement<any>;
  confirmButton: string | React.ReactElement<any>;
  to?: string;
  onCancel(): void;
  onConfirm?(event: React.MouseEvent<HTMLElement>): void;
  [key: string]: any;
}

export function ConfirmationDialog({
  onConfirm,
  danger,
  title,
  description,
  cancelButton,
  confirmButton,
  confirmButtonAriaLabel,
  className,
  styles,
  children,
  to,
  ...props
}: ConfirmationDialogProps) {
  const color = danger ? { color: Color.Red as ButtonColor } : {};
  const buttonProps = typeof to === "string" ? { to, onClick: noop } : {};
  const ariaLabel = confirmButtonAriaLabel ? confirmButtonAriaLabel : confirmButton;
  const titleId = uniqueId("title-");
  const descriptionId = uniqueId("description-");

  const onCancel = () => {
    props.onCancel();
  };

  return (
    <Dialog
      title={typeof title === "string" ? title : undefined}
      {...props}
      className={[className, styles.dialog].join(" ")}
      onRequestClose={onCancel}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header role="heading" aria-level={2}>
        <Title id={titleId} data-test-id="confirmation-dialog-title" size={Size.Small} className={styles.title}>
          {title}
        </Title>
      </header>
      {description ? (
        <Paragraph
          id={descriptionId}
          data-test-id="confirmation-dialog-text"
          size={Size.Medium}
          color={TextColor.Secondary}
          spaceAbove={Space.XXSmall}
        >
          {description}
        </Paragraph>
      ) : null}
      {children} {/* children would specify their own styles */}
      <div className={styles.buttons}>
        <ButtonContainer equalize>
          {typeof cancelButton === "string" ? (
            <Autofocus focus refocusOriginalElement>
              <Button data-test-id="cancel-button" onClick={onCancel}>
                {cancelButton}
              </Button>
            </Autofocus>
          ) : cancelButton ? (
            cloneElement(cancelButton, { onClick: onCancel })
          ) : null}
          {typeof confirmButton === "string" ? (
            <PrimaryButton data-test-id="confirm-button" {...color} onClick={onConfirm} aria-label={ariaLabel} {...buttonProps}>
              {confirmButton}
            </PrimaryButton>
          ) : (
            cloneElement(confirmButton, { onClick: onConfirm, ...color })
          )}
        </ButtonContainer>
      </div>
    </Dialog>
  );
}

ConfirmationDialog.defaultProps = { styles: css };
