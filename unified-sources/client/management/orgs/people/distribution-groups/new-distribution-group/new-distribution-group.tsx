import * as React from "react";
import { RouteComponentProps } from "react-router";
import { withTranslation, WithTranslation } from "react-i18next";
import { observer } from "mobx-react";
import {
  Page,
  Modalify,
  PanelInjectedProps,
  TopBar,
  Grid,
  GridRow as Row,
  GridCol as Col,
  GridSpacing,
  BottomBar,
  PrimaryButton,
  InputSize,
  PanelOutlet,
  Formsy,
} from "@root/shared";
import { VALIDATION_ERRORS, VALIDATIONS } from "../../../../utils/formsy/validations";
import { NewDistributionGroupUIStore } from "./new-distribution-group-ui-store";
type NewDistributionGroupProps = PanelInjectedProps & RouteComponentProps<any, any> & WithTranslation;

const styles = require("./new-distribution-group.scss");

export const NewDistributionGroup = Modalify(
  withTranslation(["common", "distribute"])(
    observer(
      class NewDistributionGroup extends React.Component<NewDistributionGroupProps, {}> {
        private newDistributionGroupForm;
        private newDistributionGroupUiStore = new NewDistributionGroupUIStore();

        public render() {
          const { t } = this.props;
          const { isCreating, errorMessage } = this.newDistributionGroupUiStore;
          return (
            <Page supportsMobile data-test-id="create-shared-group-page">
              <TopBar title={t("distribute:groups.newGroup.title")} className={styles.topBar} />
              <Grid rowSpacing={GridSpacing.XLarge}>
                <Row>
                  <Col width={12}>
                    <Formsy.Form
                      ref={(ref: any) => {
                        this.newDistributionGroupForm = ref;
                      }}
                      onValidSubmit={this.onSubmit}
                    >
                      <Formsy.Input
                        label={t("distribute:groups.newGroup.label")}
                        type="text"
                        name="name"
                        size={InputSize.Normal}
                        defaultValue={null}
                        placeholder={t("distribute:groups.newGroup.placeholder")}
                        autoCorrect="none"
                        autoCapitalize="none"
                        autoComplete="off"
                        spellCheck="false"
                        isRequired
                        requiredError={t("distribute:groups.newGroup.requiredError")}
                        validations={VALIDATIONS.DISTRIBUTION_GROUP_DISPLAY_NAME}
                        validationErrors={VALIDATION_ERRORS.DISTRIBUTION_GROUP_DISPLAY_NAME}
                        onChange={this.clearErrorMessage}
                        data-test-id="new-distribution-group-input-name"
                      />
                    </Formsy.Form>
                  </Col>
                </Row>
              </Grid>
              <PanelOutlet>{this.props.children}</PanelOutlet>
              <BottomBar alignRight>
                {errorMessage && <div className={styles["error-message"]}>{errorMessage}</div>}
                <PrimaryButton
                  type="submit"
                  progress={isCreating}
                  data-test-id="new-shared-group-submit"
                  onClick={this.onCreateDistributionGroupClick}
                >
                  {isCreating ? t("distribute:groups.newGroup.creating") : t("distribute:groups.newGroup.create")}
                </PrimaryButton>
              </BottomBar>
            </Page>
          );
        }

        private onSubmit = () => {
          const { org_name } = this.props.params;
          this.newDistributionGroupUiStore.create(org_name, this.newDistributionGroupForm.model.name);
        };

        private onCreateDistributionGroupClick = () => {
          this.newDistributionGroupForm.submit();
        };

        private clearErrorMessage = () => {
          this.newDistributionGroupUiStore.setErrorMessage(null as any);
        };
      }
    )
  )
);
