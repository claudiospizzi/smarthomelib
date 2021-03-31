import { InfluxDB, Point, FluxTableMetaData } from '@influxdata/influxdb-client';
import { SmartHomeDevice } from './SmartHomeDevice';
import { SmartHomeThing } from './SmartHomeThing';

/**
 * Connection options for an InfluxDB v2.
 */
export type InfluxDb2Option = {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  token: string;
  org: string;
  bucket: string;
};

/**
 * Message interface to the InfluxDB.
 */
export type InfluxDb2Message = {
  points: Point[];
};

/**
 * Class representing a InfluxDB v2.
 *
 * This smart home device will emit the following message beside the default
 * events info, warning and error:
 * - connect => InfluxDb
 *     Event if a connection to the InfluxDB v2 was established.
 * - disconnect => InfluxDb
 *     Event if a connection to the InfluxDB v2 was lost.
 * - send => InfluxDb, InfluxDbMessage
 *     All send messages to the InfluxDB v2.
 */
export class InfluxDb2 extends SmartHomeDevice {
  private client?: InfluxDB;
  public initialized = false;

  /**
   * InfluxDB v2 connection url.
   */
  public url: string;

  /**
   * InfluxDB v2 authentication token.
   */
  private token: string;

  /**
   * InfluxDB v2 organization.
   */
  public org: string;

  /**
   * InfluxDB v2 bucket.
   */
  public bucket: string;

  /**
   * Create a new InfluxDB v2.
   * @param option Connection option.
   */
  constructor(option: InfluxDb2Option) {
    super('InfluxDb2', option.host);

    this.url = `${option.protocol}://${option.host}:${option.port}`;
    this.token = option.token;
    this.org = option.org;
    this.bucket = option.bucket;
  }

  /**
   * Initialize the InfluxDB v2.
   */
  initialize(): void {
    if (!this.initialized) {
      this.emitInfo<InfluxDb2>('Initialize InfluxDB v2...');
      try {
        this.client = new InfluxDB({
          url: this.url,
          token: this.token,
        });
        const queryApi = this.client.getQueryApi(this.org);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        queryApi.queryRows('buckets()', {
          next(row: string[], tableMeta: FluxTableMetaData) {
            self.emitInfo(JSON.stringify(tableMeta.toObject(row)));
          },
          error(error: Error) {
            self.emitError(error);
            self.emitDisconnect<InfluxDb2>(self.url);
          },
          complete() {
            self.emitConnect<InfluxDb2>(self.url);
          },
        });
        this.initialized = true;
      } catch (error) {
        this.emitError<InfluxDb2>(error);
      }
    }
  }

  /**
   * Write a InfluxDB measurement.
   * @param thing The smart home thing.
   * @param measurement The InfluxDB measurement.
   * @param field The value field name.
   * @param value The value itself.
   */
  async send(thing: SmartHomeThing, measurement: string, field: string, value: string): Promise<void> {
    if (this.initialized && this.client !== undefined) {
      try {
        const writeApi = this.client.getWriteApi(this.org, this.bucket);
        let point = new Point(measurement);
        if (thing.location !== '') {
          point = point.tag('location', thing.location);
        }
        if (thing.description !== '') {
          point = point.tag('description', thing.description);
        }
        if (value === 'true' || value === 'false') {
          point = point.booleanField(field, value === 'true');
        } else if (Number.isNaN(value)) {
          const valueNumber = Number.parseFloat(value);
          if (Number.isInteger(valueNumber)) {
            point = point.intField(field, valueNumber);
          } else {
            point = point.floatField(field, valueNumber);
          }
        } else {
          point = point.stringField(field, value);
        }
        writeApi.writePoint(point);
        await writeApi.close();
        this.emitSend<InfluxDb2, InfluxDb2Message>(this.url, { points: [point] });
      } catch (error) {
        this.emitError(error);
      }
    } else {
      this.emitWarning<InfluxDb2>('InfluxDB v2 not initialized, unable to write measurement.');
    }
  }
}
