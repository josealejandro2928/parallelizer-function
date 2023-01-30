import workerPromise from '../src/index';

describe('workerPromise', () => {
  it('should execute the provided function and return the result', async () => {
    const add = (a: number, b: number) => a + b;
    const result = await workerPromise(add, [1, 2]);
    expect(result).toEqual(3);
  });

  it('should handle errors thrown by the provided function', async () => {
    const errorFn = () => {
      throw new Error('Test error');
    };
    try {
      await workerPromise(errorFn);
    } catch (error: any) {
      expect(error.message).toEqual('Error in worker execution: Test error');
    }
  });

  it('should handle non-error rejection from the provided function', async () => {
    const rejectFn = () => Promise.reject(new Error('Test rejection'));
    try {
      await workerPromise(rejectFn);
    } catch (error: any) {
      expect(error.message).toEqual('Error in worker execution: Test rejection');
    }
  });

  it('should not block the main thread', async () => {
    let startTime = Date.now();
    const longRunningTask = () => {
      let sum = 0;
      for (let i = 0; i < 100000000; i++) {
        sum += i;
      }
      return sum;
    };
    const promise = workerPromise(longRunningTask);
    expect(Date.now() - startTime).toBeLessThan(25);
    await promise;
  });

  it('should execute the provided function in a separate thread', async () => {
    const { isMainThread } = require('node:worker_threads');
    const isMainThreadInMainThread = isMainThread;
    const getValue = () => {
      const { isMainThread } = require('node:worker_threads');
      return isMainThread;
    };
    const promise = await workerPromise(getValue);
    expect(isMainThreadInMainThread).toBe(true);
    expect(promise).toBe(false);
  });

  // it('should not have memory leaks', async () => {
  //   // Get initial memory usage
  //   let initialMemoryUsage = process.memoryUsage();
  //   let startHeapUsed = process.memoryUsage().heapUsed;

  //   // Execute workerPromise
  //   await workerPromise(() => {}, []);
  //   await workerPromise(() => {}, []);
  //   await workerPromise(() => {}, []);
  //   await workerPromise(() => {}, []);
  //   await workerPromise(() => {}, []);
  //   await workerPromise(() => {}, []);
  //   await workerPromise(() => {}, []);
  //   await workerPromise(() => {}, []);

  //   // Get final memory usage
  //   // Assert that the difference in memory usage is not significant
  //   let memoryDiff = process.memoryUsage().heapUsed - initialMemoryUsage.heapUsed;
  //   initialMemoryUsage = process.memoryUsage();
  //   const sum = (...nums: number[]): number => {
  //     return nums.reduce((acc, cur) => acc + cur, 0);
  //   };

  //   let data: any = await Promise.all([
  //     workerPromise(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
  //     workerPromise(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
  //     workerPromise(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
  //     workerPromise(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
  //   ]);
  //   expect(data).toHaveLength(4);
  //   memoryDiff = process.memoryUsage().heapUsed - initialMemoryUsage.heapUsed;
  //   expect(memoryDiff).toBeLessThan(1024 * 1024 * 10); // 10MB

  //   initialMemoryUsage = process.memoryUsage();

  //   const memoryLeak = (delayMs = 100): Promise<number> => {
  //     const EventEmitter = require('events');
  //     const eventEmitter = new EventEmitter();
  //     let start = performance.now();
  //     return new Promise((res) => {
  //       eventEmitter.on('finish', () => {
  //         res(performance.now() - start);
  //       });
  //       setTimeout(() => {
  //         eventEmitter.emit('finish');
  //       }, delayMs);
  //     });
  //   };

  //   data = await Promise.all([
  //     workerPromise(memoryLeak, [150]),
  //     workerPromise(memoryLeak, [250]),
  //     workerPromise(memoryLeak, [250]),
  //     workerPromise(memoryLeak, [80]),
  //     workerPromise(memoryLeak, [80]),
  //     workerPromise(memoryLeak, [110]),
  //     workerPromise(memoryLeak, [110]),
  //     workerPromise(memoryLeak, [110]),
  //     workerPromise(memoryLeak, [110]),
  //     workerPromise(memoryLeak, [110]),
  //   ]);
  //   for (let el of data) {
  //     expect(el).toBeLessThanOrEqual(el + 10);
  //   }
  //   memoryDiff = process.memoryUsage().heapUsed - initialMemoryUsage.heapUsed;
  //   expect(memoryDiff).toBeLessThan(1024 * 1024 * 10); // 10MB
  //   memoryDiff = process.memoryUsage().heapUsed - startHeapUsed;
  //   expect(memoryDiff).toBeLessThan(1024 * 1024 * 20); // 5MB
  // });
});
