import * as Url from "url-parse";

export function removeUrlProtocol(url: string): string {
  const parsedUrl = new Url(url);
  parsedUrl.set("protocol", "");
  parsedUrl.set("slashes", "");
  return parsedUrl.toString();
}

/**
 * Function that returns the provided URL without the query string,
 * and an object containing all the query string parameters.
 */
export function trimAndParseQueryFromUrl(fullUrl: string): any {
  let url = fullUrl;
  const query = {};

  const urlParts = fullUrl.split("?");
  if (urlParts.length === 2) {
    url = urlParts[0];
    const queryString = urlParts[1];
    const pairs = queryString.split("&");
    for (const pair of pairs) {
      const keyValue = pair;
      const splitIndex = keyValue.indexOf("="); // values can contain the '=' character
      query[decodeURIComponent(keyValue.substring(0, splitIndex))] = decodeURIComponent(
        keyValue.substring(splitIndex + 1, keyValue.length)
      );
    }
  }

  return [url, query];
}
