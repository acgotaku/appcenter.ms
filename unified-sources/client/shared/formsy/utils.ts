const funcs = {
  arraysDiffer(a: any, b: any) {
    let isDifferent = false;
    if (a.length !== b.length) {
      isDifferent = true;
    } else {
      a.forEach((item: any, index: any) => {
        if (!this.isSame(item, b[index])) {
          isDifferent = true;
        }
      }, this);
    }
    return isDifferent;
  },
  objectsDiffer(a: any, b: any) {
    let isDifferent = false;
    if (Object.keys(a).length !== Object.keys(b).length) {
      isDifferent = true;
    } else {
      Object.keys(a).forEach((key) => {
        if (!this.isSame(a[key], b[key])) {
          isDifferent = true;
        }
      }, this);
    }
    return isDifferent;
  },
  isSame(a: any, b: any) {
    if (Array.isArray(a)) {
      return !this.arraysDiffer(a, b);
    } else if (typeof a === "object" && a !== null) {
      return !this.objectsDiffer(a, b);
    }

    return a === b;
  },
};

export default funcs;
