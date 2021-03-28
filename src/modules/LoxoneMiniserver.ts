import { createSocket as dgramCreateSocket, Socket } from 'dgram';
import { SmartHomeDevice } from './SmartHomeDevice';
import { SmartHomeThing } from './SmartHomeThing';

/**
 * Connection options for a Loxone Miniserver.
 */
export type LoxoneMiniserverOption = {
  host: string;
  virtualInputPort: number;
  virtualOutputPort: number;
};

/**
 * Message interface to the Loxone Miniserver.
 */
export type LoxoneMiniserverMessage = {
  thing: string;
  property: string;
  value: string;
  location: string | undefined;
  description: string | undefined;
};

/**
 * Class representing a Loxone Miniserver.
 *
 * This smart home device will emit the following message beside the default
 * events info, warning and error:
 * - connect => LoxoneMiniserver
 *     Event if a connection was established.
 * - disconnect => LoxoneMiniserver
 *     Event if a connection was lost.
 * - receive => LoxoneMiniserver, LoxoneMiniserverMessage
 *     All received messages from the Loxone Miniserver.
 * - send => LoxoneMiniserver, LoxoneMiniserverMessage
 *     All send messages to the Loxone Miniserver.
 */
export class LoxoneMiniserver extends SmartHomeDevice {
  private server?: Socket;
  public initialized = false;

  /**
   * Port for the Loxone virtual input.
   */
  public viPort: number;

  /**
   * Port for the Loxone virtual output.
   */
  public voPort: number;

  /**
   * Create a new Loxone Miniserver.
   * @param option Connection option.
   */
  constructor(option: LoxoneMiniserverOption) {
    super('LoxoneMiniserver', option.host);

    this.viPort = option.virtualInputPort;
    this.voPort = option.virtualOutputPort;
  }

  /**
   * Initialize the Loxone Miniserver.
   */
  initialize(): void {
    if (!this.initialized) {
      this.emitInfo<LoxoneMiniserver>('Initialize Loxone Miniserver...');
      try {
        this.server = dgramCreateSocket('udp4');
        this.server.on('listening', () => {
          this.emitConnect<LoxoneMiniserver>(`${this.address}:${this.viPort}`, `udp://0.0.0.0:${this.voPort}`);
        });
        this.server.on('close', () => {
          this.emitDisconnect<LoxoneMiniserver>(`${this.address}:${this.viPort}`, `udp://0.0.0.0:${this.voPort}`);
        });
        this.server.on('message', (msg, rinfo) => {
          let thing = '', property = '', value = '';
          let location: string | undefined, description: string | undefined;
          const msgParts: string[] = msg.toString().split(',');
          for (const msgPart of msgParts)
          {
            const msgPartKey = msgPart.substring(0, 2);
            const msgPartValue = msgPart.substring(2);
            switch (msgPartKey) {
              case 't=': { thing = msgPartValue; break; }
              case 'p=': { property = msgPartValue; break; }
              case 'v=': { value = msgPartValue; break; }
              case 'l=': { location = msgPartValue; break; }
              case 'd=': { description = msgPartValue; break; }
            }
          }
          if (thing !== '' && property !== '' && value !== '') {
            this.emitReceive<LoxoneMiniserver, LoxoneMiniserverMessage>(rinfo.address, {
              thing: thing,
              property: property,
              value: value,
              location: location,
              description: description
            });
          }
        });
        this.server.on('error', (error) => {
          this.emitError<LoxoneMiniserver>(error);
          // this.server.close();
        });
        this.server.bind(this.voPort);
        this.initialized = true;
      } catch (error) {
        this.emitError<LoxoneMiniserver>(error);
      }
    }
  }

  /**
   * Send a message to the Loxone Miniserver.
   * @param thing The smart home thing.
   * @param measure The measure to send.
   * @param value The value to send.
   */
  send(thing: SmartHomeThing, property: string, value: string): void {
    if (this.initialized && this.server !== undefined) {
      const message = `t=${thing.name} p=${property} v=${value}`;
      const data = Buffer.from(message);
      this.server.send(data, this.viPort, this.address, (error) => {
        if (error === null) {
          this.emitSend<LoxoneMiniserver, LoxoneMiniserverMessage>(`${this.address}:${this.viPort}`, {
            thing: thing.name,
            property: property,
            value: value,
            location: undefined,
            description: undefined
          });
        } else {
          this.emitError<LoxoneMiniserver>(error);
        }
      });
    } else {
      this.emitWarning<LoxoneMiniserver>('Loxone Miniserver not initialized, unable to send message.');
    }
  }
}
