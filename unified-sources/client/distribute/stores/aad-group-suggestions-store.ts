import { observable, action } from "mobx";
import * as memoize from "memoizee";
import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore, ExternalDataState } from "@root/shared/external-data";
import { IUser } from "@lib/common-interfaces";
import { Organization } from "@root/data/shell/models";
import { appStore, organizationStore } from "@root/stores";
import { GROUP_OWNER_TYPE } from "@root/data/distribute";
import { portalServer } from "@root/lib/http";

export class AadGroupSuggestionsStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<IUser[]> {
  @observable
  public redirecting: boolean;
  private orgName: string;

  constructor(orgName: string) {
    super();

    this.state = ExternalDataState.Loaded;
    this.redirecting = false;
    this.orgName = orgName;
  }

  @action
  public searchGroups(term: string): Promise<IUser[]> {
    if (!this.orgName) {
      return Promise.resolve([]);
    }
    this.redirecting = false;

    return this.load(
      portalServer.get<IUser[]>(`/org/:orgName/aad/group_suggestions`, {
        params: {
          term: term,
          orgName: this.orgName,
        },
        noBifrostToken: true,
      })
    );
  }

  @action
  public clearFailureState() {
    this.state = ExternalDataState.Loaded;
  }
}

const getAADGroupSuggestionStoreFromOrg = memoize(
  (organization: Organization) => {
    return new Promise<AadGroupSuggestionsStore | undefined>((resolve) => {
      organization.fetchAzureTenant().onSuccess(() => {
        if (organization.azureTenant.tenantId) {
          resolve(new AadGroupSuggestionsStore(organization.name));
        } else {
          resolve(undefined);
        }
      });
    });
  },
  {
    max: 10,
    normalizer: (args) => {
      return args[0].id;
    },
  }
);

export const getAADGroupSuggestionStore = async (organizationName?: string): Promise<AadGroupSuggestionsStore | undefined> => {
  if (!organizationName && (!appStore.app || appStore.app.owner.type !== GROUP_OWNER_TYPE.ORG)) {
    return undefined;
  }

  const orgName = organizationName ? organizationName : appStore.app.owner.name;
  const iOrganization = organizationStore.find(orgName);
  const organization = new Organization(iOrganization);
  return getAADGroupSuggestionStoreFromOrg(organization);
};
