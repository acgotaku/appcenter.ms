import { forOwn, trim, startsWith, endsWith, trimStart, trimEnd } from "lodash";

declare global {
  function encodeURIComponent(uriComponent: any): string;
}

/**
 * Utils that parse urls/parameterized urls & params.
 */
export class ParamsParserUtils {
  private static _paramPrefix: string = ":";
  private static _alternativePrefix: string = "{";
  private static _alternativeSuffix: string = "}";

  /**
   * Parse a url and given params.
   *
   * Usage: There are two ways we can pass params to a url.
   *
   * 1. Via named parameterized Urls
   *    For ex:
   *    url = `/apps/:app_id/user/:user_id`; params = { app_id: "3", user_id: "john_doe" };
   *    should translate to -- `/apps/3/user/john_doe`
   *
   *    Note that any keys in the `params` object that don't match the keys in the Url
   *    will be automatically translated to query parameters.
   *
   *    For ex:
   *    url = `/apps/user`; params = { app_id: "3", user_id: "john_doe" };
   *    should translate to -- `/apps/user?app_id=3&user_id=john_doe`
   *
   * 2. Via query params
   *    For ex:
   *    url = `/crashes/view; params = { id: "3", start_time: "2016-08-10T18:19:51.794Z" };
   *    should translate to -- `/crashes/view?id=3&start_time=2016-08-10T18:19:51.794Z`
   *
   * @static
   * @param {string} path
   * @param {{ [key: string]: string }} params
   * @returns {string}
   */
  public static parse(path: string, params: { [key: string]: any }, retainUnusedParamsAsQuery = true): string {
    path = trim(path);
    if (path.length === 0) {
      return "";
    }

    const pathChunks = path.split("/");

    // Params object is later mutated with "delete". Copy it here to avoid any unexpected behavior for the caller.
    params = { ...params };

    // Pull out params matching the keys in the url path
    const pathChunksWithParams = pathChunks.map((chunk: string, index: number) => {
      if (!chunk || chunk.length === 0) {
        return chunk;
      }

      chunk = trim(chunk);

      if (
        startsWith(chunk, this._paramPrefix) ||
        (startsWith(chunk, this._alternativePrefix) && endsWith(chunk, this._alternativeSuffix))
      ) {
        let paramKey;
        if (startsWith(chunk, this._paramPrefix)) {
          paramKey = chunk.substr(this._paramPrefix.length);
        } else {
          paramKey = trimStart(chunk, this._alternativePrefix);
          paramKey = trimEnd(paramKey, this._alternativeSuffix);
        }

        const matchingParamValue = params[paramKey];
        const isDot = matchingParamValue !== "." && matchingParamValue !== "..";

        if (typeof matchingParamValue !== "undefined" && isDot) {
          // Delete the param from the params
          delete params[paramKey];
          // Chunks with string arrays will be replaced with {value1}/{value2}/.../{valueN}
          const matchingParamValues = Array.isArray(matchingParamValue) ? matchingParamValue : [matchingParamValue];
          // Encode the param
          return matchingParamValues.map(encodeURIComponent).join("/");
        }
      }

      return chunk;
    });

    // All unmatched params are query params
    const queryParams: string[] = [];
    if (retainUnusedParamsAsQuery) {
      forOwn(params || {}, (value, key) => {
        const values = Array.isArray(value) ? value : [value];
        values.forEach((v) => {
          queryParams.push(`${key}=${encodeURIComponent(v)}`);
        });
      });
    }

    // Build the path
    path = pathChunksWithParams.join("/");
    path = queryParams.length > 0 ? `${path}?${queryParams.join("&")}` : path;

    return path;
  }
}
