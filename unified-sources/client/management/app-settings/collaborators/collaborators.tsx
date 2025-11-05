import * as React from "react";
import { observer } from "mobx-react";
import { RouteComponentProps } from "react-router";
import {
  Panelify,
  Page,
  Table,
  Row,
  SummaryCell,
  Cell,
  ClickableIcon,
  RowHeight,
  Gravatar,
  Column,
  InputVariant,
  IconName,
  ConfirmationDialog,
  Autocomplete,
  Action,
  AvatarItem,
  TeamIcon,
  Input,
  OrganizationIcon,
  IconItem,
  Button,
  ButtonSize,
  PageHeader,
} from "@root/shared";
import { Grid, RowCol, GridSpacing } from "@root/shared/grid";
import { MemberRoleSelect } from "../../shared/member-role-select/member-role-select";
import { CollaboratorsUIStore, Collaborator, AvailableCollaborator } from "./collaborators-ui-store";
import { appStore } from "@root/stores";
import { withTranslation, WithTranslation } from "react-i18next";
import { AutocompleteComboboxWrapper } from "@root/shared/autocomplete/autocomplete";
const styles = require("./collaborators.scss");

const actionsColumn = {
  title: "",
  width: "100px",
  ariaLabel: "Actions",
};

export const Collaborators = Panelify(
  withTranslation(["common", "management"])(
    observer(
      class Collaborators extends React.Component<RouteComponentProps<any, any> & WithTranslation, {}> {
        private collaboratorsUIStore!: CollaboratorsUIStore;

        private columns: Column[] = [
          {
            title: this.props.t("management:appCollaborators.peopleColumn"),
            width: 0.7,
          },
          {
            title: this.props.t("access.role"),
            width: 0.3,
          },
        ];

        private allColumns: Column[] = [...this.columns, actionsColumn];

        public UNSAFE_componentWillMount() {
          this.handlePropsChange(this.props, true);
        }

        public UNSAFE_componentWillReceiveProps(nextProps) {
          this.handlePropsChange(nextProps);
        }

        public componentWillUnmount() {
          this.collaboratorsUIStore.dispose();
        }

        public handlePropsChange(props: RouteComponentProps<any, any>, isMounting: boolean = false) {
          const { params } = props;
          const { app_name, owner_name, owner_type } = params;
          if (isMounting || appStore.hasAppChanged(owner_type, owner_name, app_name)) {
            if (this.collaboratorsUIStore) {
              this.collaboratorsUIStore.dispose();
            }
            this.collaboratorsUIStore = new CollaboratorsUIStore();
          }
        }

        public render() {
          const {
            userCanEdit,
            userCanDelete,
            inviteUser,
            email,
            people,
            placeholderRowCount,
            finishRemovingCollaborator,
            cancelRemovingCollaborator,
            typeEmail,
            selectAutocompletedCollaborator,
            removeUserWarningIsVisible,
            canUpdateRole,
            updateRole,
            availableCollaborators,
            isOrgAdmins,
            getRole,
            isTeam,
            isCollaboratorCurrentUser,
          } = this.collaboratorsUIStore;
          const { t } = this.props;
          const { app } = appStore;
          const tableTitle = appStore.app.isOrgApp
            ? this.props.t("management:appCollaborators.tableTitle")
            : this.props.t("access.collaborator", { count: 0 });

          const showDeleteColumn = people.some((collaborator) => userCanDelete(collaborator));

          if (showDeleteColumn) {
            this.columns = this.allColumns;
          }

          return (
            <Page data-test-id="app-settings-collaborators" header={<PageHeader title={t("management:appCollaborators.title")} />}>
              <div>
                <Grid rowSpacing={GridSpacing.Medium}>
                  {userCanEdit ? (
                    <RowCol>
                      <form onSubmit={inviteUser}>
                        <Autocomplete
                          className={styles.autocomplete}
                          value={email}
                          items={availableCollaborators}
                          onSelectItem={selectAutocompletedCollaborator}
                          searchOptions={{
                            keys: [
                              "display_name",
                              "email",
                              /**
                          This camelCase `displayName` exists because we don't deserialize User response from the API and we do deserialize Team response.
                          End game for this would be to:
                          - Create a heirarchy for the common "entities" in App Center namely (user, app, org, team).
                          - Refactor the legacy (user, app, org) stores to be consistent with the new stores.
                        */
                              "displayName",
                              "name",
                            ],
                            findAllMatches: true,
                            threshold: 0.4,
                            distance: 100,
                            maxPatternLength: 32,
                            minMatchCharLength: 1,
                          }}
                          renderItem={(collaborator: AvailableCollaborator) => (
                            <Action text={collaborator.name!} key={collaborator.name || collaborator.id}>
                              {isTeam(collaborator) ? (
                                <IconItem title={collaborator.displayName!} icon={<TeamIcon />} />
                              ) : (
                                <AvatarItem email={collaborator.email!} name={collaborator.display_name!} />
                              )}
                            </Action>
                          )}
                        >
                          <AutocompleteComboboxWrapper>
                            <Input
                              aria-label={
                                app.isOrgApp ? t("management:appCollaborators.add") : t("management:common.collaborators.invite")
                              }
                              variant={InputVariant.Card}
                              icon={IconName.AddUser}
                              placeholder={
                                app.isOrgApp ? t("management:appCollaborators.add") : t("management:common.collaborators.invite")
                              }
                              autoFocus
                              autoCorrect="none"
                              autoCapitalize="none"
                              autoComplete="off"
                              spellCheck={false}
                              value={email}
                              onChange={typeEmail}
                              data-test-id="collaborators-email-input"
                            />
                          </AutocompleteComboboxWrapper>
                        </Autocomplete>
                      </form>
                    </RowCol>
                  ) : null}
                  <RowCol>
                    <Table.Observer
                      title={tableTitle}
                      columns={this.columns}
                      data={people}
                      rowHeight={RowHeight.MultiLine}
                      eventualRowCount={placeholderRowCount}
                      renderRow={(collaborator, props) => {
                        const title = isOrgAdmins(collaborator)
                          ? t("management:appCollaborators.admins", { owner: appStore.app.owner })
                          : isTeam(collaborator)
                          ? collaborator.displayName
                          : collaborator.display_name || collaborator.name;
                        const subtitle = isOrgAdmins(collaborator) || isTeam(collaborator) ? null : collaborator.email;
                        const label = isTeam(collaborator) ? collaborator.displayName : collaborator.email;
                        const role = getRole(collaborator);
                        return (
                          <Row data-test-id={`app-settings-collaborators-${label}`} {...props} label={label}>
                            <SummaryCell
                              data-test-id="app-settings-collaborator-summary-cell"
                              icon={(() => {
                                {
                                  /*
                              Long term we need to have a base class that represents the concept of a "entity" that can own/be added to apps
                              This will enable us to write components which figure out which icon to display given the "entity".
                          */
                                }
                                if (isTeam(collaborator)) {
                                  return <TeamIcon />;
                                } else if (isOrgAdmins(collaborator)) {
                                  return <OrganizationIcon organization={collaborator} size={30} />;
                                } else {
                                  return (
                                    <div className={styles.collaboratorIcon}>
                                      <Gravatar email={collaborator.email} size={30} alt={collaborator.email} />
                                    </div>
                                  );
                                }
                              })()}
                              title={title}
                              subtitle={subtitle === title ? null : subtitle}
                            />
                            <Cell.Observer>
                              {() =>
                                appStore.app.owner.name === collaborator.name || !userCanEdit || isOrgAdmins(collaborator) ? (
                                  <div>{t(`app.role.${role}.name`)}</div>
                                ) : (
                                  <MemberRoleSelect
                                    data-test-id="app-settings-role-select"
                                    showDescriptions
                                    disabled={canUpdateRole(collaborator)}
                                    role={role!}
                                    onChange={(role) => updateRole(collaborator, role)}
                                  />
                                )
                              }
                            </Cell.Observer>
                            {showDeleteColumn && (
                              <Cell className={styles.delete}>
                                {isCollaboratorCurrentUser(collaborator) ? (
                                  appStore.ownerName !== collaborator.name ? (
                                    <Button size={ButtonSize.XSmall} onClick={this.handleDeleteCollaborator(collaborator)}>
                                      Leave
                                    </Button>
                                  ) : null
                                ) : (
                                  <ClickableIcon
                                    data-test-id="app-settings-delete-collaborator"
                                    icon={IconName.Delete}
                                    onClick={this.handleDeleteCollaborator(collaborator)}
                                    className={styles.removeButton}
                                  />
                                )}
                              </Cell>
                            )}
                          </Row>
                        );
                      }}
                      renderPlaceholderRow={(props) => (
                        <Row {...props}>
                          <SummaryCell skeleton icon={IconName.Default} title="loading" subtitle="loading" />
                          <Cell skeleton />
                        </Row>
                      )}
                    />
                  </RowCol>
                </Grid>
                <ConfirmationDialog
                  visible={removeUserWarningIsVisible}
                  confirmButton={t("management:appCollaborators.removeDialog.button")}
                  danger={true}
                  onConfirm={finishRemovingCollaborator}
                  cancelButton={t("button.cancel")}
                  onCancel={cancelRemovingCollaborator}
                  title={t("management:appCollaborators.removeDialog.title")}
                  description={t("management:appCollaborators.removeDialog.message", { app: appStore.app })}
                />
              </div>
            </Page>
          );
        }

        private handleDeleteCollaborator = (collaborator: Collaborator) => () => {
          this.collaboratorsUIStore.startRemovingCollaborator(collaborator);
        };
      }
    )
  )
);
