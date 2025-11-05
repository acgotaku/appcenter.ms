import { action, computed, observable } from "mobx";

import { Urls } from "../utils/constants";
import { ResourceCollectionStore, ExternalDataState, EmptyStateProps } from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { FetchError } from "../../lib/http/fetch-error";
import { locationStore } from "@root/stores";
import { apiGateway } from "@root/lib/http";
import { CommitsStore } from "./commits-store";
import { BranchWithCommit } from "../models/branch-with-commit";
import { IAHBranchStatus } from "@root/data/build";
import { extend } from "lodash";
import { WizardStrings } from "../utils/strings";
import { logger } from "@root/lib/telemetry";

export class BranchesWithCommitStore extends ResourceCollectionStore<BranchWithCommit> {
  private appName: string;
  private ownerName: string;

  @observable public isRepoConfigured!: boolean;
  @observable public hasConfiguredBranches!: boolean;

  constructor(app: IApp) {
    super();
    this.appName = app.name!;
    this.ownerName = app.owner!.name;
  }

  @computed
  get errorEmptyStateProps(): EmptyStateProps {
    const error = this.error as FetchError;

    if (this.state === ExternalDataState.Failed) {
      // workaround for Edge 14 bug - https://ghe-us.microsoft.com/mobile-services/mobile-center-portal/issues/2367
      if (navigator.appVersion.includes("Edge/14.14393") && error.httpResponse && error.httpResponse.message === "TypeMismatchError") {
        return {
          hideImage: true,
          title: WizardStrings.BranchesAuthErrorTitle,
          subtitle: WizardStrings.BranchesAuthErrorSubtitle,
          buttonText: WizardStrings.BranchesAuthErrorButtonText,
          to: locationStore.getUrlWithCurrentApp("build"),
        };
      }

      switch (error.status) {
        case 401:
          return {
            hideImage: true,
            title: WizardStrings.BranchesAuthErrorTitle,
            subtitle: WizardStrings.BranchesAuthErrorSubtitle,
            buttonText: WizardStrings.BranchesAuthErrorButtonText,
            to: locationStore.getUrlWithCurrentApp("build"),
          };
        default:
          return {
            hideImage: true,
            title: WizardStrings.GenericErrorTitle,
            subtitle: "",
            hideButton: true,
          };
      }
    } else {
      return {};
    }
  }

  protected getResourceId(resource: BranchWithCommit): string {
    return resource.branch!.name;
  }

  public fetchBranches(): void {
    const commitsStore = new CommitsStore(this.appName, this.ownerName);
    let filteredBranches: IAHBranchStatus[];

    const fetchPromise = apiGateway
      .get<BranchWithCommit[]>(Urls.GetBranchesPath, {
        params: {
          app_name: this.appName,
          owner_name: this.ownerName,
        },
      })
      .catch(
        action((error: FetchError) => {
          logger.info(error.message);
          const notConfigured: boolean = error.message === "App has not been configured for build";
          if (notConfigured) {
            this.isRepoConfigured = false;
            return null;
          } else {
            throw error;
          }
        })
      )
      .then<BranchWithCommit[]>(
        // @ts-ignore. [Should fix it in the future] Strict error.
        action((branches: BranchWithCommit[]) => {
          if (!branches) {
            return [];
          }

          this.isRepoConfigured = true;
          const configuredBranches = branches.filter((branch) => {
            return branch.configured;
          });
          if (configuredBranches.length === 0) {
            logger.info("No configured branches");
            this.hasConfiguredBranches = false;
            return [];
          }
          this.hasConfiguredBranches = true;

          const configuredBranchesWithBuilds = configuredBranches.filter((branch) => {
            return !!branch.lastBuild;
          });
          if (configuredBranchesWithBuilds.length === 0) {
            logger.info("No configured branches with builds");
            return [];
          }

          filteredBranches = configuredBranchesWithBuilds.sort(this.compareBranches);

          const shas: string[] = filteredBranches.map((branch) => branch.lastBuild!.sourceVersion);
          return commitsStore.fetchCommits(shas);
        })
      )
      .then<BranchWithCommit[]>((commits) => {
        if (!filteredBranches) {
          return [];
        }

        return filteredBranches.map((branch) => {
          return extend(branch, {
            // @ts-ignore
            commit: commits[branch.lastBuild!.sourceVersion],
          }) as BranchWithCommit;
        });
      });

    this.loadArray(fetchPromise);
  }

  private compareBranches(a: IAHBranchStatus, b: IAHBranchStatus): number {
    if (!a.lastBuild || !b.lastBuild) {
      return 1;
    }

    const finishTimeA = new Date(a.lastBuild.finishTime!);
    const finishTimeB = new Date(b.lastBuild.finishTime!);
    if (finishTimeA < finishTimeB) {
      return 1;
    } else if (finishTimeB > finishTimeA) {
      return -1;
    } else {
      return 0;
    }
  }
}
