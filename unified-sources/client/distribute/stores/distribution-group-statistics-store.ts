import { observable, action, computed, autorun } from "mobx";
import { subDays } from "date-fns";

import { appStore } from "@root/stores";
import { OS } from "@lib/common-interfaces";
import { ResourceRequest } from "@root/data/lib";
import { analyticsClient } from "@root/data/clients";
import {
  DateTimeCounts,
  DateTimeDownloadReleaseCounts,
  FilterReleasesContainer,
  SessionDurationsDistribution,
  SessionDurationsDistributionDistribution,
  FilterVersionsContainer,
  DailySession,
  ReleaseDailySessions,
} from "@root/data/clients/analytics-api/model/api";
import { Period, periodToDays } from "@root/crashes/utils/constants";
import { compareVersion, compareEntry } from "@root/distribute/utils/compare-version-helper";
import { safeParseIsoDuration } from "@root/lib/utils/time";

import { distributionStores } from "../stores/distribution-stores";
import { ReleaseListUIStore } from "./release-list-ui-store";
import { PartialRelease } from "@root/data/distribute/models/partial-release";
import { ReleaseModel } from "@root/data/distribute/models/release";

// extending PartialRelease to be able using compare-version-helper
export interface Version extends PartialRelease {
  name: string;
  releaseIds: string[];
}

export interface VersionsMap {
  [version: string]: Version;
}

export class DistributionGroupStatisticsStore {
  @observable private statisticsInterval: Period = Period.last7Days;

  @observable public releaseSessionsCountsRequest!: ResourceRequest<any>;
  @observable public sessionsCountsRequest!: ResourceRequest<any>;
  @observable public releaseSessionDurationRequest!: ResourceRequest<any>;
  @observable public crashesCountsRequest!: ResourceRequest<any>;
  @observable public downloadsCountsRequest!: ResourceRequest<any>;
  @observable public releasesDownloadsCountRequest!: ResourceRequest<any>;

  @observable private releaseSessionsCountsResponse: ReleaseDailySessions = null as any;
  @observable private releaseSessionDurationResponse: SessionDurationsDistribution = null as any;
  @observable private sessionsCountsResponse: ReleaseDailySessions = null as any;
  @observable private crashesCounts: DateTimeCounts[] = null as any;
  @observable public downloadsCounts: DateTimeDownloadReleaseCounts = null as any;
  @observable public releasesDownloadsCount: DateTimeDownloadReleaseCounts = null as any;

  @observable private selectedVersion: string = "all";

  constructor(private groupName: string, private releaseListUIStore: ReleaseListUIStore) {}

  private static getReleaseVersionName(release: { shortVersion: ReleaseModel["shortVersion"]; version: ReleaseModel["version"] }) {
    return `${release.shortVersion} (${release.version})`;
  }

  @computed
  public get versionsMap(): VersionsMap {
    const releases: {
      shortVersion: ReleaseModel["shortVersion"];
      version: ReleaseModel["version"];
      id: ReleaseModel["id"];
    }[] = this.releaseListUIStore.releases;
    if (!releases || releases.length === 0) {
      return null as any;
    }

    return releases.reduce((map, release) => {
      const versionName = DistributionGroupStatisticsStore.getReleaseVersionName(release);
      if (!map[versionName]) {
        map[versionName] = {
          name: versionName,
          shortVersion: release.shortVersion,
          version: release.version,
          releaseIds: [],
        };
      }
      map[versionName].releaseIds.push(release.id);
      return map;
    }, {});
  }

  @computed
  public get sortedVersionsList(): string[] {
    if (this.versionsMap) {
      return Object.values(this.versionsMap)
        .sort((a: Version, b: Version) => {
          // using compareIOSVersion because compareAndroidVersion relies only on version code
          let result = compareVersion(a, b, "Custom");
          if (result === 0) {
            result = -compareEntry(Number(a.version), Number(b.version));
          }
          return -result;
        })
        .map((version: Version) => version.name);
    }
    return [];
  }

  @computed
  public get versionName(): string {
    return this.selectedVersion;
  }

  @computed
  public get selectedReleasesList(): string[] {
    const releases = this.releaseListUIStore.releases.map((release) => String(release.id));
    return this.selectedVersion === "all" ? releases : this.versionsMap ? this.versionsMap[this.selectedVersion].releaseIds : [];
  }

  @computed
  public get selectedVersionsList(): Version[] {
    return this.versionsMap
      ? this.selectedVersion === "all"
        ? Object.values(this.versionsMap)
        : [this.versionsMap[this.selectedVersion]]
      : [];
  }

  @computed
  public get isPending(): boolean {
    // Need to wait on all the requests to finish to determine state
    return (
      (this.releaseListUIStore && this.releaseListUIStore.isPending) ||
      (this.releaseSessionsCountsRequest && this.releaseSessionsCountsRequest.isPending) ||
      (this.releaseSessionDurationRequest && this.releaseSessionDurationRequest.isPending) ||
      (this.crashesCountsRequest && this.crashesCountsRequest.isPending) ||
      (this.downloadsCountsRequest && this.downloadsCountsRequest.isPending) ||
      (this.releasesDownloadsCountRequest && this.releasesDownloadsCountRequest.isPending) ||
      (this.sessionsCountsRequest && this.sessionsCountsRequest.isPending)
    );
  }

  @computed
  public get hasNoReleases(): boolean {
    const releases = this.releaseListUIStore.releases;
    return this.releaseListUIStore.isLoaded && (!releases || releases.length === 0);
  }

  @computed
  public get hasNoDownloads(): boolean {
    return this.totalDownloadsCounts === null || this.totalDownloadsCounts === 0;
  }

  @computed
  public get hasNoAnalyticsData(): boolean {
    return this.releaseSessionCountsTotal === null || this.releaseSessionCountsTotal === 0;
  }

  @computed
  public get hasNoReleasesDownloads(): boolean {
    return this.totalReleasesDownloadsCounts === null || this.totalReleasesDownloadsCounts === 0;
  }

  @computed
  public get interval(): Period {
    return this.statisticsInterval;
  }

  @computed
  public get intervalDays(): number {
    return periodToDays(this.statisticsInterval);
  }

  @computed
  public get totalDownloadsCounts(): number {
    return this.downloadsCounts && this.downloadsCounts.total!;
  }

  @computed
  public get totalReleasesDownloadsCounts(): number {
    return this.releasesDownloadsCount && this.releasesDownloadsCount.total!;
  }

  @computed
  public get distributionGroupId(): string {
    return distributionStores.getDistributionGroupDetailsStore(this.groupName).data.id;
  }

  @computed
  public get appSessionsCountTotal(): number {
    return (this.sessionsCountsResponse && this.sessionsCountsResponse.totalSessionCounts) || 0;
  }

  @computed
  public get releaseSessionCounts(): DailySession[] {
    return (this.releaseSessionsCountsResponse && this.releaseSessionsCountsResponse.sessions) || [];
  }

  @computed
  public get releaseSessionCountsTotal(): number {
    return (this.releaseSessionsCountsResponse && this.releaseSessionsCountsResponse.totalSessionCounts) || 0;
  }

  @computed
  public get releaseSessionCountsAverage(): number {
    return (this.releaseSessionsCountsResponse && this.releaseSessionsCountsResponse.avgSessionsPerDay) || 0;
  }

  @computed
  public get releaseSessionDurations(): SessionDurationsDistributionDistribution[] {
    return this.releaseSessionDurationResponse &&
      this.releaseSessionDurationResponse.distribution &&
      this.releaseSessionDurationResponse.distribution.length > 1
      ? this.releaseSessionDurationResponse.distribution.slice(1)
      : [];
  }

  @computed
  public get releaseSessionDurationUnknown(): number {
    return this.releaseSessionDurationResponse &&
      this.releaseSessionDurationResponse.distribution &&
      this.releaseSessionDurationResponse.distribution.length > 0
      ? this.releaseSessionDurationResponse.distribution[0].count!
      : 0;
  }

  @computed
  public get releaseSessionDurationAverage(): number {
    return (
      (this.releaseSessionDurationResponse && safeParseIsoDuration(this.releaseSessionDurationResponse.average_duration!) / 1000) || 0
    );
  }

  @action
  public setInterval(interval: Period) {
    this.statisticsInterval = interval;
  }

  @action
  public setVersion(version: string) {
    this.selectedVersion = version;
  }

  @action
  public async update(hasFetched?: boolean): Promise<boolean> {
    if (!hasFetched) {
      this.releaseListUIStore.fetchReleaseList();
    }

    if (this.hasNoReleases) {
      return this.releaseListUIStore.isPending ? Promise.resolve(false) : Promise.resolve(true);
    }

    const latestRelease = this.releaseListUIStore.releases[0];

    const disposerStatistics = autorun(
      () => {
        if (this.releaseListUIStore.isLoaded) {
          this.setVersion(DistributionGroupStatisticsStore.getReleaseVersionName(latestRelease));
          const updateSuccessful: boolean = this.updateCharts();
          if (!updateSuccessful || this.releaseListUIStore.isPending) {
            return Promise.resolve(false);
          }
          disposerStatistics();
        }
      },
      { name: "releases-loaded" }
    );

    return Promise.resolve(true);
  }

  @computed
  public get sessionDurationChartEnabled(): boolean {
    return appStore.app.os === OS.ANDROID || appStore.app.os === OS.IOS;
  }

  @computed
  public get sessionsChartEnabled(): boolean {
    return appStore.app.os === OS.ANDROID || appStore.app.os === OS.IOS;
  }

  public get crashesChartEnabled(): boolean {
    return false;
  }

  @action
  public updateCharts(): boolean {
    const fetchReleasesDownloadCount = this.fetchReleasesDownloadCount();
    const fetchDownloadsCounts = this.fetchDownloadsCounts();

    if (!fetchReleasesDownloadCount || !fetchDownloadsCounts) {
      return false;
    }
    if (this.sessionsChartEnabled) {
      this.fetchReleaseSessionsCounts();
      this.fetchSessionsCounts();
    }
    if (this.crashesChartEnabled) {
      this.fetchCrashesCounts();
    }
    if (this.sessionDurationChartEnabled) {
      this.fetchSessionDuration();
    }

    return true;
  }

  @action
  public fetchSessionsCounts() {
    const start = subDays(new Date(), periodToDays(Period.last28Days));

    const versionsFilter: FilterVersionsContainer = {
      versions: Object.values(this.versionsMap || []).map((version) => ({
        version: version.shortVersion,
        build: version.version,
      })),
    };

    this.sessionsCountsRequest = new ResourceRequest<any>(
      analyticsClient.value.analyticsDistributionReleaseDailySessions(start, this.distributionGroupId, versionsFilter),
      () => this.sessionsCountsResponse,
      (_, data) => {
        this.sessionsCountsResponse = data;
      }
    );
    return this.sessionsCountsRequest;
  }

  @action
  public fetchReleaseSessionsCounts() {
    const start = subDays(new Date(), this.intervalDays);

    const versionsFilter: FilterVersionsContainer = {
      versions: this.selectedVersionsList.map((version) => ({
        version: version.shortVersion,
        build: version.version,
      })),
    };

    this.releaseSessionsCountsRequest = new ResourceRequest<any>(
      analyticsClient.value.analyticsDistributionReleaseDailySessions(start, this.distributionGroupId, versionsFilter),
      () => this.releaseSessionsCountsResponse,
      (_, data) => (this.releaseSessionsCountsResponse = data)
    );
    return this.releaseSessionsCountsRequest;
  }

  @action
  public fetchCrashesCounts() {
    const start = subDays(new Date(), this.intervalDays);
    this.crashesCountsRequest = new ResourceRequest<any>(
      analyticsClient.value.analyticsDeviceCounts(start),
      () => this.crashesCounts,
      (_, data) => (this.crashesCounts = data.daily)
    );
    return this.crashesCountsRequest;
  }

  @action
  public fetchDownloadsCounts() {
    if (!this.distributionGroupId) {
      return;
    }

    const start = subDays(new Date(), this.intervalDays);
    const releasesFilter: FilterReleasesContainer = {
      releases: this.selectedReleasesList.map((release) => ({ release })),
    };

    if (releasesFilter.releases!.length === 0) {
      return;
    }

    this.downloadsCountsRequest = new ResourceRequest<DateTimeDownloadReleaseCounts>(
      analyticsClient.value.analyticsDistributionReleaseDownloadCounts(start, this.distributionGroupId, releasesFilter),
      () => this.downloadsCounts,
      (_, data) => {
        this.downloadsCounts = data!;
      }
    );
    return this.downloadsCountsRequest;
  }

  @action
  public fetchReleasesDownloadCount() {
    if (!this.distributionGroupId) {
      return;
    }

    const start = subDays(new Date(), periodToDays(Period.last28Days));
    const releases = this.releaseListUIStore.releases.map(({ id }) => ({ release: String(id) }));

    if (releases.length === 0) {
      return;
    }

    const releasesFilter: FilterReleasesContainer = { releases };

    this.releasesDownloadsCountRequest = new ResourceRequest<DateTimeDownloadReleaseCounts>(
      analyticsClient.value.analyticsDistributionReleaseDownloadCounts(start, this.distributionGroupId, releasesFilter),
      () => this.releasesDownloadsCount,
      (_, data) => {
        this.releasesDownloadsCount = data!;
      }
    );
    return this.releasesDownloadsCountRequest;
  }

  @action
  public fetchSessionDuration() {
    const start = subDays(new Date(), this.intervalDays);
    const versionsFilter: FilterVersionsContainer = {
      versions: this.selectedVersionsList.map((version) => ({
        version: version.shortVersion,
        build: version.version,
      })),
    };
    this.releaseSessionDurationRequest = new ResourceRequest<SessionDurationsDistribution>(
      analyticsClient.value.analyticsDistributionReleaseSessionsDuration(start, this.distributionGroupId, versionsFilter),
      () => this.releaseSessionDurationResponse,
      (_, data) => (this.releaseSessionDurationResponse = data!)
    );
    return this.releaseSessionDurationRequest;
  }
}
