import * as React from "react";
import * as PropTypes from "prop-types";
import { observer } from "mobx-react";
import {
  Dialog,
  Paragraph,
  Title,
  Size,
  Space,
  TextColor,
  ButtonContainer,
  PrimaryButton,
  Button,
  Icon,
  IconName,
  IconSize,
  MediaObject,
  Text,
} from "@root/shared";
import { ExternalCredential } from "@root/data/shell/models/external-credential";
import { withTranslation, WithTranslation } from "react-i18next";
const css = require("./external-credential-dialog.scss");

export interface ExternalCredentialDialogProps extends WithTranslation {
  visible: boolean;
  title: string;
  description: string;
  confirmButton?: string;
  cancelButton: string;
  onConfirm: (cb: Function) => (event: React.FormEvent<HTMLElement>) => void;
  onSuccess(externalCredential: ExternalCredential): void;
  onCancel(): void;
  iconName?: IconName;
  progress: boolean;
  confirmDisabled: boolean;
  loading?: boolean;
  [key: string]: any;
}

export const ExternalCredentialDialog = withTranslation("common")(
  observer(
    class ExternalCredentialDialog extends React.Component<ExternalCredentialDialogProps, {}> {
      public static propTypes: React.WeakValidationMap<ExternalCredentialDialogProps> = {
        progress: PropTypes.bool.isRequired,
        confirmDisabled: PropTypes.bool.isRequired,
        visible: PropTypes.bool.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        cancelButton: PropTypes.string.isRequired,
        confirmButton: PropTypes.string,
        onCancel: PropTypes.func.isRequired,
        onConfirm: PropTypes.func.isRequired,
        iconName: PropTypes.oneOf(Object.values(IconName)),
      };
      public static defaultProps = { styles: css };

      public render() {
        const {
          t,
          confirmDisabled,
          progress,
          visible,
          loading,
          title,
          description,
          cancelButton,
          confirmButton,
          onCancel,
          onConfirm,
          iconName,
          className,
          styles,
          children,
          onSuccess,
          ...props
        } = this.props;
        return (
          <Dialog
            {...props}
            title={title}
            className={[className, styles.dialog].join(" ")}
            onRequestClose={onCancel}
            visible={visible}
            loading={loading}
          >
            {loading ? (
              <div className={styles.loadingLabel}>
                <Text size={Size.Large} color={TextColor.Secondary}>
                  {t("externalCredentialDialog.dialogVerifyAuthentication")}
                </Text>
              </div>
            ) : (
              <>
                <MediaObject className={styles.headerContents} hSpace={Space.Medium} textOnly={!iconName}>
                  {iconName ? <Icon icon={iconName} size={IconSize.Medium} /> : null}
                  <Title className={styles.title} size={Size.Small} breakWord>
                    {title}
                  </Title>
                  <Paragraph
                    className={styles.normalWhiteSpace}
                    size={Size.Medium}
                    color={TextColor.Secondary}
                    spaceAbove={Space.XSmall}
                  >
                    {description}
                  </Paragraph>
                </MediaObject>
                <form onSubmit={onConfirm(onSuccess)}>
                  {children} {/* children would specify their own styles */}
                  <div className={styles.buttons}>
                    <ButtonContainer equalize>
                      <Button data-test-class="external-credential-cancel-button" onClick={onCancel}>
                        {cancelButton}
                      </Button>
                      {confirmButton ? (
                        <PrimaryButton
                          type="submit"
                          data-test-class="external-credential-confirm-button"
                          progress={progress}
                          disabled={confirmDisabled}
                          loadingAriaLabel="adding"
                        >
                          {confirmButton}
                        </PrimaryButton>
                      ) : null}
                    </ButtonContainer>
                  </div>
                </form>
              </>
            )}
          </Dialog>
        );
      }
    }
  )
);
