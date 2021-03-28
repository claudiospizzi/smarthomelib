import { connect as mqttConnect, MqttClient, QoS } from 'mqtt';
import { SmartHomeDevice } from './SmartHomeDevice';
import { SmartHomeThing } from './SmartHomeThing';

/**
 * Connection options for a MQTT Broker.
 */
export type MqttBrokerOption = {
  host: string;
  port: number;
  topic: string;
};

/**
 * Message interface to the MQTT Broker.
 */
export type MqttBrokerMessage = {
  topic: string;
  message: string;
  opts: {
    retain: boolean;
    qos: QoS;
  };
};

/**
 * Class representing a MQTT Broker.
 *
 * This smart home device will emit the following message beside the default
 * events info, warning and error:
 * - connect => MqttBroker
 *     Event if a connection to the MQTT Broker was established.
 * - disconnect => MqttBroker
 *     Event if a connection to the MQTT Broker was lost.
 * - send => MqttBroker, MqttBrokerMessage
 *     All send messages to the MQTT Broker.
 */
export class MqttBroker extends SmartHomeDevice {
  private client?: MqttClient;
  private initialized = false;

  /**
   * MQTT Broker url.
   */
  public url: string;

  /**
   * Topic prefix for MQTT messages.
   */
  public topic: string;

  /**
   * Create a new MQTT Broker.
   * @param option Connection option.
   */
  constructor(option: MqttBrokerOption) {
    super('MqttBroker', option.host);

    this.url = `mqtt://${this.address}:${option.port}`;
    this.topic = option.topic;
  }

  /**
   * Initialize the MQTT Broker.
   */
  initialize(): void {
    if (!this.initialized) {
      this.emitInfo<MqttBroker>('Initialize MQTT Broker...');
      try {
        this.client = mqttConnect(this.url, {
          will: {
            topic: `${this.topic}/connected`,
            payload: '0',
            retain: true,
            qos: 2,
          },
        });
        this.client.on('connect', () => {
          this.client?.publish(`${this.topic}/connected`, '2', { retain: true, qos: 2 });
          this.emitConnect<MqttBroker>(this.url);
        });
        this.client.on('close', () => {
          this.emitDisconnect<MqttBroker>(this.url);
        });
        this.client.on('error', (error) => {
          this.emitError<MqttBroker>(error);
        });
        this.initialized = true;
      } catch (error) {
        this.emitError<MqttBroker>(error);
      }
    }
  }

  /**
   * Publish a MQTT message.
   * @param thing The smart home thing.
   * @param topic The topic to publish.
   * @param value The value to publish.
   * @param retain Option to control the MQTT message retain.
   */
  send(thing: SmartHomeThing, topic: string, value: string, retain = false): void {
    if (this.initialized && this.client !== undefined) {
      try {
        const data = {
          topic: `${this.topic}/${topic}/${thing.name}`,
          message: JSON.stringify({
            ts: Date.now(),
            val: value,
            loc: thing.location,
            desc: thing.description,
          }),
          opts: {
            retain: retain,
            qos: 2 as QoS,
          },
        };
        this.client.publish(data.topic, data.message, data.opts);
        this.emitSend<MqttBroker, MqttBrokerMessage>(this.url, data);
      } catch (error) {
        this.emitError<MqttBroker>(error);
      }
    } else {
      this.emitWarning<MqttBroker>('MQTT Broker not initialized, unable to publish message.');
    }
  }
}
