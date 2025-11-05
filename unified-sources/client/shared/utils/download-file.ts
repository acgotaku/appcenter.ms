import { isSafari } from "./environment";
type ContentType = "application/json" | "text/plain" | "text/csv" | "application/octet-stream";

/**
 * Browser needs some time to open the blob.
 * So need to delay revoking.
 */
const revokeTimeout = 5000;

/**
 * Downloads provided content as a file using browser Blob/File API.
 */
export function downloadFile(content: BufferSource | Blob | string, fileName: string, contentType: ContentType): void {
  const blobContent = [content];
  const blob =
    isSafari && typeof File === "function"
      ? new File(blobContent as any, fileName, { type: contentType })
      : new Blob(blobContent, { type: contentType });

  //@ts-ignore
  if (typeof window.navigator.msSaveBlob !== "undefined") {
    //@ts-ignore
    // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created.
    // These URLs will no longer resolve as the data backing the URL has been freed."
    window.navigator.msSaveBlob(blob, fileName);
    return;
  }

  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement("a");

  tempLink.href = url;
  tempLink.setAttribute("download", fileName);

  if (!isSafari) {
    tempLink.setAttribute("target", "_blank");
  }

  // append element, emulate click, and remove it
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);

  setTimeout(() => {
    // Each time you call createObjectURL(), a new object URL is created, even if you've already created one for the same object.
    // Each of these must be released by calling URL.revokeObjectURL() when you no longer need them.
    // Browsers will release these automatically when the document is unloaded;
    // however, for optimal performance and memory usage, if there are safe times when you can explicitly unload them, you should do so.
    URL.revokeObjectURL(url);
  }, revokeTimeout);
}
