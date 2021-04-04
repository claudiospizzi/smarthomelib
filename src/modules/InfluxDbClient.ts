import { InfluxDB, Point, QueryApi, WriteApi } from '@influxdata/influxdb-client';
import { StatusMessage } from './SmartHomeBase';
import { SmartHomeClientBase } from './SmartHomeClientBase';

/**
 * Constructor options for the InfluxDB client.
 */
export interface InfluxDbClientOption {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  trusted: boolean;
  token: string;
  org: string;
  bucket: string;
}

/**
 * Class representing a smart home InfluxDB client.
 */
export class InfluxDbClient extends SmartHomeClientBase {
  private client?: InfluxDB;
  private clientQueryApi?: QueryApi;
  private clientWriteApi?: WriteApi;

  private url: string;
  private trusted: boolean;
  private token: string;
  private org: string;
  private bucket: string;

  /**
   * Create the InfluxDB client object.
   * @param option Connection option.
   */
  constructor(option: InfluxDbClientOption) {
    super({
      name: 'InfluxDB client',
      remoteEndpoint: `${option.protocol}://${option.host}:${option.port}`,
    });

    this.url = `${option.protocol}://${option.host}:${option.port}`;
    this.trusted = option.trusted;
    this.token = option.token;
    this.org = option.org;
    this.bucket = option.bucket;
  }

  /**
   * Initialize the InfluxDB client.
   */
  initialize(): void {
    if (!this.isInitialized) {
      // Initialize the InfluxDB client with all required options and set the
      // query and write apis, so that they are ready to use.
      this.client = new InfluxDB({
        url: this.url,
        token: this.token,
        transportOptions: { rejectUnauthorized: this.trusted },
      });
      this.clientQueryApi = this.client.getQueryApi(this.org);
      this.clientWriteApi = this.client.getWriteApi(this.org, this.bucket);
      this.onInitialize();
      // Setup the test connection interval and invoke a test connection right now.
      this.testConnection();
      setInterval(this.testConnection, 10000);
    } else {
      this.onWarning(`${this.name} already initialized.`);
    }
  }

  /**
   * Test the connection to the InfluxDB by invoking a query.
   */
  private testConnection(): void {
    if (this.isInitialized && this.clientQueryApi !== undefined) {
      this.clientQueryApi
        .queryRaw('buckets()')
        .then(() => {
          this.onConnect();
        })
        .catch((error) => {
          this.onError(error);
          this.onDisconnect();
        });
    } else {
      this.onWarning(`${this.name} not initialized, unable to test connection.`);
    }
  }

  /**
   * Write data to the InfluxDB.
   * @param data Data to write.
   */
  write(message: StatusMessage): void {
    if (this.isInitialized && this.clientWriteApi !== undefined) {
      try {
        this.clientWriteApi.writePoint(InfluxDbClient.generatePoint(message));
      } catch (error) {
        this.onError(error);
      }
    } else {
      this.onWarning(`${this.name} not initialized, unable to write measurement.`);
    }
  }

  /**
   * Helper method to generate a point out of a status message.
   * @param message The smart home status message.
   * @returns The InfluxDB point.
   */
  private static generatePoint(message: StatusMessage) {
    let point = new Point('smarthome').tag('room', message.room).tag('device', message.device);
    if (typeof message.value === 'string') {
      point = point.stringField(message.feature, message.value);
    }
    if (typeof message.value === 'number') {
      point = point.floatField(message.feature, message.value);
    }
    if (typeof message.value === 'boolean') {
      point = point.booleanField(message.feature, message.value);
    }
    return point;
  }
}
