import * as React from "react";
import { observer } from "mobx-react";
import {
  Page,
  Modalify,
  PanelInjectedProps,
  PrimaryButton,
  PageNotification,
  InputSize,
  ErrorBlock,
  ButtonContainer,
  Autofocus,
  createFormComponents,
  PageHeader,
  FooterArea,
  LiveRegion,
} from "@root/shared";
import { layoutStore } from "@root/stores";
import { IOrganization } from "@lib/common-interfaces";
import { Grid, RowCol, GridSpacing } from "@root/shared/grid";
import { trim } from "lodash";
import { NewOrgStore } from "../../stores/orgs/new-org-store";
import { withTranslation, WithTranslation } from "react-i18next";

const styles = require("./new-org.scss");
const { Form, Input } = createFormComponents<{ displayName: string }>();

export interface NewOrgProps extends PanelInjectedProps {
  // Nothing to add here yet.
}

export const NewOrg = Modalify(
  withTranslation(["common", "management"])(
    observer(
      class NewOrg extends React.Component<NewOrgProps & WithTranslation, {}> {
        private _newOrgStore = new NewOrgStore();

        public render() {
          const { t } = this.props;
          const { notification, conflictError } = this._newOrgStore;
          const { isMobile } = layoutStore;
          return (
            <Form
              initialValues={{ displayName: "" }}
              validationSchema={{
                type: "object",
                properties: {
                  displayName: { type: "string", minLength: 1 },
                },
                required: ["displayName"],
                errorMessage: {
                  properties: {
                    displayName: t("management:newOrg.name.requiredError"),
                  },
                },
              }}
              errors={{
                displayName: {
                  message: conflictError!,
                  visible: !!conflictError,
                },
              }}
              onSubmit={(values, actions) => {
                this._newOrgStore.resetState();
                const newOrg: IOrganization = {
                  name: undefined as any,
                  display_name: trim(values["displayName"]),
                };
                this._newOrgStore.create(newOrg);
                actions.setSubmitting(false);
              }}
              render={({ isSubmitting, handleChange, handleBlur, handleSubmit, values, errors }) => (
                <Page
                  aria-label="Add new organization"
                  role="form"
                  supportsMobile
                  data-test-id="create-new-org-page"
                  tagName="form"
                  onSubmit={handleSubmit}
                  header={<PageHeader title={t("management:org.addNew")} />}
                  footer={
                    isMobile ? (
                      <FooterArea>
                        <ButtonContainer fullWidth equalize>
                          <PrimaryButton
                            type="submit"
                            disabled={isSubmitting}
                            progress={this._newOrgStore.isPending}
                            alignLeft={false}
                          >
                            {this._newOrgStore.isPending
                              ? t("management:newOrg.button.pending")
                              : t("management:newOrg.button.action")}
                          </PrimaryButton>
                        </ButtonContainer>
                      </FooterArea>
                    ) : (
                      <FooterArea alignRight>
                        <PrimaryButton type="submit" disabled={isSubmitting} progress={this._newOrgStore.isPending}>
                          {this._newOrgStore.isPending ? t("management:newOrg.button.pending") : t("management:newOrg.button.action")}
                        </PrimaryButton>
                      </FooterArea>
                    )
                  }
                >
                  {notification && notification.message ? (
                    <PageNotification type={notification.type}>{notification.message}</PageNotification>
                  ) : null}
                  <Grid rowSpacing={GridSpacing.XSmall}>
                    <RowCol>
                      <Autofocus focus={!!errors["displayName"]}>
                        <Input
                          // Form Props
                          type="text"
                          name="displayName"
                          required
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values["displayName"]}
                          // Input Props
                          className={styles["name"]}
                          size={InputSize.Large}
                          label={t("management:newOrg.name.label")}
                          placeholder={t("management:newOrg.name.placeholder")}
                          invalid={!!errors["displayName"]}
                          maxLength={255}
                          // Validation Props
                          autoCorrect="none"
                          autoCapitalize="none"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </Autofocus>
                    </RowCol>
                    {errors["displayName"] ? (
                      <RowCol>
                        <LiveRegion role="alert">
                          <ErrorBlock className={styles.errorLabel}>{errors["displayName"].message}</ErrorBlock>
                        </LiveRegion>
                      </RowCol>
                    ) : null}
                  </Grid>
                </Page>
              )}
            />
          );
        }
      }
    )
  )
);
