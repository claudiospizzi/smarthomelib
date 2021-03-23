import { EventEmitter } from 'events';
import { Logger } from 'tslog';

/**
 * Arguments of a connect event.
 */
export interface ConnectArgs<T extends SmartHomeDevice> {
  source: T;
}

/**
 * Arguments of a disconnect event.
 */
export interface DisconnectArgs<T extends SmartHomeDevice> {
  source: T;
}

/**
 * Arguments of an informational event.
 */
export interface InfoArgs<T extends SmartHomeDevice> {
  source: T;
  message: string;
}

/**
 * Arguments of a warning event.
 */
export interface WarningArgs<T extends SmartHomeDevice> {
  source: T;
  message: string;
}

/**
 * Arguments of an error event.
 */
export interface ErrorArgs<T extends SmartHomeDevice> {
  source: T;
  message: string;
  error: Error;
}

/**
 * Arguments of a send event.
 */
export interface SendArgs<T extends SmartHomeDevice, U> {
  source: T;
  sendTo: string;
  message: U;
}

/**
 * Arguments of a receive event.
 */
export interface ReceiveArgs<T extends SmartHomeDevice, U> {
  source: T;
  receiveFrom: string;
  message: U;
}

/**
 * Base class to interact with smart home systems and devices.
 */
export abstract class SmartHomeDevice extends EventEmitter {
  protected log: Logger;

  /**
   * IP address or hostname of the device.
   */
  public address: string;

  /**
   * Create a smart home system or device.
   * @param type The smart home system or device type.
   * @param address The device IP address or hostname.
   */
  constructor(type: string, address: string) {
    super();

    this.address = address;

    this.log = new Logger({ name: type, prefix: [`(${this.address})`], ignoreStackLevels: 4 });
  }

  /**
   * Emit a connect event.
   * @param source The source smart home device or thing.
   */
  protected emitConnect<T extends SmartHomeDevice>(connectTo?: string, bindOn?: string): void {
    this.emit('connect', {
      source: this as SmartHomeDevice,
    } as ConnectArgs<T>);
    if (connectTo !== undefined) {
      this.log.info(`Connect to ${connectTo}`);
    }
    if (bindOn !== undefined) {
      this.log.info(`Bind on ${bindOn}`);
    }
  }

  /**
   * Emit a disconnect event.
   * @param source The source smart home device or thing.
   */
  protected emitDisconnect<T extends SmartHomeDevice>(disconnectFrom?: string, unbindFrom?: string): void {
    this.emit('disconnect', {
      source: this as SmartHomeDevice,
    } as DisconnectArgs<T>);
    if (disconnectFrom !== undefined) {
      this.log.warn(`Disconnect from ${disconnectFrom}`);
    }
    if (unbindFrom !== undefined) {
      this.log.warn(`Unbind from ${unbindFrom}`);
    }
  }

  /**
   * Emit an informational event.
   * @param source The source smart home device or thing.
   * @param message The info message.
   */
  protected emitInfo<T extends SmartHomeDevice>(message: string): void {
    this.emit('info', {
      source: this as SmartHomeDevice,
      message: message,
    } as InfoArgs<T>);
    this.log.info(message);
  }

  /**
   * Emit a warning event.
   * @param source The source smart home device or thing.
   * @param message The warning message.
   */
  protected emitWarning<T extends SmartHomeDevice>(message: string): void {
    this.emit('warning', {
      source: this as SmartHomeDevice,
      message: message,
    } as WarningArgs<T>);
    this.log.warn(message);
  }

  /**
   * Emit an error event.
   * @param source The source smart home device or thing.
   * @param error The error object.
   */
  protected emitError<T extends SmartHomeDevice>(error: Error): void {
    this.emit('warning', {
      source: this as SmartHomeDevice,
      message: `${error}`,
      error: error,
    } as ErrorArgs<T>);
    this.log.error(error);
  }

  /**
   * Emit a send event.
   * @param source The source smart home device or thing.
   * @param to Target where the data was delivered.
   * @param object The sent object.
   */
  protected emitSend<T extends SmartHomeDevice, U>(sendTo: string, message: U | U[]): void {
    if (!Array.isArray(message)) {
      message = [message];
    }
    for (const currentMessage of message) {
      this.emit('send', {
        source: this as SmartHomeDevice,
        sendTo: sendTo,
        message: currentMessage,
      } as SendArgs<T, U>);
      this.log.debug(`Send to ${sendTo} => ${JSON.stringify(currentMessage)}`);
    }
  }

  /**
   * Emit a receive event.
   * @param source The source smart home device or thing.
   * @param from Source of the received data.
   * @param object The received object.
   */
  protected emitReceive<T extends SmartHomeDevice, U>(receiveFrom: string, message: U | U[]): void {
    if (!Array.isArray(message)) {
      message = [message];
    }
    for (const currentMessage of message) {
      this.emit('receive', {
        source: this as SmartHomeDevice,
        receiveFrom: receiveFrom,
        message: currentMessage,
      } as ReceiveArgs<T, U>);
      this.log.debug(`Received from ${receiveFrom} => ${JSON.stringify(currentMessage)}`);
    }
  }
}
