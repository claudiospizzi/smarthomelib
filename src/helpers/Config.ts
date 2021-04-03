/**
 * Config helper class.
 */
export class Config {
  /**
   * Function to use the provided value or fall back to the default.
   * @param reference The value reference.
   * @param value The value. Can be undefined.
   * @param defaultValue The fall back value.
   * @returns The resolved value.
   */
  static useValueOrDefault<T>(reference: string, value: T | undefined, defaultValue: T): T {
    if (value !== undefined) {
      if (typeof value !== typeof defaultValue) {
        throw new Error(`Value named ${reference} does not match the type ${typeof defaultValue}.`);
      }
      return value;
    }
    return defaultValue;
  }

  /**
   * Function to use the provided value or throw an error if its not defined.
   * @param reference The value reference.
   * @param value The value. Can be undefined.
   * @returns The value if it's not undefined.
   */
  static useValueOrThrow<T>(reference: string, value: T | undefined): T {
    if (value === undefined) {
      throw new Error(`Required value named ${reference} not specified.`);
    }
    return value;
  }
}
