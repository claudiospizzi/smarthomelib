import { ISignal, SignalDispatcher } from 'strongly-typed-events';
import { Logger } from 'tslog';

/**
 * A smart home status message.
 */
export interface StatusMessage {
  system: string;
  room: string;
  device: string;
  feature: string;
  value: string | number | boolean;
}

/**
 * A smart home action message.
 */
export interface ActionMessage {
  system: string;
  room: string;
  device: string;
  feature: string;
  action: string;
}

/**
 * Constructor options for the smart home base.
 */
export interface SmartHomeBaseOption {
  name: string;
}

/**
 * Base class for a smart home server and/or client.
 */
export abstract class SmartHomeBase {
  private initialized = false;

  protected logger: Logger;
  protected name: string;

  private onInitializeDispatcher = new SignalDispatcher();

  /**
   * Initialize the base of a new smart home object.
   * @param option Connection option.
   */
  constructor(option: SmartHomeBaseOption) {
    this.logger = new Logger({ prefix: [option.name], displayFilePath: 'hidden', displayFunctionName: false }); // name: option.name,  ignoreStackLevels: 3 displayLoggerName: false,

    this.name = option.name;

    this.onInitializeEvent.subscribe(() => this.logger.info('Initialize'));
  }

  /**
   * Get the current initialization state.
   */
  protected get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Fire the initialize event.
   */
  protected onInitialize(): void {
    if (!this.initialized) {
      this.onInitializeDispatcher.dispatch();
      this.initialized = true;
    }
  }

  /**
   * The initialize event.
   */
  protected get onInitializeEvent(): ISignal {
    return this.onInitializeDispatcher.asEvent();
  }
}
