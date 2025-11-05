export class StringHelper {
  // https://gist.github.com/fauxtrot/8349c9bd2708a8fa8455
  public static format(format: string, ...args: any[]): string {
    let i: number;
    if (args instanceof Array) {
      for (i = 0; i < args.length; i++) {
        format = format.replace(new RegExp("\\{" + i + "\\}", "gm"), args[i]);
      }
      return format;
    }
    for (i = 0; i < arguments.length - 1; i++) {
      format = format.replace(new RegExp("\\{" + i + "\\}", "gm"), arguments[i + 1]);
    }
    return format;
  }

  public static pluralize(quantity: number, singular: string, plural: string) {
    if (quantity === 1) {
      return singular;
    } else {
      return plural;
    }
  }
}
