import { DataType } from 'aws-sdk/clients/frauddetector';

export interface CacheValue {
  type: DataType;
  value: string | boolean | number | Date | object;
}
