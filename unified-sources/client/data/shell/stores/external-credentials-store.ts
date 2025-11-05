import {
  SerializedExternalCredential,
  ExternalCredential,
  DeserializedExternalCredential,
  isValidExternalServiceType,
  isValidExternalCredentialType,
  externalCredentialType,
  ExternalCredentialOwner,
} from "../models/external-credential";
import { Store, ProxiedModel, FetchMode, LoadOptions, ResourceRequest } from "@root/data/lib";
import { apiGateway } from "@root/lib/http";
import { API } from "../constants";
import { RESPONSE_TYPES } from "@lib/common-interfaces";

export type ExternalCredentialsQueryOrOptions = { serviceType?: string; credentialType?: string; owner?: ExternalCredentialOwner };

export type ExternalCredentialsPostOptions = { authCode: string };
export type ExternalCredentialsPatchOptions = { authCode: string; appSpecificPassword: string };

export class ExternalCredentialsStore extends Store<DeserializedExternalCredential, SerializedExternalCredential, ExternalCredential> {
  protected ModelClass = ExternalCredential;

  protected generateIdFromResponse(resource: SerializedExternalCredential, query?: any) {
    return resource.id;
  }

  protected getModelId(model: ProxiedModel<ExternalCredential>): string {
    return model.id;
  }

  protected getResource(id: string, query?: any): Promise<SerializedExternalCredential> {
    return apiGateway.get<SerializedExternalCredential>(API.SERVICE_CONNECTION_BY_ID, {
      params: {
        serviceConnectionId: id,
      },
    });
  }

  protected getCollection(query?: ExternalCredentialsQueryOrOptions): Promise<SerializedExternalCredential[]> {
    // If no credential type is passed by default it will use credentialType as 'credentials'
    if (!query || !query.credentialType) {
      if (!query) {
        query = {};
      }
      query.credentialType = externalCredentialType.Credentials;
    }

    return apiGateway.get<SerializedExternalCredential[]>(API.SERVICE_CONNECTIONS, {
      params: query as any, // This is done because params is an object which expects key value pairs (strings). We've added an enum and that doesn't play well with ts.
    });
  }

  public create(resource: ExternalCredential, optimistic = true, options?: ExternalCredentialsPostOptions) {
    return super.create(resource, optimistic, options);
  }

  protected postResource(
    resource: ExternalCredential,
    options?: ExternalCredentialsPostOptions
  ): Promise<void | SerializedExternalCredential> {
    const postConnectionBody = {
      displayName: resource.displayName,
      serviceType: resource.serviceType,
      credentialType: resource.credentialType ? resource.credentialType : externalCredentialType.Credentials,
      data: options && options.authCode ? Object.assign(resource.profile as object, { authCode: options.authCode }) : resource.profile,
    };

    const url = options && options.authCode ? API.SERVICE_CONNECTIONS_MULTIFACTOR : API.SERVICE_CONNECTIONS;

    return apiGateway.post<SerializedExternalCredential>(url, {
      body: postConnectionBody,
    });
  }

  protected patchResource(
    resource: ExternalCredential,
    changes: Partial<ExternalCredential>,
    options?: ExternalCredentialsPatchOptions
  ): Promise<any> {
    const patchConnectionBody = {
      displayName: changes.displayName,
      data: {
        ...changes.profile,
        authCode: options && options.authCode ? options.authCode : null,
        appSpecificPassword: options && options.appSpecificPassword ? options.appSpecificPassword : null,
      },
    };

    return apiGateway.patch<SerializedExternalCredential>(API.SERVICE_CONNECTION_BY_ID, {
      params: {
        serviceConnectionId: resource.id,
      },
      body: patchConnectionBody,
    });
  }
  protected deleteResource(resource: ExternalCredential, options?: any): Promise<any> {
    return apiGateway.delete<SerializedExternalCredential>(API.SERVICE_CONNECTION_BY_ID, {
      params: {
        serviceConnectionId: resource.id,
      },
      responseType: RESPONSE_TYPES.TEXT,
    });
  }
  protected deserialize(
    serialized: SerializedExternalCredential,
    query: ExternalCredentialsQueryOrOptions = {}
  ): DeserializedExternalCredential {
    const serviceType = serialized.serviceType.toLowerCase();
    // defaulting the credential type to credentials in case nothing is received from api in response
    const credentialType = serialized.credentialType ? serialized.credentialType.toLowerCase() : externalCredentialType.Credentials;

    if (!isValidExternalServiceType(serviceType)) {
      throw new Error(`Unsupported service type: ${serviceType}`);
    }

    if (!isValidExternalCredentialType(credentialType)) {
      throw new Error(`Unsupported credential type: ${credentialType}`);
    }

    return {
      serviceType,
      credentialType,
      displayName: serialized.displayName,
      id: serialized.id,
      profile: serialized.data,
      isValid: serialized.isValid,
      owner: query.owner || ExternalCredentialOwner.CurrentUser,
      is2FA: serialized.is2FA,
    };
  }

  public fetchCollection(
    query?: ExternalCredentialsQueryOrOptions,
    { fetchMode = FetchMode.PreserveReplace, segmentFilter }: LoadOptions<DeserializedExternalCredential, ExternalCredential> = {}
  ): ResourceRequest<ExternalCredential[], SerializedExternalCredential[]> {
    return super.fetchCollection(query, { fetchMode, segmentFilter });
  }
}

export const externalCredentialStore = new ExternalCredentialsStore();
