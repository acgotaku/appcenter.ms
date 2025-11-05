import { observable, runInAction, action } from "mobx";
import { ResourceRequest } from "./resource-request";
import { Utils } from "@root/lib/http/utils";
import { config } from "@root/lib/utils/config";
import { HttpTokenUtils } from "@root/lib/http/get-token";
import { FetchError } from "@root/lib/http/fetch-error";

const isJSON = (request: XMLHttpRequest) => {
  if (!request.responseText) {
    return false;
  }
  if (request.responseType === "json") {
    return true;
  }
  const contentType = request.getResponseHeader("content-type");
  return contentType && contentType.startsWith("application/json");
};

export class FormDataResourceRequest<T, U = T> extends ResourceRequest<T, U> {
  @observable public progress?: number;

  constructor(url: string, formData: FormData, getData: () => T, setData: (error: Error, data: U) => void) {
    super(
      HttpTokenUtils.getToken({ forceRefreshToken: false }).then((token) => {
        return new Promise<U>((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open("POST", Utils.isInstallSubdomain() ? config.getApiGatewayUrlInstall() : config.getApiGatewayUrl() + url);
          request.setRequestHeader("Authorization", `Bearer ${token.jwtToken}`);
          request.addEventListener("load", () => {
            if (request.status < 200 || request.status >= 300) {
              return reject(new FetchError(request));
            }

            if (isJSON(request)) {
              try {
                resolve(JSON.parse(request.responseText));
              } catch (err) {
                reject(err);
              }
            } else {
              resolve();
            }
          });

          request.addEventListener("error", (event) => {
            reject(new Error("Failed to load"));
          });

          request.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              runInAction(() => (this.progress = event.loaded / event.total));
            }
          });

          request.send(formData);
        });
      }),
      getData,
      setData as any
    );

    this.onSuccess(() => this.clearProgress());
    this.onFailure(() => this.clearProgress());
  }

  private clearProgress() {
    // Let it rest a moment; it’s lest jarring
    // to see progress stay at full briefly.
    setTimeout(
      action(() => {
        this.progress = undefined;
      }),
      200
    );
  }
}
