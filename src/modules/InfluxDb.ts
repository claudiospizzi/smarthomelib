import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { SmartHomeBase } from './SmartHomeBase';

/**
 * Constructor options for the InfluxDB.
 */
export interface InfluxDbOption {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  trusted: boolean;
  token: string;
  org: string;
  bucket: string;
}

/**
 * A smart home InfluxDB point.
 */
export interface InfluxDbData {
  system: string;
  room: string;
  device: string;
  feature: string;
  value: string | number | boolean;
}

/**
 * Class representing a smart home InfluxDB.
 */
export class InfluxDb extends SmartHomeBase {
  private client?: InfluxDB;

  private url: string;
  private trusted: boolean;
  private token: string;
  private org: string;
  private bucket: string;

  /**
   * Initialize the InfluxDB.
   * @param option Connection option.
   */
  constructor(option: InfluxDbOption) {
    super({
      name: 'InfluxDb',
      localEndpoint: undefined,
      remoteEndpoint: `${option.protocol}://${option.host}:${option.port}`,
    });

    this.url = `${option.protocol}://${option.host}:${option.port}`;
    this.trusted = option.trusted;
    this.token = option.token;
    this.org = option.org;
    this.bucket = option.bucket;
  }

  /**
   * Initialize the InfluxDB.
   */
  initialize(): void {
    if (this.client === undefined) {
      this.onInfo('Initialize InfluxDB');
      this.client = new InfluxDB({
        url: this.url,
        token: this.token,
        transportOptions: { rejectUnauthorized: this.trusted },
      });
      this.testConnection((error) => {
        if (error !== undefined) {
          this.onError(error);
          this.onDisconnect();
        } else {
          this.onConnect();
        }
      });
    } else {
      this.onWarning('InfluxDB already initialized.');
    }
  }

  private testConnection(callback: (result: Error | undefined) => void): void {
    if (this.client !== undefined) {
      const queryApi = this.client.getQueryApi(this.org);
      queryApi.queryRows('buckets()', {
        next() {
          // Do nothing with the result rows.
        },
        error(error: Error) {
          callback(error);
        },
        complete() {
          callback(undefined);
        },
      });
    } else {
      this.onWarning('InfluxDB not initialized, unable to test connection.');
    }
  }

  /**
   * Write data to the InfluxDB.
   * @param data Data to write.
   */
  async write(data: InfluxDbData): Promise<void> {
    if (this.client !== undefined) {
      try {
        const writeApi = this.client.getWriteApi(this.org, this.bucket);
        await writeApi.writePoint(InfluxDb.generatePoint(data));
      } catch (error) {
        this.onError(error);
      }
    } else {
      this.onWarning('InfluxDB not initialized, unable to write measurement.');
    }
  }

  private static generatePoint(data: InfluxDbData) {
    let point = new Point('smarthome').tag('room', data.room).tag('device', data.device);
    if (typeof data.value === 'string') {
      point = point.stringField(data.feature, data.value);
    }
    if (typeof data.value === 'number') {
      point = point.floatField(data.feature, data.value);
    }
    if (typeof data.value === 'boolean') {
      point = point.booleanField(data.feature, data.value);
    }
    return point;
  }
}
