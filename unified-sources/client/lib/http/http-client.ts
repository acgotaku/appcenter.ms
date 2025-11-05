import "whatwg-fetch";
import { forOwn, upperCase } from "lodash";
import * as Url from "url-parse";
import { HttpTokenUtils, UserToken } from "./get-token";
import { Timer, RequestTelemetryProperties } from "./timer";
import { ParamsParserUtils } from "./params-parser-utils";
import { IHttpOptions, RESPONSE_TYPES } from "@lib/common-interfaces";
import { FetchError } from "./fetch-error";
import { Utils } from "./utils";
import { config } from "../utils/config";
import { logoutToSignIn } from "./redirect-to-login-utils";
import uuid = require("uuid");

export const METHODS = {
  HEAD: "HEAD",
  GET: "GET",
  POST: "POST",
  PATCH: "PATCH",
  PUT: "PUT",
  DELETE: "DELETE",
};

/**
 * Http library
 *
 * Our custom wrapper for Http. This library uses the `fetch` library underneath its covers.
 * This library encapsulates the action of fetching the authentication token which is required to
 * talk to our backend API's.
 *
 * This library accepts parameterized urls and can parse them with corresponding params to create urls.
 */
export class HttpClient {
  private _rootUrl: string;

  constructor(rootUrl?: string) {
    this._rootUrl = rootUrl || "";
  }

  public head<T>(url: string, options: IHttpOptions = {}): Promise<T> {
    return this._call<T>(METHODS.HEAD, url, options);
  }

  public get<T>(url: string, options: IHttpOptions = {}): Promise<T> {
    return this._call<T>(METHODS.GET, url, options);
  }

  public post<T>(url: string, options: IHttpOptions = {}): Promise<T> {
    return this._call<T>(METHODS.POST, url, options);
  }

  public put<T>(url: string, options: IHttpOptions = {}): Promise<T> {
    return this._call<T>(METHODS.PUT, url, options);
  }

  public patch<T>(url: string, options: IHttpOptions = {}): Promise<T> {
    return this._call<T>(METHODS.PATCH, url, options);
  }

  public delete<T>(url: string, options: IHttpOptions = {}): Promise<T> {
    return this._call<T>(METHODS.DELETE, url, options);
  }

  /**
   * Calls the fetch library using the method provided.
   */
  public call<T>(method: string, url: string, options: IHttpOptions): Promise<T> {
    return this._call<T>(method, url, options);
  }

  /**
   * Core function which makes the Http call using the fetch library.
   */
  private _call<T>(method: string, url: string, options: IHttpOptions): Promise<T> {
    const correlationId = uuid.v4();
    const telemetryProperties: RequestTelemetryProperties = {
      method,
      routePath: url,
      statusCode: "Pending",
      duration: 0,
      correlationId,
    };

    // Add headers
    const headers = new Headers();
    // Add diagnostc context id
    headers.append("diagnostic-context", correlationId);
    // Add source header to track in API gateway
    headers.append("internal-request-source", "portal");

    // Append passed in headers
    forOwn(options.headers || {}, (value, key) => {
      headers.append(key!, value);
    });

    // Add params
    let params = options.params || {};
    const parsedUrl = new Url(url, "/"); /** Setting no base url if the url to be parsed is relative */
    let path = parsedUrl.pathname;
    const protocol = parsedUrl.protocol;
    const host = parsedUrl.host;
    const noCacheParam = { nocache: Utils.randomCacheBusterValue() };

    // Add no cache param if the browser is IE.
    params = Object.assign({}, params, Utils.isIe() ? noCacheParam : {});

    // Parse the path with the params provided
    path = ParamsParserUtils.parse(protocol.length === 0 && !path.startsWith("/") ? `/${path}` : path, params);

    // Build the URL
    // If the url provided is an absolute url, use the protocol & host from that url to create the new one.
    // If the url provided is a relative url, use the rootUrl -- which can be empty or set to a specific value.
    url = protocol ? `${protocol}//${host}${path}` : `${this._rootUrl}${path}`;

    // Prepare requestOptions for fetch
    method = upperCase(method);
    const requestOptions: RequestInit = {
      method: method,
      headers: headers,
      credentials: "same-origin", // enable cookies
    };

    // Add Content-Type header & body for the right methods
    if (method === METHODS.POST || method === METHODS.PUT || method === METHODS.PATCH || method === METHODS.DELETE) {
      if (!options.noJson) {
        headers.append("Content-Type", "application/json");
        const defaultBody = method === METHODS.DELETE ? undefined : {};
        requestOptions["body"] = JSON.stringify(options.body || defaultBody);
      } else {
        requestOptions["body"] = options.body;
      }
    }

    const { forceRefreshToken } = options;
    const me = this;

    let prepareForFetch = Promise.resolve();

    if (!options.noBifrostToken) {
      prepareForFetch = prepareForFetch
        .then(() => {
          return HttpTokenUtils.getToken({ forceRefreshToken });
        })
        .then((token: UserToken) => {
          if (!headers.has("Authorization")) {
            headers.append("Authorization", "Bearer " + token.jwtToken);
          }
        })
        .catch((error: FetchError) => {
          if (error.status === 401) {
            // We got the "need to re-auth" error response from the token endpoint. We should log the user out and redirect
            // to the sign-in page.
            // Preferrably this would come from the error message's body itself. However, turns out you need to
            // evaluate a promise in order to get the body data, which hasn't happened yet when the error is thrown.
            // It would take some  refactoring of our http/fetch wrapper itself in order to make this happen, so I'm
            // not tackling it just yet.
            logoutToSignIn("Your session has expired. Please log in again.", true);
            return;
          }
          // Make sure to not swallow any other errors that may have occurred.
          throw error;
        });
    }

    return prepareForFetch.then(() => {
      return me._fetch<T>(url, requestOptions, options, telemetryProperties);
    });
  }

  /**
   * Makes the fetch call.
   */
  private _fetch<T>(
    url: string,
    requestOptions: RequestInit,
    options: IHttpOptions,
    telemetryProperties: RequestTelemetryProperties
  ): Promise<T> {
    // Start the time lap
    const start = Timer.startLap();

    return fetch(url, requestOptions).then(
      (response: Response): Promise<T> => {
        // End the lap
        Timer.endLapAndTrack(start, { ...telemetryProperties, statusCode: response.status + "" });

        // Check if response is success and do the appropriate thing.
        if (response.ok) {
          // Do not parse content if status returns 204 NO CONTENT
          if (response.status === 204) {
            return Promise.resolve() as any;
          }
          return Promise.resolve(response[options.responseType || RESPONSE_TYPES.JSON]());
        } else {
          // Throws an explicit error using the error body.
          return response.text().then((body) => {
            // Assume that the error is a JSON object.
            if (body.length > 0) {
              try {
                body = JSON.parse(body);
              } catch (exception) {
                // Ignore JSON parsing exception, use body as text.
              }
            }
            throw new FetchError(response, body);
          }) as any;
        }
      },
      (error: Error) => {
        // End the lap
        Timer.endLapAndTrack(start, { ...telemetryProperties, statusCode: "Error" });

        // throw the error
        throw new FetchError({}, { error: { message: error.message } });
      }
    );
  }
}

export const apiGateway = new HttpClient(Utils.isInstallSubdomain() ? config.getApiGatewayUrlInstall() : config.getApiGatewayUrl());
export const accountManagementHttpClient = new HttpClient(config.getAccountManagementUrl());
export const portalServer = new HttpClient();
