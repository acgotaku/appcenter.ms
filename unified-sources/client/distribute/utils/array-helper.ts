export class ArrayHelper {
  public static join(values: string[], conjunction: string): string {
    let formattedString: string = values[0];
    if (values.length > 1) {
      formattedString = values.slice(0, -1).join(", ") + ` ${conjunction} ` + values[values.length - 1];
    }
    return formattedString;
  }
}
