import { computed } from "mobx";
import { ISecondaryNavigationItem } from "@root/shared";
import { t } from "@root/lib/i18n";
import { organizationStore, userStore } from "@root/stores";
import { userApiTokenStore, azureSubscriptionStore, devicesStore } from "@root/data/management/stores";
import { accountsUiStore } from "./accounts/accounts-ui-store";
import { userNotificationSettingsStore } from "../app-settings/notifications/data/notifications-store";
import { APP_OWNER_TYPES } from "@lib/common-interfaces";
import { externalCredentialStore } from "@root/data/shell/stores/external-credentials-store";
import { externalCredentialType } from "@root/data/shell/models";
import { invitationStore } from "@root/data/management/stores/invitation-store";
import { ThemeOptions, userInterfaceSettingsStore } from "../stores/settings/user-interface-settings-store";

export class SettingsUIStore {
  @computed get secondaryNavItems(): ISecondaryNavigationItem[] {
    const navItems: ISecondaryNavigationItem[] = [];

    navItems.push({
      route: "/settings/profile",
      title: t("management:userProfileSettings.title"),
    });

    navItems.push({
      route: "/settings/user-interface",
      title: t("management:userInterface.title"),
    });

    if (organizationStore.isCurrentUserAnAdminOfFirstPartyOrg() || userStore.currentUser.isFirstPartyUser) {
      navItems.push({
        route: "/settings/billing",
        title: t("management:billingPlans.title"),
      });
    }

    navItems.push({
      route: "/settings/organizations",
      title: t("management:userOrgSettings.title"),
    });

    if (accountsUiStore.isAnyAccountOrCertificate || userStore.currentUser.isUserWhitelisted) {
      navItems.push({
        route: "/settings/accounts",
        title: t("management:accounts.title"),
      });
    }

    if (userStore.currentUser.isUserWhitelisted) {
      navItems.push({
        route: "/settings/devices",
        title: t("management:devices.title"),
      });
    }

    navItems.push(
      {
        route: "/settings/apitokens",
        title: t("management:userApiTokens.title"),
      },
      {
        route: "/settings/notifications",
        title: t("management:notifications.title"),
      },
      {
        route: "/settings/azure",
        title: t("management:azureSettings.title"),
      }
    );

    return navItems;
  }

  constructor() {
    const { currentUser } = userStore;
    // Start fetching all the data
    invitationStore.fetchCollection();
    externalCredentialStore.fetchCollection({
      credentialType: externalCredentialType.Credentials + "," + externalCredentialType.Certificate,
    });
    userApiTokenStore.fetchCollection();
    devicesStore.fetchCollection();
    userNotificationSettingsStore.fetch();
    azureSubscriptionStore.fetchForRelationship("userId", currentUser.id, { userId: currentUser.id, ownerType: APP_OWNER_TYPES.USER });
  }

  @computed get isLoading(): boolean {
    return (
      invitationStore.isFetchingCollection &&
      externalCredentialStore.isFetchingCollection &&
      userApiTokenStore.isFetchingCollection &&
      devicesStore.isFetchingCollection &&
      userNotificationSettingsStore.isPending &&
      this.isFetchingSubscriptions
    );
  }

  @computed private get isFetchingSubscriptions() {
    return azureSubscriptionStore.isFetchingRelationship(`userId-${userStore.currentUser.id}`);
  }

  @computed private get fetchingSubscriptionsFailed() {
    return azureSubscriptionStore.relationshipsFetchFailed(`userId-${userStore.currentUser.id}`);
  }

  @computed get appleAccountsCount(): number | undefined {
    return !externalCredentialStore.isFetchingCollection && !externalCredentialStore.collectionFetchFailed
      ? accountsUiStore.appleAccounts.length
      : undefined;
  }

  @computed get gitlabAccountsCount(): number | undefined {
    return !externalCredentialStore.isFetchingCollection && !externalCredentialStore.collectionFetchFailed
      ? accountsUiStore.gitlabAccounts.length
      : undefined;
  }

  @computed get certificatesCount(): number | undefined {
    return !externalCredentialStore.isFetchingCollection && !externalCredentialStore.collectionFetchFailed
      ? accountsUiStore.certificates.length
      : undefined;
  }

  @computed get isAnyAccountOrCertificate(): boolean {
    return (
      !externalCredentialStore.isFetchingCollection &&
      !externalCredentialStore.collectionFetchFailed &&
      (accountsUiStore.appleAccounts.length > 0 ||
        accountsUiStore.gitlabAccounts.length > 0 ||
        accountsUiStore.certificates.length > 0)
    );
  }

  @computed get apiTokenCount(): number | undefined {
    return !userApiTokenStore.isFetchingCollection && !userApiTokenStore.collectionFetchFailed
      ? userApiTokenStore.resources.length
      : undefined;
  }

  @computed get devicesCount(): number | undefined {
    return !devicesStore.isFetchingCollection && !devicesStore.collectionFetchFailed ? devicesStore.resources.length : undefined;
  }

  @computed get notificationsEnabled(): boolean {
    return userNotificationSettingsStore.isLoaded && userNotificationSettingsStore.data && userNotificationSettingsStore.data.enabled;
  }

  @computed get subscriptionsCount(): number | undefined {
    return !this.isFetchingSubscriptions && !this.fetchingSubscriptionsFailed
      ? userStore.currentUser.azureSubscriptions.length
      : undefined;
  }

  @computed get organizationsCount(): number {
    return (organizationStore.organizations || []).length;
  }

  @computed get orgInvitationsCount(): number | undefined {
    return !invitationStore.isFetchingCollection && !invitationStore.collectionFetchFailed
      ? invitationStore.resources.filter((invitation) => invitation.isOrganizationInvite).map((invitation) => invitation.organization)
          .length
      : undefined;
  }

  @computed get theme(): ThemeOptions {
    return userInterfaceSettingsStore.theme;
  }
}
