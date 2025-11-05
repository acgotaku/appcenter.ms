import { action, computed, observable } from "mobx";
import { extend, transform } from "lodash";

import { ResourceCollectionStore, EmptyStateProps, ExternalDataState } from "@root/shared";
import { IApp } from "@lib/common-interfaces";
import { IAHBuild } from "@root/data/build";
import { Urls } from "../utils/constants";
import { apiGateway } from "@root/lib/http";
import { CommitsStore } from "./commits-store";
import { BuildWithCommit } from "../models/build-with-commit";
import { WizardStrings } from "../utils/strings";
import { logger } from "@root/lib/telemetry";

const emptyImg = require("../assets/no-releases-for-distribution-group.svg");

export class BuildsWithCommitStore extends ResourceCollectionStore<BuildWithCommit> {
  private appName: string;
  private ownerName: string;

  @observable private branchName!: string;

  constructor(app: IApp) {
    super();
    this.appName = app.name!;
    this.ownerName = app.owner!.name;
  }

  @computed
  get errorEmptyStateProps(): EmptyStateProps {
    if (this.state === ExternalDataState.Failed) {
      return {
        imgSrc: emptyImg, // TODO: replace with another image
        title: WizardStrings.GenericErrorTitle,
        subtitle: "",
        hideButton: true,
      };
    } else {
      return {};
    }
  }

  protected getResourceId(resource: BuildWithCommit): string {
    return String(resource.id);
  }

  @action
  public fetchBuildsWithCommits(branch: string): void {
    const commitsStore = new CommitsStore(this.appName, this.ownerName);
    let signedBuilds: IAHBuild[];

    const fetchPromise = this.fetchBuilds(branch)
      .then((builds) => {
        signedBuilds = builds;
        if (!signedBuilds || signedBuilds.length === 0) {
          logger.info("No distributable builds");
          return [];
        }

        const shas: string[] = builds.map((build) => build.sourceVersion);
        return commitsStore.fetchCommits(shas);
      })
      .then((commits) => {
        return signedBuilds.map((build) => {
          return extend(build, {
            commit: commits[build.sourceVersion],
          }) as BuildWithCommit;
        });
      });

    if (this.branchName !== branch) {
      this.data = undefined;
      this.branchName = branch;
    }
    this.loadArray(fetchPromise);
  }

  private fetchBuilds(branch: string): Promise<BuildWithCommit[]> {
    return apiGateway
      .get<BuildWithCommit[]>(Urls.GetBuildsinBranchPath, {
        params: {
          app_name: this.appName,
          owner_name: this.ownerName,
          branch_name: branch,
        },
      })
      .then((builds) => {
        // Filter to the first 5 successful/signed/non-simulator builds
        return transform(
          builds,
          (result, build) => {
            if (this.canDistributeBuild(build)) {
              (result as any[]).push(build);
            }
            return result.length < 5;
          },
          []
        );
      });
  }

  private canDistributeBuild(build: IAHBuild): boolean {
    return build.result === "succeeded" && build.tags!.includes("signed") && !build.tags!.includes("simulator");
  }
}
