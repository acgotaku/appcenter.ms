/**
 * Options accepted by the Http library calls.
 * These options closely mimic `fetch` API options.
 *
 * @interface IHttpOptions
 */
export interface IHttpOptions {
  responseType?: string;
  /**
   * The parameters to be passed to the query.
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
   */
  params?: { [key: string]: string | string[] | undefined };
  body?: any;
  headers?: { [key: string]: string };
  credentials?: string;
  forceRefreshToken?: boolean;
  noBifrostToken?: boolean;
  noJson?: boolean;
}

export const RESPONSE_TYPES = {
  JSON: "json",
  BLOB: "blob",
  TEXT: "text",
  ARRAY_BUFFER: "arrayBuffer",
};
