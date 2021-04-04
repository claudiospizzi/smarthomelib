import { Logger } from 'tslog';
import { ISignal, SignalDispatcher } from 'strongly-typed-events';
import { ISimpleEvent, SimpleEventDispatcher } from 'strongly-typed-events';

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
  private logger: Logger;

  private initialized = false;

  protected name: string;

  private onInitializeDispatcher = new SignalDispatcher();
  private onInfoDispatcher = new SimpleEventDispatcher<string>();
  private onWarningDispatcher = new SimpleEventDispatcher<string>();
  private onErrorDispatcher = new SimpleEventDispatcher<string | Error>();

  /**
   * Initialize the base of a new smart home object.
   * @param option Connection option.
   */
  constructor(option: SmartHomeBaseOption) {
    this.logger = new Logger({ name: option.name });

    this.name = option.name;

    this.onInitializeEvent.subscribe(() => this.logger.info(`${this.name} initialize`));
    this.onInfoEvent.subscribe((info) => this.logger.info(info));
    this.onWarningEvent.subscribe((warning) => this.logger.warn(warning));
    this.onErrorEvent.subscribe((error) => this.logger.error(error));
  }

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
  public get onInitializeEvent(): ISignal {
    return this.onInitializeDispatcher.asEvent();
  }

  /**
   * Emit an info message.
   */
  protected onInfo(info: string): void {
    this.onInfoDispatcher.dispatch(info);
  }

  /**
   * Event if any info message was emitted.
   */
  public get onInfoEvent(): ISimpleEvent<string> {
    return this.onInfoDispatcher.asEvent();
  }

  /**
   * Emit a warning message.
   */
  protected onWarning(warning: string): void {
    this.onWarningDispatcher.dispatch(warning);
  }

  /**
   * Event if any warning has occurred.
   */
  public get onWarningEvent(): ISimpleEvent<string> {
    return this.onWarningDispatcher.asEvent();
  }

  /**
   * Emit an error.
   */
  protected onError(error: Error): void {
    this.onErrorDispatcher.dispatch(error);
  }

  /**
   * Event if any error has occurred.
   */
  public get onErrorEvent(): ISimpleEvent<string | Error> {
    return this.onErrorDispatcher.asEvent();
  }
}
