import { ISignal, SignalDispatcher } from 'ste-signals';
import { SmartHomeBase } from './SmartHomeBase';

/**
 * Constructor options for the smart home server.
 */
export interface SmartHomeServerBaseOption {
  name: string;
  localEndpoint: string;
}

/**
 * A smart home server object base which implements the basic bind and unbind
 * events and holds the listening state.
 */
export class SmartHomeServerBase extends SmartHomeBase {
  private listening = false;

  protected localEndpoint: string;

  private onBindDispatcher = new SignalDispatcher();
  private onUnbindDispatcher = new SignalDispatcher();

  /**
   * Create a new smart home server base.
   * @param option Server option.
   */
  constructor(option: SmartHomeServerBaseOption) {
    super({ name: option.name });

    this.localEndpoint = option.localEndpoint;

    this.onBindEvent.subscribe(() => this.onInfo(`${this.name} bind on ${this.localEndpoint}`));
    this.onUnbindEvent.subscribe(() => this.onInfo(`${this.name} unbind of ${this.localEndpoint}`));
  }

  /**
   * Flag if the server is listening.
   */
  protected get isListening(): boolean {
    return this.listening;
  }

  /**
   * Fire the server bind event.
   */
  protected onBind(): void {
    if (!this.listening) {
      this.onBindDispatcher.dispatch();
      this.listening = true;
    }
  }

  /**
   * The server bind event.
   */
  protected get onBindEvent(): ISignal {
    return this.onBindDispatcher.asEvent();
  }

  /**
   * Fire the server unbind event.
   */
  protected onUnbind(): void {
    if (this.listening) {
      this.onUnbindDispatcher.dispatch();
      this.listening = false;
    }
  }

  /**
   * The server unbind event.
   */
  protected get onUnbindEvent(): ISignal {
    return this.onUnbindDispatcher.asEvent();
  }
}
