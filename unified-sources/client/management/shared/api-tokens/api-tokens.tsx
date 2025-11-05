import * as React from "react";
import { observer, Provider } from "mobx-react";
import {
  ButtonSize,
  ButtonContainer,
  TextCell,
  Dialog,
  Input,
  Page,
  PrimaryButton,
  PanelOutlet,
  RowHeight,
  SummaryCell,
  Table,
  Row,
  PageHeader,
  MessageBar,
  IconName,
  isMobileBrowser,
  LiveRegion,
} from "@root/shared";
import { layoutStore } from "@root/stores";
import { APITokensUIStore } from "./api-tokens-ui-store";
import { userApiTokenStore, appApiTokenStore, SerializedAPIToken } from "@root/data/management";
import { appStore } from "@root/stores";

const styles = require("./api-tokens.scss");
const noApiTokenImg = require("../../orgs/images/no-apps.svg");

type PrincipalType = "app" | "user";

export interface ApiTokensProps {
  principalType: PrincipalType;
  pageTitle: string;
  emptyMessage: string;
  toNewPath: string;
}

@observer
export class ApiTokens extends React.Component<ApiTokensProps, {}> {
  private apiTokensUIStore: APITokensUIStore;

  private apiTokenColumns = [
    {
      title: "Description",
      width: 0.7,
      property: "id",
    },
    {
      title: "Access",
      width: 0.3,
      property: "scope",
    },
  ];

  constructor(props: ApiTokensProps) {
    super(props);

    if (props.principalType === "app") {
      const creatableScopes: SerializedAPIToken["scope"] = ["viewer"];
      // only allow app managers to create Full Access app API tokens
      if (appStore.hasAnyCollaboratorRole(["manager"])) {
        creatableScopes.unshift("all");
      }
      this.apiTokensUIStore = new APITokensUIStore(appApiTokenStore, creatableScopes);
    } else {
      this.apiTokensUIStore = new APITokensUIStore(userApiTokenStore, ["all", "viewer"]);
    }

    this.apiTokensUIStore.fetch();
  }

  public render() {
    const { pageTitle, emptyMessage, toNewPath } = this.props;
    const { tokens, deleteTokens, isFetching, notification, isDialogVisible, dismissDialog, newToken } = this.apiTokensUIStore;
    const { isMobile } = layoutStore;
    return (
      <Page
        data-test-id="api-tokens-page"
        supportsMobile={isMobileBrowser}
        header={<PageHeader title={pageTitle} loading={isFetching} />}
      >
        {notification ? <MessageBar type={notification.type}>{notification.message}</MessageBar> : null}
        <PanelOutlet>
          {this.props.children ? <Provider uiStore={this.apiTokensUIStore}>{this.props.children}</Provider> : null}
        </PanelOutlet>
        <div>
          <Table
            title="Tokens"
            titleAriaHidden={false}
            headerCheckboxAriaLabel={pageTitle}
            columns={this.apiTokenColumns}
            toolbar={
              <LiveRegion aria-live="polite">
                <PrimaryButton
                  size={ButtonSize.Small}
                  to={toNewPath}
                  data-test-id="new-api-token-button"
                  icon={isMobile && isMobileBrowser ? IconName.Add : undefined}
                  aria-label={isMobile && isMobileBrowser ? "Register device" : undefined}
                >
                  {!isMobile || !isMobileBrowser ? "New API token" : null}
                </PrimaryButton>
              </LiveRegion>
            }
            eventualRowCount={tokens.length || 4}
            data={tokens}
            rowHeight={RowHeight.MultiLine}
            selectable
            selectedItemsString={(count) => `${count} ${count === 1 ? "API token" : "API tokens"} selected`}
            renderSelectionToolbar={(selectedRows) => (
              <LiveRegion aria-live="polite">
                <PrimaryButton
                  size={ButtonSize.Small}
                  onClick={() => deleteTokens(Array.from(selectedRows))}
                  data-test-id="delete-api-token-button"
                >
                  Delete
                </PrimaryButton>
              </LiveRegion>
            )}
            renderRow={(item, props) => {
              return (
                <Row {...props} key={item.id} label={item.description}>
                  <SummaryCell title={item.description} subtitle={isMobile ? item.humanReadableScope : undefined} />
                  <TextCell>{item.humanReadableScope}</TextCell>
                </Row>
              );
            }}
            renderPlaceholderRow={(props) => {
              return (
                <Row {...props}>
                  <SummaryCell skeleton title="title" subtitle={isMobile ? "subtitle" : undefined} />
                  <TextCell skeleton />
                </Row>
              );
            }}
            error={
              this.apiTokensUIStore.isEmpty ? (
                <div className={styles["no-api-token-wrapper"]}>
                  <img alt="" role="presentation" src={noApiTokenImg} />
                  <div className={styles.message}>Nothing to see here.</div>
                  <div className={styles["sub-message"]}>{emptyMessage}</div>
                </div>
              ) : null
            }
          />
          <Dialog
            title="Here’s your API token."
            className={styles["dialog"]}
            visible={isDialogVisible}
            onRequestClose={() => undefined}
            data-test-id="api-token-created-dialog"
          >
            <header id="your-api-token">
              <h3>Here’s your API token.</h3>
            </header>
            <p>Please copy your token and keep it secret. You won’t be able to see it again.</p>
            <Input
              aria-labelledby="your-api-token"
              type="text"
              value={newToken ? newToken.apiToken : ""}
              readOnly
              copyable
              placeholder="API Token"
            />
            <ButtonContainer right className={styles["dialog-button"]}>
              <PrimaryButton onClick={dismissDialog}>Close</PrimaryButton>
            </ButtonContainer>
          </Dialog>
        </div>
      </Page>
    );
  }
}
