import { Model } from "../../lib/model";
import { observable } from "mobx";

/* Serialized interfaces */
export interface SerializedAllAccountsAggregatedBilling {
  aggregatedBillings: SerializedBillingResource[];
}

export interface SerializedBillingResource {
  azureSubscriptionId: string;
  azureSubscriptionState: string;
  billingPlans: SerializedBillingPlans;
  isAccountDeleted: boolean;
  usage: SerializedUsage;
  id: string;
  accountType?: string;
}

export interface DeserializedBillingResource extends SerializedBillingResource {
  resourceId?: string;
  plan?: DeserializedBillingResources;
}

export interface SerializedBillingPlans {
  buildService: SerializedService;
  testService: SerializedService;
}

export interface SerializedService {
  currentBillingPeriod: SerializedServiceBillingPeriod;
  nextBillingPeriod: SerializedServiceBillingPeriod;
  canSelectTrialPlan: boolean;
  lastTrialPlanExpirationTime: string;
}

export interface SerializedServiceBillingPeriod {
  startTime: string;
  endTime: string;
  byAccount: SerializedAccount;
  byApp: null;
}

export interface SerializedAccount {
  count: number;
  plan: SerializedPlan;
}

export interface SerializedPlan {
  id?: string;
  parentId: string;
  name: string;
  service: string;
  expirationTime?: string;
  maximumDuration?: string;
  paymentSource: PaymentSource;
  limits: SerializedLimits;
  attributes: SerializedAttributes;
}

export interface SerializedLimits {
  "build/maximumConcurrentBuilds"?: number;
  "build/maximumBuildDurationInMinutes"?: number;
  "build/totalBillableMinutes"?: number;
  "build/totalFailedMinutes"?: number;
  "test/regular/concurrentDevices"?: number;
  "test/regular/deviceHours"?: number;
  "test/launch/deviceHours"?: number;
}

export interface SerializedAttributes {
  "build/unlimitedTotalBillableMinutes"?: boolean;
  "test/regular/enabled"?: boolean;
  "test/regular/unlimitedHours"?: boolean;
  "test/launch/enabled"?: boolean;
}

export interface SerializedUsage {
  buildService: SerializedUsagePeriods;
  testService: SerializedUsagePeriods;
}

export interface SerializedUsagePeriods {
  currentUsagePeriod: SerializedUsagePeriod;
  previousUsagePeriod: SerializedUsagePeriod;
}

export interface SerializedUsagePeriod {
  startTime: string;
  endTime: string;
  byAccount: SerializedUsageAccount;
  byApp: any;
}

export interface SerializedUsageAccount {
  "build/totalBillableMinutes"?: number;
  "build/totalFailedMinutes"?: number;
  "test/regular/deviceHours"?: number;
  "test/regular/devices"?: number;
  "test/regular/testRuns"?: number;
}

/* Deserialized interfaces */
export interface DeserializedBillingResources {
  test: TestBillingResources;
  build: BuildBillingResources;
}

export interface TestBillingResources {
  plan: TestBillingPlan | null;
  usage: TestBilledUsage | null;
}

export interface BuildBillingResources {
  plan: BuildBillingPlan | null;
  usage: BuildBilledUsage | null;
}

export interface TestBillingPlan {
  id: string;
  concurrentDevices?: number;
  deviceHours: number;
  unlimitedDeviceHours: boolean;
  service: string;
  maximumDuration: number;
  count?: number;
  paymentSource: PaymentSource;
  isFreeTier: boolean;
  isTrialPlan?: boolean;
  canSelectTrialPlan?: boolean;
  expirationDate?: Date;
  lastTrialPlanExpirationDate?: Date;
  trialDaysLeft?: number;
  isInternal: boolean;
  isXTCTransition: boolean;
  isCustomOffer: boolean;
}

export interface BuildBillingPlan {
  id: string;
  concurrentBuilds?: number;
  buildHours: number;
  unlimitedBuildHours: boolean;
  service: string;
  count?: number;
  paymentSource: PaymentSource;
  isFreeTier: boolean;
  isInternal: boolean;
}

export interface TestBilledUsage {
  deviceHours: number;
  devices: number;
  testRuns: number;
}

export interface BuildBilledUsage {
  billableMins: number;
}

export enum PaymentSource {
  AppCenter = "AppCenter",
  CustomOffer = "CustomOffer",
  GitHub = "GitHub",
  None = "None",
  Xtc = "Xtc",
}

type BillingServiceType = "Build" | "Test";

export class BillingResource extends Model<DeserializedBillingResource> implements DeserializedBillingResource {
  /** The ID of the resource the billing plan is attached to (what was queried to retrieve it) */
  resourceId!: string;
  /** The unique ID of the billing plan */
  id!: string;

  /** BillingStore cast workaround*/
  @observable azureSubscriptionId!: string;
  @observable azureSubscriptionState!: string;
  @observable plan!: DeserializedBillingResources;
  @observable billingPlans!: SerializedBillingPlans;
  @observable isAccountDeleted!: boolean;
  @observable usage!: SerializedUsage;

  get currentPlanStart(): Date | undefined {
    // We're just working under the assumption that all services have the same start and end dates for their
    // billing periods. $deity help us if they don't.
    return this.billingPlans.buildService.currentBillingPeriod
      ? new Date(this.billingPlans.buildService.currentBillingPeriod.startTime)
      : undefined;
  }

  get currentPlanEnd(): Date | undefined {
    // We're just working under the assumption that all services have the same start and end dates for their
    // billing periods. $deity help us if they don't.
    return this.billingPlans.buildService.currentBillingPeriod
      ? new Date(this.billingPlans.buildService.currentBillingPeriod.endTime)
      : undefined;
  }

  get nextPlanStart(): Date | undefined {
    // We're just working under the assumption that all services have the same start and end dates for their
    // billing periods. $deity help us if they don't.
    return this.billingPlans.buildService.nextBillingPeriod
      ? new Date(this.billingPlans.buildService.nextBillingPeriod.startTime)
      : undefined;
  }

  get nextPlanEnd(): Date | undefined {
    // We're just working under the assumption that all services have the same start and end dates for their
    // billing periods. $deity help us if they don't.
    return this.billingPlans.buildService.nextBillingPeriod
      ? new Date(this.billingPlans.buildService.nextBillingPeriod.endTime)
      : undefined;
  }

  get currentPlanIsFree(): boolean {
    const { buildService, testService } = this.billingPlans;
    return this.currentServicePlanIsFree(buildService, "Build") && this.currentServicePlanIsFree(testService, "Test");
  }

  private currentServicePlanIsFree(service: SerializedService, serviceType: BillingServiceType): boolean {
    return (
      !!service &&
      !!service.currentBillingPeriod &&
      service.currentBillingPeriod.byAccount.plan.parentId === `billingPlan${serviceType}Free`
    );
  }

  get nextPlanIsFree(): boolean {
    const { buildService, testService } = this.billingPlans;
    return this.nextServicePlanIsFree(buildService, "Build") && this.nextServicePlanIsFree(testService, "Test");
  }

  private nextServicePlanIsFree(service: SerializedService, serviceType: BillingServiceType): boolean {
    if (service && service.nextBillingPeriod) {
      return service.nextBillingPeriod.byAccount.plan.parentId === `billingPlan${serviceType}Free`;
    } else {
      return this.currentServicePlanIsFree(service, serviceType);
    }
  }

  get nextPlanIsDifferent(): boolean {
    const { buildService, testService } = this.billingPlans;
    return this.nextServicePlanIsDifferent(buildService) || this.nextServicePlanIsDifferent(testService);
  }

  private nextServicePlanIsDifferent(service: SerializedService): boolean {
    const currentServiceCount = service.currentBillingPeriod.byAccount.count;
    return service.nextBillingPeriod && service.nextBillingPeriod.byAccount.count !== currentServiceCount;
  }

  get nextPlanIsDowngrade(): boolean {
    if (this.currentPlanIsFree) {
      return false;
    }
    const { buildService, testService } = this.billingPlans;
    const currentCount = this.currentCountOfService(buildService) + this.currentCountOfService(testService);
    const newCount = this.nextCountOfService(buildService) + this.nextCountOfService(testService);
    return newCount > 0 && newCount < currentCount;
  }

  private currentCountOfService(service: SerializedService): number {
    if (service.currentBillingPeriod && service.currentBillingPeriod.byAccount && service.currentBillingPeriod.byAccount.count) {
      return service.currentBillingPeriod.byAccount.count;
    }
    return 0;
  }

  private nextCountOfService(service: SerializedService): number {
    if (service.nextBillingPeriod && service.nextBillingPeriod.byAccount && service.nextBillingPeriod.byAccount.count) {
      return service.nextBillingPeriod.byAccount.count;
    }
    return 0;
  }
}

export interface BillingQuery {
  app?: AppBillingQuery;
  orgName?: string;
}

interface AppBillingQuery {
  name?: string;
  ownerName?: string;
}
