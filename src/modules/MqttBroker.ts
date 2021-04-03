import { connect as mqttConnect, MqttClient } from 'mqtt';
import { IEvent, EventDispatcher } from 'strongly-typed-events';
import { SmartHomeBase } from './SmartHomeBase';

/**
 * Constructor options for the MQTT broker.
 */
export interface MqttBrokerOption {
  host: string;
  port: number;
  system: string;
}

/**
 * A smart home MQTT status message.
 */
export interface MqttBrokerStatusMessage {
  system: string;
  room: string;
  device: string;
  feature: string;
  value: string | number | boolean;
}

/**
 * A smart home MQTT action message.
 */
export interface MqttBrokerActionMessage {
  system: string;
  room: string;
  device: string;
  feature: string;
  action: string;
}

/**
 * Class representing a smart home MQTT broker.
 */
export class MqttBroker extends SmartHomeBase {
  private client?: MqttClient;

  private url: string;
  private system: string;

  private onActionMessageDispatcher: EventDispatcher<MqttBroker, MqttBrokerActionMessage>;
  private onStatusMessageDispatcher: EventDispatcher<MqttBroker, MqttBrokerStatusMessage>;

  /**
   * Initialize the MQTT broker.
   * @param option Connection option.
   */
  constructor(option: MqttBrokerOption) {
    super({
      name: 'MqttBroker',
      localEndpoint: undefined,
      remoteEndpoint: `mqtt://${option.host}:${option.port}`,
    });

    this.url = `mqtt://${option.host}:${option.port}`;
    this.system = option.system;

    this.onActionMessageDispatcher = new EventDispatcher<MqttBroker, MqttBrokerActionMessage>();
    this.onStatusMessageDispatcher = new EventDispatcher<MqttBroker, MqttBrokerStatusMessage>();
  }

  /**
   * Fire the action message event.
   */
  private onActionMessage(message: MqttBrokerActionMessage): void {
    this.onActionMessageDispatcher.dispatch(this, message);
  }

  /**
   * The action message event.
   */
  public get onActionMessageEvent(): IEvent<MqttBroker, MqttBrokerActionMessage> {
    return this.onActionMessageDispatcher.asEvent();
  }

  /**
   * Fire the status message event.
   */
  private onStatusMessage(message: MqttBrokerStatusMessage): void {
    this.onStatusMessageDispatcher.dispatch(this, message);
  }

  /**
   * The status message event.
   */
  public get onStatusMessageEvent(): IEvent<MqttBroker, MqttBrokerStatusMessage> {
    return this.onStatusMessageDispatcher.asEvent();
  }

  /**
   * Initialize the MQTT broker.
   */
  initialize(): void {
    if (this.client === undefined) {
      this.onInfo('Initialize MQTT broker');
      this.client = mqttConnect(this.url, {
        will: {
          topic: `${this.system}/connected`,
          payload: '0',
          retain: true,
          qos: 2,
        },
      });
      this.client.on('connect', () => {
        this.publishConnected('1');
        this.onConnect();
      });
      this.client.on('close', () => {
        this.onDisconnect();
      });
      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message.toString());
      });
      this.client.on('error', (error) => {
        this.onError(error);
      });
    } else {
      this.onWarning('MQTT broker already initialized.');
    }
  }

  private handleMessage(topic: string, message: string): void {
    const topics: string[] = message.split('/');
    if (topics.length === 4 && MqttBroker.isValidJSON(message)) {
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
      this.onWarning(`Unknown message received on topic '${topic}': ${message}`);
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
    if (this.client !== undefined) {
      const topic = `${system}/${room}/${device}/${feature}/${action}`;
      this.client.subscribe(topic);
    } else {
      this.onWarning('MQTT broker not initialized, unable to subscribe to action message.');
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
    if (this.client !== undefined) {
      const topic = `${system}/${room}/${device}/${feature}`;
      this.client.subscribe(topic);
    } else {
      this.onWarning('MQTT broker not initialized, unable to subscribe to status message.');
    }
  }

  /**
   * Publish an action message.
   * @param message The message to publish.
   * @param retain Optional flag to retain the message in the broker.
   */
  publishAction(message: MqttBrokerActionMessage, retain = false): void {
    if (this.client !== undefined) {
      const topic = `${message.system}/${message.room}/${message.device}/${message.feature}/${message.action}`;
      this.client.publish(topic, JSON.stringify({ ts: Date.now() }), { retain: retain, qos: 2 });
    } else {
      this.onWarning('MQTT broker not initialized, unable to publish the action message.');
    }
  }

  /**
   * Publish a status message.
   * @param message The message to publish.
   * @param retain Optional flag to retain the message in the broker.
   */
  publishStatus(message: MqttBrokerStatusMessage, retain = false): void {
    if (this.client !== undefined) {
      const topic = `${message.system}/${message.room}/${message.device}/${message.feature}`;
      this.client.publish(topic, JSON.stringify({ ts: Date.now(), val: message.value }), { retain: retain, qos: 2 });
    } else {
      this.onWarning('MQTT broker not initialized, unable to publish the status message.');
    }
  }

  /**
   * Publish the current connection state.
   * @param connected Connection status: 1 = having device/hardware issues, 2 = fully operational.
   */
  publishConnected(connected: '1' | '2'): void {
    if (this.client !== undefined) {
      this.client.publish(`${this.system}/connected`, connected, { retain: true, qos: 2 });
    } else {
      this.onWarning('MQTT broker not initialized, unable to publish the connection state.');
    }
  }
}
