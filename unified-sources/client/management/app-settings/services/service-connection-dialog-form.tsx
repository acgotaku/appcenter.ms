import * as React from "react";
import { observer } from "mobx-react";
import { Icon, IconName, IconSize, ButtonContainer, Button, PrimaryButton, Color, Dialog, Formsy } from "@root/shared";
import { Title, Text, Size, TextColor, Space } from "@root/shared/typography";
import { Grid, Row, Col, RowCol } from "@root/shared/grid";
import { ServiceConnectionDialogFormUIStore } from "./service-connection-dialog-form-ui-store";
import { withTranslation, WithTranslation, Trans } from "react-i18next";
import { t } from "@root/lib/i18n";

const styles = require("./service-connection-dialog-form.scss");

interface IServiceConnectionDialogFormProps {
  store: ServiceConnectionDialogFormUIStore;
}

export const ServiceConnectionDialogForm = withTranslation(["common", "management"])(
  observer(
    class ServiceConnectionDialogForm extends React.Component<WithTranslation & IServiceConnectionDialogFormProps, {}> {
      public render() {
        const store = this.props.store;

        return (
          <Dialog title={store.headerText} className={styles.dialog} visible={store.showDialog} onRequestClose={store.hideServiceForm}>
            {store.service ? (
              <Formsy.Form key="addServiceConnection" onValidSubmit={(data) => store.postServiceConnection(data)}>
                <Grid>
                  <Row>
                    <Col width={1}>{store.service.type ? <Icon icon={store.iconName!} size={IconSize.Medium} /> : null}</Col>
                    <Col width={11}>
                      <Grid>
                        <RowCol>
                          <header role="heading" aria-level={2}>
                            <Title spaceBelow={Space.XSmall} size={Size.Small}>
                              {store.headerText}
                            </Title>
                          </header>
                          <Text color={TextColor.Secondary} size={Size.Small}>
                            <Trans i18nKey="management:appServices.bugTracker.form.text">
                              <a href="https://docs.microsoft.com/appcenter/dashboard/bugtracker/#getting-started" target="_blank">
                                Learn re
                              </a>
                            </Trans>
                          </Text>
                        </RowCol>
                        <RowCol>
                          <Formsy.Input
                            className={store.isAuthError ? styles["input-error"] : null}
                            name="username"
                            isRequired
                            requiredError={t("management:appServices.bugTracker.form.errors.jiraEmail")}
                            placeholder={t("management:appServices.bugTracker.form.jiraEmail")}
                          />
                        </RowCol>
                        <RowCol>
                          <Formsy.Input
                            className={store.isAuthError ? styles["input-error"] : null}
                            name="password"
                            type="password"
                            isRequired
                            requiredError={t("management:appServices.bugTracker.form.errors.apiToken")}
                            placeholder={t("management:appServices.bugTracker.form.apiToken")}
                          />
                        </RowCol>
                        <RowCol>
                          <Formsy.Input
                            className={store.isAuthError ? styles["input-error"] : null}
                            name="baseUrl"
                            defaultValue={null}
                            isRequired
                            requiredError={t("management:appServices.bugTracker.form.errors.baseUrl")}
                            validations="isUrlHttps"
                            validationErrors={{
                              isUrlHttps: t("management:appServices.bugTracker.form.errors.invalidUrl"),
                            }}
                            placeholder={t("management:appServices.bugTracker.form.baseUrl")}
                          />
                        </RowCol>
                        {store.formError ? (
                          <RowCol>
                            {store.isAuthError ? null : <Icon icon={IconName.StatusError} color={Color.Red} size={IconSize.Small} />}
                            <Text size={Size.Medium} color={TextColor.Error}>
                              {store.formError}
                            </Text>
                          </RowCol>
                        ) : null}
                        <RowCol>
                          <ButtonContainer right>
                            <Button type="button" onClick={store.hideServiceForm}>
                              {t("button.cancel")}
                            </Button>
                            <PrimaryButton type="submit" progress={store.isFormPosting} disabled={store.isFormPosting}>
                              {t("button.add")}
                            </PrimaryButton>
                          </ButtonContainer>
                        </RowCol>
                      </Grid>
                    </Col>
                  </Row>
                </Grid>
              </Formsy.Form>
            ) : null}
          </Dialog>
        );
      }
    }
  )
);
