/**
 * Helper type for the mutex function not returning anything.
 */
export type MutexVoid = () => void;

/**
 * Mutex to synchronize async/await calls.
 * @link https://spin.atomicobject.com/2018/09/10/javascript-concurrency/
 */
export class Mutex {
  private mutex = Promise.resolve();

  lock(): PromiseLike<MutexVoid> {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let begin: (unlock: MutexVoid) => void = () => {};

    this.mutex = this.mutex.then(() => {
      return new Promise(begin);
    });

    return new Promise((res) => {
      begin = res;
    });
  }

  async dispatch<T>(fn: (() => T) | (() => PromiseLike<T>)): Promise<T> {
    const unlock = await this.lock();
    try {
      return await Promise.resolve(fn());
    } finally {
      unlock();
    }
  }
}
