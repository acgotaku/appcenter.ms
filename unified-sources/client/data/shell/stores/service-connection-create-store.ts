import { DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore } from "@root/lib/utils/external-data";
import { apiGateway } from "@root/lib/http";
import { StoreUrls } from "../utils/constants";
import { ServiceConnection } from "@root/data/shell/models/service-connection";

export class ServiceConnectionCreateStore extends DEPRECATED_DO_NOT_USE_SEE_DOC_COMMENT_ExternalDataStore<ServiceConnection> {
  public createServiceConnection(requestBody: ServiceConnection): Promise<ServiceConnection> {
    const fetchDataPromise = apiGateway.post<ServiceConnection>(StoreUrls.ServiceConnections, {
      body: requestBody,
    });

    return this.load(fetchDataPromise);
  }
}
