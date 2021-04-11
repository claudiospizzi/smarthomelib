import { ISignal, SignalDispatcher } from 'strongly-typed-events';
import { SmartHomeBase } from './SmartHomeBase';

/**
 * Constructor options for the smart home client.
 */
export interface SmartHomeClientBaseOption {
  name: string;
  remoteEndpoint: string;
  outdatedSec: number;
}

/**
 * A smart home client object base which implements the basic connect and
 * disconnect events and holds the connection state.
 */
export class SmartHomeClientBase extends SmartHomeBase {
  private connected = false;

  protected remoteEndpoint: string;

  private onConnectDispatcher = new SignalDispatcher();
  private onDisconnectDispatcher = new SignalDispatcher();

  /**
   * Create a new smart home client base.
   * @param option Client option.
   */
  constructor(option: SmartHomeClientBaseOption) {
    super({ name: option.name, outdatedSec: option.outdatedSec });

    this.remoteEndpoint = option.remoteEndpoint;

    this.onConnectEvent.subscribe(() => this.logger.info(`Connect to ${this.remoteEndpoint}`));
    this.onDisconnectEvent.subscribe(() => this.logger.info(`Disconnect from ${this.remoteEndpoint}`));
  }

  /**
   * Flag if the client is connected.
   */
  protected get isConnected(): boolean {
    return this.connected;
  }

  /**
   * Fire the client connect event.
   */
  protected onConnect(): void {
    if (!this.connected) {
      this.onConnectDispatcher.dispatch();
      this.connected = true;
    }
  }

  /**
   * The client connect event.
   */
  protected get onConnectEvent(): ISignal {
    return this.onConnectDispatcher.asEvent();
  }

  /**
   * Fire the client disconnect event.
   */
  protected onDisconnect(): void {
    if (this.connected) {
      this.onDisconnectDispatcher.dispatch();
      this.connected = false;
    }
  }

  /**
   * The client disconnect event.
   */
  protected get onDisconnectEvent(): ISignal {
    return this.onDisconnectDispatcher.asEvent();
  }
}
