import { Pool } from '../src/index';

describe('Pool', () => {
  let pool: Pool = new Pool(4);

  test('exec should return result of task', async () => {
    const task = () => 'hello world';
    const result = await pool.exec(task);
    expect(result).toBe('hello world');
  });

  test('exec should pass task arguments', async () => {
    const task = (a: number, b: number) => a + b;
    const result = await pool.exec(task, [1, 2]);
    expect(result).toBe(3);
  });

  it('should enqueue and dequeue a task', async () => {
    const add = (a: number, b: number) => a + b;
    const result = await pool.exec(add, [1, 2]);
    expect(result).toBe(3);
  });

  it('should correctly handle errors', async () => {
    const throwError = () => {
      throw new Error('Some error');
    };
    try {
      await pool.exec(throwError);
    } catch (error: any) {
      expect(error.message).toContain('Some error');
    }
  });

  test('exec should throw error if task throws', async () => {
    const task = () => {
      throw new Error('test error');
    };
    await expect(pool.exec(task)).rejects.toThrow('test error');
  });

  test('setMaxWorkers should update max workers', () => {
    pool.setMaxWorkers(8);
    expect(pool.maxWorker).toBe(8);
  });

  it('should limit the number of workers', async () => {
    jest.setTimeout(6000);
    pool.setMaxWorkers(2);
    const slowAdd = (a: number, b: number) =>
      new Promise((resolve) => setTimeout(() => resolve(a + b), 50));
    const addPromises = Array.from({ length: 5 }, (_, i) => pool.exec(slowAdd, [i, i + 1]));
    expect(pool.getState().runningTasks.length == 2);
    expect(pool.getState().taskQueue.length == 3);
    let taskWaiting = pool.getState().taskQueue.map((t) => t.args);
    expect(taskWaiting).toEqual([
      [2, 3],
      [3, 4],
      [4, 5],
    ]);
    const results = await Promise.all(addPromises);
    expect(results).toEqual([1, 3, 5, 7, 9]);
  });

  test('exec should add tasks to task queue if all workers are busy', async () => {
    const task = () => 'hello world';
    pool.setMaxWorkers(4);
    const taskPromise1 = pool.exec(task);
    const taskPromise2 = pool.exec(task);
    const taskPromise3 = pool.exec(task);
    const taskPromise4 = pool.exec(task);
    const taskPromise5 = pool.exec(task);
    expect(pool.getState().taskQueue.length).toBe(1);
    await Promise.all([taskPromise1, taskPromise2, taskPromise3, taskPromise4, taskPromise5]);
  });

  it('should remove subscribers once the event is emitted', async () => {
    const add = (a: number, b: number) => a + b;
    const spy = jest.fn();
    pool.getEventEmmiter().once('TASK_COMPLETED_TOPIC', spy);
    await pool.exec(add, [1, 2]);
    await pool.exec(add, [3, 4]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not start new tasks if all workers are busy', async () => {
    pool.setMaxWorkers(1);
    const slowAdd = (a: number, b: number) =>
      new Promise((resolve) => setTimeout(() => resolve(a + b), 200));
    const addPromise1 = pool.exec(slowAdd, [1, 2]);
    let startTime = Date.now();
    const addPromise2 = pool.exec(slowAdd, [3, 4]);
    let endTime = Date.now();
    expect(endTime - startTime).toBeLessThanOrEqual(10);
    startTime = Date.now();
    const results = await Promise.all([addPromise1, addPromise2]);
    endTime = Date.now();
    expect(results).toEqual([3, 7]);
    expect(endTime - startTime).toBeGreaterThanOrEqual(400);
  });

  it('should run tasks concurrently', async () => {
    pool.setMaxWorkers(2);
    const slowAdd = (a: number, b: number) =>
      new Promise((resolve) => setTimeout(() => resolve(a + b), 200));
    const addPromise1 = pool.exec(slowAdd, [1, 2]);
    const addPromise2 = pool.exec(slowAdd, [3, 4]);
    let startTime = Date.now();
    const results = await Promise.all([addPromise1, addPromise2]);
    let endTime = Date.now();
    expect(results).toEqual([3, 7]);
    expect(endTime - startTime).toBeLessThanOrEqual(300);
  });

  it('showState should log the state of the pool', async () => {
    const logSpy = jest.spyOn(global.console, 'log');
    pool.showState();
    expect(logSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledTimes(5);
    let args = logSpy.mock.calls.map((arg) => arg[0]);
    expect(args).toContain('taskQueue:');
    expect(args).toContain('runninTask:');
    expect(args).toContain('subscritors:');
  });

  it('should start new tasks if any worker finishes', async () => {
    pool.setMaxWorkers(1);
    const slowAdd = (a: number, b: number) =>
      new Promise((resolve) => setTimeout(() => resolve(a + b), 100));
    const fastAdd = (a: number, b: number) => a + b;
    const addPromise1 = pool.exec(slowAdd, [1, 2]);
    const startTime = Date.now();
    const addPromise2 = pool.exec(fastAdd, [3, 4]);
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(1000);
    const results = await Promise.all([addPromise1, addPromise2]);
    expect(results).toEqual([3, 7]);
  });

  it('should not have memory leaks', async () => {
    pool.setMaxWorkers(4);
    let startHeapUsed = process.memoryUsage().heapUsed;
    let initialMemoryUsage = process.memoryUsage();
    let data: any = await Promise.all([
      pool.exec(() => {}),
      pool.exec(() => {}),
      pool.exec(() => {}),
      pool.exec(() => {}),
      pool.exec(() => {}),
      pool.exec(() => {}),
      pool.exec(() => {}),
      pool.exec(() => {}),
      pool.exec(() => {}),
      pool.exec(() => {}),
    ]);
    expect(data).toHaveLength(10);
    let memoryDiff = process.memoryUsage().heapUsed - initialMemoryUsage.heapUsed;
    expect(memoryDiff).toBeLessThan(1024 * 1024 * 5); // 5MB
    initialMemoryUsage = process.memoryUsage();

    const sum = (...nums: number[]): number => {
      return nums.reduce((acc, cur) => acc + cur, 0);
    };

    data = await Promise.all([
      pool.exec(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
      pool.exec(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
      pool.exec(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
      pool.exec(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
      pool.exec(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
      pool.exec(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
      pool.exec(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
      pool.exec(sum, [...Array.from(new Array(Math.floor(Math.random() * 100)), (_, v) => +v)]),
    ]);
    expect(data).toHaveLength(8);
    memoryDiff = process.memoryUsage().heapUsed - initialMemoryUsage.heapUsed;
    expect(memoryDiff).toBeLessThan(1024 * 1024 * 10); // 10MB

    initialMemoryUsage = process.memoryUsage();

    const memoryLeak = (delayMs = 100): Promise<number> => {
      const EventEmitter = require('events');
      const eventEmitter = new EventEmitter();
      let start = performance.now();
      return new Promise((res) => {
        eventEmitter.on('finish', () => {
          res(performance.now() - start);
        });
        setTimeout(() => {
          eventEmitter.emit('finish');
        }, delayMs);
      });
    };

    data = await Promise.all([
      pool.exec(memoryLeak, [150]),
      pool.exec(memoryLeak, [250]),
      pool.exec(memoryLeak, [250]),
      pool.exec(memoryLeak, [80]),
      pool.exec(memoryLeak, [80]),
      pool.exec(memoryLeak, [110]),
      pool.exec(memoryLeak, [110]),
      pool.exec(memoryLeak, [110]),
      pool.exec(memoryLeak, [110]),
      pool.exec(memoryLeak, [110]),
    ]);
    for (let el of data) {
      expect(el).toBeLessThanOrEqual(el + 10);
    }
    memoryDiff = process.memoryUsage().heapUsed - initialMemoryUsage.heapUsed;
    expect(memoryDiff).toBeLessThan(1024 * 1024 * 10); // 10MB
    memoryDiff = process.memoryUsage().heapUsed - startHeapUsed;
    expect(memoryDiff).toBeLessThan(1024 * 1024 * 20); // 20MB
  });
});
