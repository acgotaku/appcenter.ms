import * as React from "react";
import { observer } from "mobx-react";
import { Toggle, Text, Formsy, TextColor, Paragraph, Space } from "@root/shared";
import { Grid, RowCol, GridSpacing, Row, Col } from "@root/shared/grid";
import { Title, Size } from "@root/shared/typography";
import { withTranslation, WithTranslation } from "react-i18next";
import { BugTrackerSettingsUIStore } from "./bugtracker-settings-ui-store";
import { BugTracker } from "@root/data/management";

const styles = require("./bugtracker-settings.scss");

export interface BugTrackerSettingsProps {
  store: BugTrackerSettingsUIStore;
  disabled: boolean;
}

export const BugTrackerSettings = withTranslation(["common", "management"])(
  observer(
    class BugTrackerSettings extends React.Component<BugTrackerSettingsProps & WithTranslation, {}> {
      public render() {
        const { store, disabled, t } = this.props;
        const { bugTracker } = store;

        return (
          <Formsy.Form key="bugTrackerForm">
            <Grid rowSpacing={GridSpacing.Large}>
              <Row>
                <Col width={10}>
                  <Title id="autocreate-label" size={Size.Small}>
                    {t("management:appServices.bugTracker.autoCreateTicket")}
                  </Title>
                  <Text id="autocreate-desc" size={Size.Medium} color={TextColor.Secondary}>
                    {t("management:appServices.bugTracker.autoCreateTicketDescription")}
                  </Text>
                </Col>
                <Col width={2}>
                  <Toggle
                    checked={store.autoCreateTicket || false}
                    disabled={disabled}
                    onChange={(e) => store.setAutoCreateTicket(e.target.checked)}
                    aria-labelledby="autocreate-label"
                    aria-describedby="autocreate-desc"
                  >
                    {store.autoCreateTicket ? t("state.on") : t("state.off")}
                  </Toggle>
                </Col>
              </Row>
              <RowCol>
                <Grid rowSpacing={GridSpacing.Medium}>
                  {store.supportsVSTSParams ? (
                    <>
                      <RowCol>
                        <Formsy.Input
                          name="area"
                          label={t("management:appServices.bugTracker.area")}
                          value={bugTracker.settings!.vstsAreaPath || ""}
                          disabled={disabled || !store.autoCreateTicket}
                          placeholder={t("management:appServices.bugTracker.areaPlaceholder")}
                          onChange={(e) => store.setArea(e.target.value)}
                          validations={BugTracker.areaValidations}
                          validationErrors={store.areaValidationErrors}
                        />
                      </RowCol>
                      <RowCol>
                        <Grid rowSpacing={GridSpacing.XXSmall}>
                          <RowCol>
                            <Formsy.TextArea
                              name="defaultPayload"
                              label={t("management:appServices.bugTracker.optionalDefaultPayload")}
                              aria-describedby="payload-desc"
                              className={styles.textarea}
                              value={bugTracker.settings!.vstsDefaultPayload || ""}
                              disabled={disabled || !store.autoCreateTicket}
                              onChange={(e) => store.setDefaultPayload(e.target.value)}
                              validations={BugTracker.payloadValidations}
                              validationErrors={store.payloadValidationErrors}
                            />
                          </RowCol>
                          <RowCol>
                            <Paragraph id="payload-desc" size={Size.Medium}>
                              <Text size={Size.Small}>{t("management:appServices.bugTracker.defaultPayloadPrimaryDescription")}</Text>
                              <Text size={Size.Small} color={TextColor.Secondary} className={styles["text-sample"]}>
                                {'{"System.IterationPath": "Area\\\\Iteration 1", "System.AssignedTo": "Fabrikam"}'}
                              </Text>
                            </Paragraph>
                            <Text size={Size.Small} color={TextColor.Secondary} spaceAbove={Space.Small} tagName="div">
                              <a href="https://docs.microsoft.com/en-us/vsts/integrate/#Getaworkitemtype" target="_blank">
                                {t("management:appServices.bugTracker.defaultPayloadLinkText")}
                              </a>
                            </Text>
                          </RowCol>
                        </Grid>
                      </RowCol>
                    </>
                  ) : null}
                </Grid>
              </RowCol>
            </Grid>
          </Formsy.Form>
        );
      }
    }
  )
);
