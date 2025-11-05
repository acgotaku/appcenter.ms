import { isValid } from "date-fns";

export class DateRange {
  constructor(public start?: Date, public end?: Date) {}
  public isValid() {
    return this.start && this.end && this.start !== this.end && isValid(this.start) && isValid(this.end) && this.start <= this.end;
  }
}
