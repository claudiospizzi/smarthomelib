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
  outdatedSec: number;
  logLevel: 'silly' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}

/**
 * Base class for a smart home server and/or client.
 */
export abstract class SmartHomeBase {
  private initialized = false;
  private lastActivity = new Date(0);

  protected logger: Logger;
  protected name: string;
  protected outdatedSec: number;

  private onInitializeDispatcher = new SignalDispatcher();
  private onActivityDispatcher = new SignalDispatcher();

  /**
   * Initialize the base of a new smart home object.
   * @param option Connection option.
   */
  constructor(option: SmartHomeBaseOption) {
    this.logger = new Logger({
      prefix: [option.name],
      displayFilePath: 'hidden',
      displayFunctionName: false,
      minLevel: option.logLevel,
    });

    this.name = option.name;
    this.outdatedSec = option.outdatedSec;

    this.onInitializeEvent.subscribe(() => this.logger.info('Initialize'));
    this.onActivityDispatcher.subscribe(() => (this.lastActivity = new Date()));
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

  /**
   * Check if the smart home device is active.
   */
  protected get isActive(): boolean {
    const outdated = new Date(Date.now() - this.outdatedSec * 1000);
    return outdated < this.lastActivity;
  }

  /**
   * Fire the activity event.
   */
  protected onActive(): void {
    this.onActivityDispatcher.dispatch();
  }

  /**
   * The activity event.
   */
  protected get onActivityEvent(): ISignal {
    return this.onActivityDispatcher.asEvent();
  }
}
