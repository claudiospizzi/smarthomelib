import { SmartHomeDevice } from './SmartHomeDevice';

/**
 * The value type a updated property can have.
 */
export type UpdateValue = string | number | boolean | undefined;

/**
 * Arguments of a property update event.
 */
export interface UpdateArgs<T extends SmartHomeThing> {
  source: T;
  type: 'get' | 'set';
  property: string;
  value: UpdateValue;
}

/**
 * Base class to interact with a Loxone controlled smart home thing.
 */
export abstract class SmartHomeThing extends SmartHomeDevice {
  /**
   * The identifier for the thing. If not specified, the address is used.
   */
  public name: string;

  /**
   * Location or room of the thing within the smart home.
   */
  public location: string;

  /**
   * Optional thing description.
   */
  public description: string;

  /**
   * Create a smart home thing.
   * @param type The smart home thing type.
   * @param address The thing IP address or hostname.
   * @param name The thing name. Can be the address.
   * @param location The thing location. Can be an empty string.
   * @param description The thing description. Can be an empty string.
   */
  constructor(type: string, address: string, name: string, location: string, description: string) {
    super(type, address);

    this.name = name;
    this.location = location;
    this.description = description;
  }

  /**
   * Emit an update event.
   * @param source The source smart home thing.
   * @param action Action if the update was triggered by a set or by a get.
   * @param property The updated property.
   * @param value The new value.
   */
  protected emitUpdate<T extends SmartHomeThing>(type: 'get' | 'set', property: string, value: UpdateValue): void {
    this.emit('update', {
      source: this as SmartHomeThing,
      type: type,
      property: property,
      value: value,
    } as UpdateArgs<T>);
    this.log.info(`Update by ${type === 'get' ? 'Device' : 'Loxone'}: ${property} => ${value}`);
  }
}
