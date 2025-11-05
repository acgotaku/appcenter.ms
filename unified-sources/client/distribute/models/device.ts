export enum Status {
  Provisioned,
  Unprovisioned,
}

export interface Device {
  manufacturer: string;
  deviceName: string;
  udid: string;
  osVersion: string;
  status: Status;
  ownerId: string;
  thumbnail?: string;
}
