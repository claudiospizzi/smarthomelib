import { InfluxDB, Point, QueryApi, WriteApi } from '@influxdata/influxdb-client';
import { SmartHomeClientBase } from './../bases/SmartHomeClientBase';
import { StatusMessage } from './../bases/SmartHomeBase';
import { LogLevelOption } from '../helpers/Config';

/**
 * Constructor options for the InfluxDB client.
 */
export interface InfluxDbClientOption extends LogLevelOption {
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
      name: `InfluxDbClient(${option.host})`,
      remoteEndpoint: `${option.protocol}://${option.host}:${option.port}`,
      outdatedSec: 15,
      logLevel: option.logLevel,
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
      // Initialize the InfluxDB client with all
      // required options and set the query and
      // write apis, so that they are ready to use.
      this.client = new InfluxDB({
        url: this.url,
        token: this.token,
        transportOptions: { rejectUnauthorized: this.trusted },
      });
      this.clientQueryApi = this.client.getQueryApi(this.org);
      this.clientWriteApi = this.client.getWriteApi(this.org, this.bucket);
      this.onInitialize();
      // Setup the test connection interval and
      // invoke a test connection right now.
      this.testConnection();
      setInterval(() => {
        this.testConnection();
      }, 10000);
    } else {
      this.logger.warn('Already initialized.');
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
          this.logger.debug('InfluxDB connection test was successful.');
          this.onConnect();
          this.onActive();
        })
        .catch((error) => {
          this.logger.debug('InfluxDB connection test has failed.');
          this.logger.error(error);
          this.onDisconnect();
        });
    } else {
      this.logger.warn('Not initialized, unable to test connection.');
    }
  }

  /**
   * Write data to the InfluxDB.
   * @param data Data to write.
   */
  write(message: StatusMessage): void {
    if (this.isInitialized && this.clientWriteApi !== undefined) {
      try {
        const point = InfluxDbClient.generatePoint(message);
        this.logger.debug(`Write a point to the database: ${point}`);
        this.clientWriteApi.writePoint(point);
        this.onActive();
      } catch (error) {
        this.logger.error(error);
      }
    } else {
      this.logger.warn('Not initialized, unable to write measurement.');
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
