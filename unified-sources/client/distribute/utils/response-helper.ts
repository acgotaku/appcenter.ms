import { isString, pick } from "lodash";

export interface ResponseBase {
  status?: number;
  statusText?: string;
  message?: string;
}

export class ResponseHelper {
  public static extractResponse(response: any): ResponseBase {
    if (response === null || response === undefined) {
      return { message: "" };
    }

    const keys = ["status", "statusText", "message"];
    if (isString(response)) {
      try {
        const result = JSON.parse(response);
        return pick(result, keys);
      } catch (error) {
        return { message: response };
      }
    } else {
      return pick(response, keys);
    }
  }
}
