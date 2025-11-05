//
// Create a Blob from a base64 string.
// https://stackoverflow.com/a/16245768
//

export function base64ToBlob(b64Data: string, contentType: string, sliceSize: number = 512): any {
  const byteCharacters = atob(b64Data);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    // tslint:disable-next-line:prefer-array-literal
    const byteNumbers = [...Array(slice.length)];
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}
