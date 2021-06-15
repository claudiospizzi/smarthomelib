import { ActionMessage, StatusMessage } from './../bases/SmartHomeBase';
import { connect as mqttConnect, MqttClient } from 'mqtt';
import { IEvent, EventDispatcher } from 'strongly-typed-events';
import { SmartHomeClientBase } from './../bases/SmartHomeClientBase';

/**
 * Type used as connection callback to check, if the devices are connected.
 */
export type MqttBrokerClientDeviceConnectedCallback = () => boolean;

/**
 * Constructor options for the MQTT broker client.
 */
export interface MqttBrokerClientOption {
  host: string;
  port: number;
  system: string;
}

/**
 * Class representing a smart home MQTT broker client.
 */
export class MqttBrokerClient extends SmartHomeClientBase {
  private client?: MqttClient;
  private subscriptions: Array<string> = [];

  private url: string;
  private system: string;

  private onActionMessageDispatcher = new EventDispatcher<MqttBrokerClient, ActionMessage>();
  private onStatusMessageDispatcher = new EventDispatcher<MqttBrokerClient, StatusMessage>();

  private deviceConnectedCallback: MqttBrokerClientDeviceConnectedCallback = () => {
    return false;
  };

  /**
   * Create the MQTT broker client object.
   * @param option Connection option.
   */
  constructor(option: MqttBrokerClientOption) {
    super({
      name: `MqttBrokerClient(${option.host})`,
      remoteEndpoint: `mqtt://${option.host}:${option.port}`,
      outdatedSec: 15,
    });

    this.url = `mqtt://${option.host}:${option.port}`;
    this.system = option.system;

    setInterval(() => this.testDeviceConnected(), 10000);
  }

  /**
   * Fire the action message event.
   */
  private onActionMessage(message: ActionMessage): void {
    this.onActionMessageDispatcher.dispatch(this, message);
  }

  /**
   * The action message event.
   */
  public get onActionMessageEvent(): IEvent<MqttBrokerClient, ActionMessage> {
    return this.onActionMessageDispatcher.asEvent();
  }

  /**
   * Fire the status message event.
   */
  private onStatusMessage(message: StatusMessage): void {
    this.onStatusMessageDispatcher.dispatch(this, message);
  }

  /**
   * The status message event.
   */
  public get onStatusMessageEvent(): IEvent<MqttBrokerClient, StatusMessage> {
    return this.onStatusMessageDispatcher.asEvent();
  }

  /**
   * Initialize the MQTT broker.
   */
  initialize(): void {
    if (!this.isInitialized) {
      this.client = mqttConnect(this.url, {
        will: {
          topic: `${this.system}/connected`,
          payload: '0',
          retain: true,
          qos: 2,
        },
      });
      this.client.on('connect', () => {
        this.onActive();
        this.onConnect();
        this.publishDeviceConnected(false);
        for (const topic of this.subscriptions) {
          this.client?.subscribe(topic);
        }
      });
      this.client.on('close', () => {
        this.onDisconnect();
      });
      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message.toString());
      });
      this.client.on('error', (error) => {
        this.logger.error(error);
      });
      this.onInitialize();
      // Setup the test connection interval but
      // don't invoke a test connection right now
      // as the client will fire an connect event.
      setInterval(() => {
        this.testConnection();
      }, 10000);
    } else {
      this.logger.warn('Initialization failed, already initialized.');
    }
  }

  /**
   * Test the connection to the MQTT broker.
   */
  private testConnection(): void {
    if (this.isInitialized && this.client !== undefined) {
      if (this.client.connected) {
        this.logger.debug('MQTT broker connection test was successful.');
        this.onActive();
      } else {
        this.logger.debug('MQTT broker connection test has failed.');
      }
    } else {
      this.logger.warn('MQTT broker not initialized, unable to test connection.');
    }
  }

  private handleMessage(topic: string, message: string): void {
    this.logger.debug(`Message received on topic '${topic}': ${message}`);
    const topics: string[] = message.split('/');
    if (topics.length === 4 && MqttBrokerClient.isValidJSON(message)) {
      this.onStatusMessage({
        system: topics[0],
        room: topics[1],
        device: topics[2],
        feature: topics[3],
        value: JSON.parse(message).val,
      });
    } else if (topics.length === 5) {
      this.onActionMessage({
        system: topics[0],
        room: topics[1],
        device: topics[2],
        feature: topics[3],
        action: topics[4],
      });
    } else {
      this.logger.warn(`Failed to parse message received on topic '${topic}': ${message}`);
    }
  }

  private static isValidJSON(string: string): boolean {
    // Source of this code:
    // https://github.com/prototypejs/prototype/blob/560bb59414fc9343ce85429b91b1e1b82fdc6812/src/prototype/lang/string.js#L699
    if (/^\s*$/.test(string)) return false; // is blank?
    string = string.replace(/\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    string = string.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g, ']');
    string = string.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return /^[\],:{}\s]*$/.test(string);
  }

  /**
   * Subscribe to action messages.
   * @param system The system. Default is the initialized system.
   * @param room The room. Default is any room.
   * @param device The device. Default is any device.
   * @param feature The feature. Default is any feature.
   * @param action The action. Default is any action.
   */
  subscribeAction(system = this.system, room = '+', device = '+', feature = '+', action = '+'): void {
    const topic = `${system}/${room}/${device}/${feature}/${action}`;
    this.subscriptions.push(topic);
    if (this.client !== undefined) {
      this.client.subscribe(topic);
    }
  }

  /**
   * Subscribe to status messages.
   * @param system The system. Default is the initialized system.
   * @param room The room. Default is any room.
   * @param device The device. Default is any device.
   * @param feature The feature. Default is any feature.
   */
  subscribeStatus(system = this.system, room = '+', device = '+', feature = '+'): void {
    const topic = `${system}/${room}/${device}/${feature}`;
    this.subscriptions.push(topic);
    if (this.client !== undefined) {
      this.client.subscribe(topic);
    }
  }

  /**
   * Publish an action message.
   * @param message The message to publish.
   * @param retain Optional flag to retain the message in the broker.
   */
  publishAction(message: ActionMessage, retain = false): void {
    if (this.client !== undefined) {
      const topic = `${message.system}/${message.room}/${message.device}/${message.feature}/${message.action}`;
      const msg = JSON.stringify({ ts: Date.now() });
      this.logger.debug(`Publish action message on topic '${topic}': ${msg}`);
      this.client.publish(topic, msg, { retain: retain, qos: 2 });
    } else {
      this.logger.warn('Not initialized, unable to publish the action message.');
    }
  }

  /**
   * Publish a status message.
   * @param message The message to publish.
   * @param retain Optional flag to retain the message in the broker.
   */
  publishStatus(message: StatusMessage, retain = false): void {
    if (this.client !== undefined) {
      const topic = `${message.system}/${message.room}/${message.device}/${message.feature}`;
      const msg = JSON.stringify({ ts: Date.now(), val: message.value });
      this.logger.debug(`Publish status message on topic '${topic}': ${msg}`);
      this.client.publish(topic, msg, { retain: retain, qos: 2 });
    } else {
      this.logger.warn('Not initialized, unable to publish the status message.');
    }
  }

  /**
   * Publish the current connection state.
   * @param connected Connection status: 1 = having device/hardware issues, 2 = fully operational.
   */
  private publishDeviceConnected(deviceConnected: boolean): void {
    if (this.client !== undefined) {
      this.client.publish(`${this.system}/connected`, deviceConnected ? '2' : '1', { retain: true, qos: 2 });
    } else {
      this.logger.warn('Not initialized, unable to publish the connection state.');
    }
  }

  /**
   * Set the callback used to determine if the devices are connected.
   * @param deviceConnectedCallback The callback function.
   */
  setDeviceConnectedCallback(deviceConnectedCallback: MqttBrokerClientDeviceConnectedCallback): void {
    this.deviceConnectedCallback = deviceConnectedCallback;
  }

  /**
   * Function to check if the devices are connected.
   */
  private testDeviceConnected(): void {
    const deviceConnected = this.deviceConnectedCallback();
    this.publishDeviceConnected(deviceConnected);
    if (deviceConnected) {
      this.logger.debug('Smart Home device connection test was successful.');
    } else {
      this.logger.debug('Smart Home device connection test has failed.');
    }
  }
}
