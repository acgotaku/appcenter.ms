import * as React from "react";
import { observer } from "mobx-react";
import {
  ConfirmationDialog,
  DropdownButton,
  FooterArea,
  Icon,
  IconName,
  IconSize,
  InfoBanner,
  Item,
  Page,
  PageHeader,
  PanelPosition,
  Paragraph,
  PrimaryButton,
  Size,
  Space,
  StandaloneModal,
  TextArea,
  TextColor,
  Title,
  Trigger,
  ActionText,
  Text,
} from "@root/shared";
import { Grid, RowCol, Row, Col } from "@root/shared/grid";
import { Select } from "@root/shared/select/v2/select";
import { CreateSupportCaseModalUIStore, categories } from "./create-support-case-modal-ui-store";
import { withTranslation, WithTranslation, Trans, useTranslation } from "react-i18next";
import { SupportUIStoreContext } from "client/shell/support-ui-store";
import { logger } from "@root/lib/telemetry";

const styles = require("./create-support-case-modal.scss");

export const CreateSupportCaseModal = withTranslation(["management", "common"])(
  observer(
    class CreateSupportCaseModal extends React.Component<WithTranslation, {}> {
      uiStore = new CreateSupportCaseModalUIStore();

      render() {
        const {
          confirmCloseModal,
          closeModal,
          createSupportCase,
          dropdownCategory,
          setCategory,
          categoryDocsLabel,
          docsLink,
          message,
          onInputMessage,
          email,
          hasExistingEmail,
          onInputEmail,
          isSuccessful,
          isFailed,
          openDialog,
          toggleDialog,
          isSubmitting,
          buttonDisabled,
        } = this.uiStore;
        const { t } = this.props;
        return (
          <SupportUIStoreContext.Consumer>
            {({ hide, visible }) => (
              <StandaloneModal
                visible={visible}
                onRequestClose={() => confirmCloseModal(hide)}
                parentPanelPosition={PanelPosition.Primary}
              >
                <Page
                  panelPosition={PanelPosition.Primary}
                  supportsMobile
                  header={
                    <PageHeader
                      closeButton
                      onClickClose={isFailed || isSuccessful ? () => closeModal(hide) : () => confirmCloseModal(hide)}
                      title={t("management:support.contactSupport.title")}
                    />
                  }
                  footer={
                    <FooterArea alignRight>
                      {isSuccessful ? (
                        <PrimaryButton onClick={() => closeModal(hide)}>{t("management:support.contactSupport.ok")}</PrimaryButton>
                      ) : (
                        <FormFooter onClick={createSupportCase} isSubmitting={isSubmitting} buttonDisabled={buttonDisabled} />
                      )}
                    </FooterArea>
                  }
                >
                  <Grid>
                    {isSuccessful ? (
                      <SuccessModalContent email={email} />
                    ) : (
                      <>
                        <RowCol>
                          <ConfirmationDialog
                            visible={openDialog}
                            onCancel={() => toggleDialog(false)}
                            onConfirm={() => closeModal(hide)}
                            title={t("management:support.contactSupport.dialog.title")}
                            description={t("management:support.contactSupport.dialog.description")}
                            cancelButton={t("management:support.contactSupport.dialog.cancel")}
                            confirmButton={t("management:support.contactSupport.dialog.discard")}
                          />
                          <Grid rowSpacing={Space.Medium}>
                            <Row middle>
                              <Col width={0.5}>
                                <Icon icon={IconName.CalendarClock} color={TextColor.Secondary} className={styles.icon} />
                              </Col>
                              <Col>
                                <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                                  {t("management:support.contactSupport.supportTime")}
                                </Paragraph>
                                <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                                  {t("management:support.contactSupport.responseTime")}
                                </Paragraph>
                                <Paragraph size={Size.Medium} color={TextColor.Secondary}>
                                  {t("management:support.contactSupport.supportEmail")}
                                </Paragraph>
                              </Col>
                            </Row>
                            {!hasExistingEmail ? (
                              <RowCol>
                                <Paragraph.asLabel size={Size.Medium} id="email-label" htmlFor="email-field">
                                  {t("management:support.contactSupport.contactEmail")}
                                </Paragraph.asLabel>
                                <TextArea
                                  id="email-field"
                                  aria-labelledby="message-label"
                                  rows={1}
                                  placeholder="Email address"
                                  value={email}
                                  onChange={onInputEmail}
                                />
                              </RowCol>
                            ) : null}
                            <RowCol>
                              <Paragraph.asLabel size={Size.Medium} bold id="category-label" htmlFor="category-field">
                                {t("management:support.contactSupport.prompt")}
                              </Paragraph.asLabel>
                            </RowCol>
                            <RowCol>
                              <Select
                                id="category-field"
                                aria-labelledby="category-label"
                                items={categories}
                                renderItem={(item) => <Item title={item ? item.displayName : ""} />}
                                getValue={(item) => (item ? item.value : "")}
                                getText={(item) => (item ? item.displayName : "")}
                                value={dropdownCategory}
                                onSelectOption={setCategory}
                                className={styles.fullWidth}
                                overlayClassName={styles.fullWidth}
                                renderTrigger={(item) => (
                                  <Trigger>
                                    <DropdownButton input className={styles.fullWidth}>
                                      {item ? item.displayName : ""}
                                    </DropdownButton>
                                  </Trigger>
                                )}
                              />
                            </RowCol>
                            <RowCol>
                              <Text size={Size.Medium}>{t("management:support.contactSupport.promptFeedbackLink.text")}</Text>
                              &nbsp;
                              <ActionText>
                                <a
                                  className={styles.link}
                                  target="_blank"
                                  href="https://github.com/Microsoft/appcenter/issues/new?assignees=&labels=feature+request&template=feature_request.md&title="
                                >
                                  Submit feature requests here
                                </a>
                              </ActionText>
                            </RowCol>
                          </Grid>
                        </RowCol>
                        <RowCol>
                          <InfoBanner
                            title={t("management:support.contactSupport.docsTitle")}
                            description={t("management:support.contactSupport.docsMessage")}
                            image={require("./images/docs-check-icon.svg")}
                            visible
                            readMoreText={t("management:support.contactSupport.openDocs", { category: categoryDocsLabel })}
                            readMoreLink={docsLink}
                            confirmButton={t("common:button.dismiss")}
                            bannerBlue
                            onReadMoreClick={() => logger.info("support-form/open-docs")}
                          />
                        </RowCol>
                        <RowCol>
                          <Paragraph.asLabel size={Size.Medium} id="message-label" htmlFor="message-field">
                            {t("management:support.contactSupport.message")}
                          </Paragraph.asLabel>
                          <TextArea
                            id="message-field"
                            aria-labelledby="message-label"
                            rows={5}
                            placeholder={t("management:support.contactSupport.listDetails")}
                            value={message}
                            onChange={onInputMessage}
                            className={styles.space}
                          />
                        </RowCol>
                      </>
                    )}
                  </Grid>
                </Page>
              </StandaloneModal>
            )}
          </SupportUIStoreContext.Consumer>
        );
      }
    }
  )
);

function FormFooter({ onClick, isSubmitting, buttonDisabled }) {
  const { t } = useTranslation();
  return (
    <Grid>
      <Row middle between>
        <Col>
          <Paragraph size={Size.Small} color={TextColor.Secondary}>
            <Trans i18nKey="management:support.contactSupport.waiver">
              text
              <a className={styles.link} target="_blank" href="https://www.microsoft.com/en-us/servicesagreement/">
                Microsoft Services Agreement
              </a>
              text
              <a className={styles.link} target="_blank" href="https://privacy.microsoft.com/en-us/privacystatement">
                Microsoft Privacy Statement
              </a>
              text.
            </Trans>
          </Paragraph>
        </Col>
        <Col width={3} className={styles.submit}>
          <PrimaryButton onClick={onClick} progress={isSubmitting} disabled={buttonDisabled}>
            {t("management:support.contactSupport.submit")}
          </PrimaryButton>
        </Col>
      </Row>
    </Grid>
  );
}

function SuccessModalContent({ email }) {
  const { t } = useTranslation();
  return (
    <Grid>
      <RowCol center>
        <Icon size={IconSize.XLarge} icon={IconName.StatusPassedOutline} color={TextColor.Success} className={styles.success} />
        <Title size={Size.Large} color={TextColor.Primary} bold={true} spaceAbove={Space.Medium}>
          {t("management:support.contactSupport.success.title")}
        </Title>
        <Paragraph size={Size.Medium} color={TextColor.Secondary} spaceAbove={Space.XSmall}>
          {t("management:support.contactSupport.success.subtitle")}
        </Paragraph>
        <Paragraph size={Size.Medium} color={TextColor.Primary} bold={true}>
          {email}
        </Paragraph>
        <Paragraph size={Size.Medium} color={TextColor.Secondary} spaceAbove={Space.Medium}>
          {t("management:support.contactSupport.success.responseTime")}
        </Paragraph>
      </RowCol>
    </Grid>
  );
}
