import { Urls } from "../utils/constants";
import { apiGateway } from "@root/lib/http";
import { IAHCommit } from "@root/data/build";

export class CommitsStore {
  private appName: string;
  private ownerName: string;

  constructor(appName: string, ownerName: string) {
    this.appName = appName;
    this.ownerName = ownerName;
  }

  public fetchCommits(shas: string[], commitForm: string = "lite"): Promise<any> {
    if (!shas || shas.length === 0) {
      return Promise.resolve([]);
    }

    const uniqueShas = Array.from(new Set(shas));
    return apiGateway
      .get<IAHCommit[]>(Urls.GetCommitsPath, {
        params: {
          app_name: this.appName,
          owner_name: this.ownerName,
          form: commitForm,
          hashes: uniqueShas.join(","),
        },
      })
      .then((commits) => {
        const map = {};

        commits.forEach((commit) => {
          map[commit.sha] = commit;
        });

        return map;
      });
  }
}
