import { InfluxDbClientOption } from '../modules/InfluxDb';
import { Logger } from 'tslog';
import { MqttBrokerClientOption } from '../modules/MqttBroker';
import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';

/**
 * Module data with name and version.
 */
export interface ModuleData {
  name: string;
  version: string;
}

/**
 * Define the log level type.
 */
export type LogLevel = 'silly' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | undefined;

/**
 * Base configuration.
 */
export interface ConfigBase<T> {
  mqtt: {
    host: string | undefined;
    port: number | undefined;
    system: string;
  };
  influx: {
    host: string | undefined;
    port: number | undefined;
    protocol: 'http' | 'https' | undefined;
    trusted: boolean | undefined;
    token: string | undefined;
    org: string | undefined;
    bucket: string | undefined;
  };
  app: T;
}

/**
 * Config helper class.
 */
export class Config<T> {
  private logger: Logger;

  static system: string;
  static logLevel: LogLevel = 'info';

  private mqttOption: MqttBrokerClientOption;
  private influxOption: InfluxDbClientOption;
  private appOption: T;

  constructor(module: ModuleData, logLevel: LogLevel, system: string | undefined, config: ConfigBase<T>) {
    this.logger = new Logger({ displayFilePath: 'hidden', displayFunctionName: false });
    this.logger.info(`${module.name} ${module.version}`);

    if (system !== undefined) {
      Config.system = system;
    } else {
      Config.system = module.name;
    }
    if (logLevel !== undefined) {
      Config.logLevel = logLevel;
    }

    this.mqttOption = {
      host: Config.useValueOrDefault('mqtt.host', config.mqtt.host, 'localhost'),
      port: Config.useValueOrDefault('mqtt.port', config.mqtt.port, 1883),
    };
    this.influxOption = {
      host: Config.useValueOrDefault('influx.host', config.influx.host, 'localhost'),
      port: Config.useValueOrDefault('influx.port', config.influx.port, 443),
      protocol: Config.useValueOrDefault('influx.protocol', config.influx.protocol, 'https'),
      trusted: Config.useValueOrDefault('influx.trusted', config.influx.trusted, true),
      token: Config.useValueOrDefault('influx.token', config.influx.token, ''),
      org: Config.useValueOrDefault('influx.org', config.influx.org, 'default'),
      bucket: Config.useValueOrDefault('influx.bucket', config.influx.bucket, module.name),
    };
    this.appOption = config.app;
  }

  /**
   * Get the MQTT broker client option.
   */
  public get mqtt(): MqttBrokerClientOption {
    return this.mqttOption;
  }

  /**
   * Get the InfluxDB client option.
   */
  public get influx(): InfluxDbClientOption {
    return this.influxOption;
  }

  /**
   * Get the app option.
   */
  public get app(): T {
    return this.appOption;
  }

  /**
   * Load the content and parse it as JSON.
   * @param path The file path.
   * @returns The parsed object.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static loadJsonFile(path: string): any {
    try {
      path = resolvePath(path);
      const data = readFileSync(path);
      return JSON.parse(data.toString());
    } catch (error) {
      throw `Failed to load config file ${path}: ${error}`;
    }
  }

  /**
   * Function to use the provided value or fall back to the default.
   * @param reference The value reference.
   * @param value The value. Can be undefined.
   * @param defaultValue The fall back value.
   * @returns The resolved value.
   */
  static useValueOrDefault<U>(reference: string, value: U | undefined, defaultValue: U): U {
    if (value !== undefined) {
      if (typeof value !== typeof defaultValue) {
        throw new Error(`Value named ${reference} does not match the type ${typeof defaultValue}.`);
      }
      return value;
    }
    return defaultValue;
  }

  /**
   * Function to use the provided value or throw an error if its not defined.
   * @param reference The value reference.
   * @param value The value. Can be undefined.
   * @returns The value if it's not undefined.
   */
  static useValueOrThrow<U>(reference: string, value: U | undefined): U {
    if (value === undefined) {
      throw new Error(`Required value named ${reference} not specified.`);
    }
    return value;
  }
}
