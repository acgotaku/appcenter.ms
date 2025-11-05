import * as React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { DeleteDistributionGroupDialog } from "./dialog/delete-distribution-group-dialog";
import { DistributionGroupSettingsStrings } from "../../../../../distribute/utils/strings";
import { DistributionGroupSettingsUIStore } from "./distribution-group-settings-ui-store";
import {
  Page,
  TopBar,
  Modalify,
  Text,
  TextColor,
  Size,
  PrimaryButton,
  BottomBar,
  LinkButton,
  Input,
  PageNotification,
} from "@root/shared";
import { ConfigureWell } from "../../../../../distribute/distribution-group-details/distribution-group-settings/distribution-group-settings";
const styles = require("./distribution-group-settings.scss");

export interface DistributionGroupSettingsProps extends RouteComponentProps<any, any> {}

export const DistributionGroupSettings = Modalify(
  withTranslation(["common", "distribute"])(
    observer(
      class DistributionGroupSettings extends React.Component<DistributionGroupSettingsProps & WithTranslation, {}> {
        private distributionGroupSettingsUiStore!: DistributionGroupSettingsUIStore;

        public UNSAFE_componentWillMount() {
          const { org_name, group_name, tab } = this.props.params;
          this.distributionGroupSettingsUiStore = new DistributionGroupSettingsUIStore(org_name, group_name, tab);
        }

        public UNSAFE_componentWillReceiveProps(nextProps) {
          const { org_name, group_name, tab } = this.props.params;
          if (nextProps.params["group_name"] !== group_name) {
            this.distributionGroupSettingsUiStore = new DistributionGroupSettingsUIStore(
              org_name,
              nextProps.params["group_name"],
              tab
            );
          }
        }

        public render() {
          const { t } = this.props;
          const { org_name } = this.props.params;
          const {
            confirmDeleteDistributionGroup,
            deleteDistributionGroup,
            isDeleting,
            isFetching,
            isUpdating,
            distributionGroup,
            updateNotification,
            name,
            onNameChange,
            isPublicGroup,
            onIsPublicToggleChanged,
            applyButtonDisabled,
            updateSettings,
          } = this.distributionGroupSettingsUiStore;
          const noDistributionGroupFound = !isFetching && !isDeleting && !isUpdating && !distributionGroup;
          const needsSkeleton = isFetching || noDistributionGroupFound;

          return (
            <Page data-test-id="edit-shared-group-page">
              <TopBar
                title={needsSkeleton ? t("distribute:groups.deleteGroup.loadingTitle") : t("distribute:groups.deleteGroup.title")}
              ></TopBar>
              {updateNotification ? (
                <PageNotification type={updateNotification.type}>{updateNotification.message}</PageNotification>
              ) : null}
              <div>
                <Input
                  data-test-id="edit-shared-group-name-input"
                  disabled={name === undefined}
                  value={name || ""}
                  onChange={onNameChange}
                  placeholder={t("distribute:groups.newGroup.placeholder")}
                />
                <div className={styles.groupId}>
                  <Text size={Size.Small} color={TextColor.Secondary} bold>
                    {DistributionGroupSettingsStrings.Id + ": "}
                  </Text>
                  <Text size={Size.Small} color={TextColor.Secondary}>
                    {distributionGroup ? distributionGroup.id : undefined}
                  </Text>
                </div>

                <ConfigureWell
                  active={isPublicGroup}
                  disabled={isFetching}
                  title={t("distribute:groupSettings.publicDistributionGroup")}
                  onChanged={onIsPublicToggleChanged}
                  data-test-id="edit-shared-group-is-public-configure-well"
                />

                <DeleteDistributionGroupDialog
                  group={distributionGroup}
                  organizationName={org_name}
                  onConfirmDeleteGroup={deleteDistributionGroup}
                  progress={isDeleting}
                />
              </div>
              <BottomBar className={styles.buttons}>
                <LinkButton data-test-id="delete-button" danger onClick={confirmDeleteDistributionGroup} disabled={isFetching}>
                  {t("distribute:groups.deleteGroup.button")}
                </LinkButton>
                <PrimaryButton
                  data-test-id="done-button"
                  disabled={isFetching || applyButtonDisabled}
                  onClick={updateSettings}
                  progress={isUpdating}
                >
                  {isUpdating ? t("common:button.saving") : t("common:button.done")}
                </PrimaryButton>
              </BottomBar>
            </Page>
          );
        }
      }
    )
  )
);
