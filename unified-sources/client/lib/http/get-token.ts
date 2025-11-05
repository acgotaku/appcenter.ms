//
// Utility function to fetch user token from our server
// and cache it until expiration.
//

import "whatwg-fetch";
import { parseISO, addMinutes, isAfter } from "date-fns";
import { FetchError } from "./fetch-error";
import { Timer, RequestTelemetryProperties } from "./timer";
import { Utils } from "./utils";
import * as uuid from "uuid";
import { ParamsParserUtils } from "./params-parser-utils";

export interface UserToken {
  jwtToken: string;
  expirationTime: string;
}

let token: Promise<UserToken> | undefined;

let authEndpoint = "/auth/token";
const tokenExpirationWindowInMinutes = 10;

export class HttpTokenUtils {
  public static fetchToken(): Promise<UserToken> {
    const correlationId = uuid.v4();
    const telemetryProperties: RequestTelemetryProperties = {
      method: "GET",
      routePath: authEndpoint,
      statusCode: "Pending",
      duration: 0,
      correlationId,
    };
    // Start the lap
    authEndpoint = ParamsParserUtils.parse(authEndpoint, {
      ...((Utils.isIe() && { nocache: Utils.randomCacheBusterValue() }) || undefined),
    });
    const start = Timer.startLap();
    const headers = new Headers();
    headers.append("diagnostic-context", correlationId);

    return fetch(authEndpoint, {
      method: "get",
      headers: headers,
      credentials: "include",
    }).then(
      (response: Response) => {
        // End the lap
        Timer.endLapAndTrack(start, { ...telemetryProperties, statusCode: response.status + "" });

        if (response.ok) {
          return response.json() as Promise<UserToken>;
        } else {
          throw new FetchError(response);
        }
      },
      (error: Error) => {
        // End the lap
        Timer.endLapAndTrack(start, { ...telemetryProperties, statusCode: "Error" });

        throw new FetchError(error);
      }
    );
  }

  public static getToken(options: { forceRefreshToken: boolean | undefined }) {
    const { forceRefreshToken = false } = options;

    return this.getCurrentToken(forceRefreshToken)
      .then((token: UserToken) => {
        const expiration = parseISO(token.expirationTime);
        const now = new Date();
        if (isAfter(addMinutes(now, tokenExpirationWindowInMinutes), expiration)) {
          // Expired or about to, get a new token
          return this.getCurrentToken(true);
        }
        // Otherwise we're still good, return what we've got
        return token;
      })
      .catch((err: FetchError) => {
        // Wipe out cache so we retry next time
        token = undefined;
        // and continue with the failure
        throw err;
      });
  }

  private static getCurrentToken(forceRefreshToken: boolean): Promise<UserToken> {
    if (!token || forceRefreshToken) {
      token = this.fetchToken();
    }
    return token;
  }
}
