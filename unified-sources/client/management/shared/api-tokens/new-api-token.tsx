import * as React from "react";
import { observer, inject } from "mobx-react";
import { RouteComponentProps } from "react-router";
import { Formsy, Modalify, Page, PrimaryButton, Radio, PageHeader, FooterArea, MessageBar } from "@root/shared";

import { Grid, Col, Row, GridSpacing } from "@root/shared/grid";
import { APIToken } from "@root/data/management";
import { APITokensUIStore } from "./api-tokens-ui-store";
import { VALIDATION_ERRORS as ManagementValidationErrors, VALIDATIONS as ManagementValidations } from "../../utils/formsy/validations";
import * as styles from "./new-api-token.scss";

@Modalify
@inject("uiStore")
@observer
export class NewApiToken extends React.Component<RouteComponentProps<any, any> & { uiStore: APITokensUIStore }, {}> {
  private newApiTokenForm: any;

  private renderNotifications(): JSX.Element | undefined {
    if (this.props.uiStore.creationNotification) {
      return (
        <MessageBar type={this.props.uiStore.creationNotification.type}>{this.props.uiStore.creationNotification.message}</MessageBar>
      );
    }
  }

  public fetchAppScope() {
    // TODO: once backend support, fetch list of apps the user owns and append to this.appScope.
    // This is to be done in Phase 3 when we support app based scope. Placeholder for now.
  }

  public UNSAFE_componentWillMount() {
    this.props.uiStore.beginCreatingToken();
  }

  public render() {
    const { newToken, formValidationErrors, isCreating, updateToken, finishCreatingToken, creatableScopes } = this.props.uiStore;
    return (
      <Page
        data-test-id="new-api-token-page"
        supportsMobile
        role="form"
        aria-label="New API token"
        header={<PageHeader title={"New API token"} className={styles.topBar} />}
        footer={
          <FooterArea alignRight>
            <PrimaryButton
              type="submit"
              progress={isCreating}
              onClick={() => this.newApiTokenForm.submit()}
              data-test-id="add-token-button"
            >
              {isCreating ? "Adding" : "Add"} new API token
            </PrimaryButton>
          </FooterArea>
        }
      >
        {this.renderNotifications()}
        <Formsy.Form
          ref={(ref) => (this.newApiTokenForm = ref)}
          onValidSubmit={() => finishCreatingToken()}
          validationErrors={formValidationErrors}
        >
          <Grid tabindex={0} bordered rowSpacing={GridSpacing.XLarge}>
            <Row>
              <Col width={12}>
                <Formsy.Input
                  label="Description:"
                  type="text"
                  name="description"
                  placeholder="Enter a brief description"
                  value={newToken.description || ""}
                  onChange={(e) => updateToken({ description: e.target.value })}
                  isRequired
                  requiredError="Token description is required."
                  autoCorrect="none"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  data-test-id="description-input"
                  validations={ManagementValidations.API_TOKEN_DESCRIPTION}
                  validationErrors={ManagementValidationErrors.API_TOKEN_DESCRIPTION}
                />
              </Col>
            </Row>
            <Row top>
              <Col width={3}>
                <label id="access-label" className={styles.required}>
                  Access:
                </label>
              </Col>
              <Col width={9}>
                <Formsy.RadioGroup
                  aria-labelledby="access-label"
                  name="scope"
                  value={newToken.scope || ""}
                  onChange={(value) => updateToken({ scope: value })}
                  isRequired
                  requiredError="The access field is required."
                  data-test-id="access-radio-group"
                >
                  {creatableScopes.map((key) => (
                    <Radio key={key} value={key} isRequired>
                      {APIToken.scopes[key]}
                    </Radio>
                  ))}
                </Formsy.RadioGroup>
              </Col>
            </Row>
          </Grid>
        </Formsy.Form>
      </Page>
    );
  }
}
