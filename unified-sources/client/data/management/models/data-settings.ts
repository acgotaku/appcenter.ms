import { observable } from "mobx";
import { Model } from "../../lib";

export class DiagnosticsRetentionPolicy {
  key?: string;
  value?: number;
  label?: string;

  public constructor(init?: Partial<DiagnosticsRetentionPolicy>) {
    Object.assign(this, init);
  }
}

export interface IDataRetentionPolicy {
  retentionInDays: number;
}

export class SerializedDataRetentionPolicy {
  public retention_in_days?: number;
}

export class DeserializedDataRetentionPolicy {
  public retentionInDays?: number;
}

export class DataRetentionPolicy extends Model<DeserializedDataRetentionPolicy> implements DeserializedDataRetentionPolicy {
  @observable public retentionInDays?: number;
}
