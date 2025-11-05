import { computed, observable } from "mobx";
import { CategoryName, ICategory, IUser, Origin } from "@lib/common-interfaces";
import { UserSettings } from "./user-settings";
import { Model } from "../../lib";
import { azureSubscriptionStore } from "../../management/stores/azure-subscription-store";
import { AzureSubscription } from "../../management/models/azure-subscription";

export class User extends Model<IUser> implements IUser {
  // Hack for making IUser assignable to IAppOwner
  // which lets App#owner be assignable to IApp['owner']
  public type = "user";

  /* Set up in controller */
  @observable public id?: string;
  @observable public display_name!: string; // Hack for making IUser assignable to IAppOwner
  @observable public email!: string; // Hack for making IUser assignable to IAppOwner
  @observable public name!: string; // Hack for making IUser assignable to IAppOwner
  @observable public avatar_url?: string;
  @observable public can_change_password?: boolean;
  @observable public admin_role?: string;
  @observable public feature_flags?: string[];
  @observable public next_nps_survey_date?: string;
  @observable public origin?: Origin;
  @observable public settings?: UserSettings;
  @observable public created_at?: string;
  @observable public is_microsoft_internal?: String;
  @observable public user_category?: ICategory;

  constructor(user: IUser) {
    // Initialize user settings
    super({ ...user, settings: new UserSettings(user.settings || {}) });
  }

  @computed
  get isCreatedInTestCloud(): boolean {
    return this.origin === Origin.TestCloud;
  }

  @computed
  get isCreatedInAppCenter(): boolean {
    return this.origin === Origin.MobileCenter || this.origin === Origin.AppCenter;
  }

  @computed
  get azureSubscriptions(): AzureSubscription[] {
    return azureSubscriptionStore.resources.filter((subscription) => subscription.userId === this.id);
  }

  @computed
  get isFirstPartyUser(): boolean {
    return this.user_category?.category_name === CategoryName.FirstParty;
  }

  @computed
  get isUserWhitelisted(): boolean {
    return !!this.user_category && [CategoryName.FirstParty, CategoryName.ThirdParty].includes(this.user_category.category_name);
  }

  public hasFeatureFlag(featureFlag: string) {
    return this.feature_flags?.includes(featureFlag);
  }
}
