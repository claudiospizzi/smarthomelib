import { Logger } from 'tslog';
import { ISignal, SignalDispatcher } from 'strongly-typed-events';
import { ISimpleEvent, SimpleEventDispatcher } from 'strongly-typed-events';

/**
 * Constructor options for the smart home base.
 */
export interface SmartHomeBaseOption {
  name: string;
  localEndpoint: string | undefined;
  remoteEndpoint: string | undefined;
}

/**
 * Base class for a smart home server and/or client.
 */
export abstract class SmartHomeBase {
  private logger: Logger;

  private localEndpoint: string | undefined;
  private remoteEndpoint: string | undefined;

  private onBindDispatcher: SignalDispatcher;
  private onUnbindDispatcher: SignalDispatcher;
  private onConnectDispatcher: SignalDispatcher;
  private onDisconnectDispatcher: SignalDispatcher;
  private onInfoDispatcher: SimpleEventDispatcher<string>;
  private onWarningDispatcher: SimpleEventDispatcher<string>;
  private onErrorDispatcher: SimpleEventDispatcher<Error>;

  /**
   * Initialize the base of a new smart home object.
   * @param option Connection option.
   */
  constructor(option: SmartHomeBaseOption) {
    this.logger = new Logger({ name: option.name });

    this.localEndpoint = option.localEndpoint;
    this.remoteEndpoint = option.remoteEndpoint;

    this.onBindDispatcher = new SignalDispatcher();
    this.onUnbindDispatcher = new SignalDispatcher();
    this.onConnectDispatcher = new SignalDispatcher();
    this.onDisconnectDispatcher = new SignalDispatcher();
    this.onInfoDispatcher = new SimpleEventDispatcher<string>();
    this.onWarningDispatcher = new SimpleEventDispatcher<string>();
    this.onErrorDispatcher = new SimpleEventDispatcher<Error>();

    this.onBindEvent.subscribe(() => this.logger.info(`Bind on ${this.localEndpoint}`));
    this.onUnbindEvent.subscribe(() => this.logger.info(`Unbind of ${this.localEndpoint}`));
    this.onConnectEvent.subscribe(() => this.logger.info(`Connected to ${this.remoteEndpoint}`));
    this.onDisconnectEvent.subscribe(() => this.logger.info(`Disconnected from ${this.remoteEndpoint}`));
    this.onInfoEvent.subscribe((info) => this.logger.info(info));
    this.onWarningEvent.subscribe((warning) => this.logger.warn(warning));
    this.onErrorEvent.subscribe((error) => this.logger.error(error));
  }

  /**
   * Fire the server bind event.
   */
  protected onBind(): void {
    this.onBindDispatcher.dispatch();
  }

  /**
   * The server bind event.
   */
  public get onBindEvent(): ISignal {
    return this.onBindDispatcher.asEvent();
  }

  /**
   * Fire the server unbind event.
   */
  protected onUnbind(): void {
    this.onUnbindDispatcher.dispatch();
  }

  /**
   * The server unbind event.
   */
  public get onUnbindEvent(): ISignal {
    return this.onUnbindDispatcher.asEvent();
  }

  /**
   * Fire the server connect event.
   */
  protected onConnect(): void {
    this.onConnectDispatcher.dispatch();
  }

  /**
   * The client connect event.
   */
  public get onConnectEvent(): ISignal {
    return this.onConnectDispatcher.asEvent();
  }

  /**
   * Fire the server disconnect event.
   */
  protected onDisconnect(): void {
    this.onDisconnectDispatcher.dispatch();
  }

  /**
   * The client disconnect event.
   */
  public get onDisconnectEvent(): ISignal {
    return this.onDisconnectDispatcher.asEvent();
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
  public get onErrorEvent(): ISimpleEvent<Error> {
    return this.onErrorDispatcher.asEvent();
  }
}
