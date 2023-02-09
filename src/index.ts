export const workerPromise = async (
  fn: (...params: any[]) => any = () => {},
  args: any[] = []
): Promise<any> => {
  let isNodeEnvironment = (typeof window === 'undefined')
  try {
    const { Worker } = require('worker_threads');
  } catch (e) {
    isNodeEnvironment = false;
  }
  if (isNodeEnvironment) return workerPromiseNodeJs(fn, args);
  return workerPromiseBrowser(fn, args);

  //////////////////FUCNTION FOR DIFFERENT ENVIRONMENTS ///////////////////////////
  async function workerPromiseNodeJs(
    fn: (...params: any[]) => any = () => {},
    args: any[] = []
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const { Worker } = require('worker_threads');
      try {
        const worker = new Worker(
          `
            const { workerData, parentPort } = require('worker_threads')
            Promise.resolve((${fn.toString()})(...workerData))
            .then((value) => {
              parentPort.postMessage({ error: null, data: value });
            }).catch((error) => {
              parentPort.postMessage({ error: new Error("Error in worker execution: " + error.message), data: null });
            })
          `,
          {
            eval: true,
            workerData: args,
          }
        );
        worker.once('message', (value: any) => {
          const { error, data } = value;
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
          worker.terminate();
        });
        worker.once('error', (error: any) => {
          error.message = 'Error in worker execution: ' + error.message;
          reject(error);
          worker.terminate();
        });
        worker.once('exit', (exitCode: any) => {
          if (exitCode != 0) {
            return reject('Process exit with error');
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async function workerPromiseBrowser(
    fn: (...params: any[]) => any = () => {},
    args: any[] = []
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        let code = `
          self.onmessage = ({ data }) => {
            Promise.resolve((${fn.toString()})(...data)).then((value) => {
              self.postMessage({ error: null, data: value });
            }).catch((error) => {
              self.postMessage({ error: new Error("Error in worker execution: " + error.message), data: null });
            })   
          }`;
        let urlToCode: any = URL.createObjectURL(new Blob([code]));
        const worker = new window.Worker(urlToCode);
        worker.postMessage(args);
        worker.onmessage = (ev: MessageEvent<any>) => {
          const { error, data } = ev.data;
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
          worker.terminate();
        };
        worker.onmessageerror = (ev: MessageEvent<any>) => {
          reject(ev.data);
          worker.terminate();
        };
        worker.onerror = (ev: ErrorEvent) => {
          reject(ev);
          worker.terminate();
        };
      } catch (error: any) {
        reject(error);
      }
    });
  }
};

export class EventEmitterV1 {
  subscritors: Map<string, Set<(...params: any[]) => any>> = new Map();
  emit(topic: string, data: any): void {
    if (!this.subscritors.has(topic)) {
      return;
    }
    for (let fn of this.subscritors.get(topic) as Set<(...params: any[]) => any>) {
      queueMicrotask(() => {
        fn(data);
        this.subscritors.get(topic)?.delete(fn);
        if (this.subscritors.get(topic)?.size == 0) this.subscritors.delete(topic);
      });
    }
  }
  once(topic: string, cb: (...params: any[]) => any) {
    if (!this.subscritors.has(topic)) {
      this.subscritors.set(topic, new Set());
    }
    this.subscritors.get(topic)?.add(cb);
  }
}

export type ITaskRunning = {
  task: (...params: any[]) => any;
  args: any[];
  resolveCb: (error: any, data: any, taskResolved?: (...params: any[]) => any) => void;
};

export class Pool {
  maxWorker: number = 4;
  private taskQueue: ITaskRunning[] = [];
  private runningTask: Set<ITaskRunning> = new Set();
  private eventEmmiterV1 = new EventEmitterV1();
  private TASK_COMPLETED_TOPIC = 'TASK_COMPLETED_TOPIC';

  constructor(workers: number = 4) {
    this.maxWorker = workers;
  }

  setMaxWorkers(workers = 4): Pool {
    this.maxWorker = workers;
    return this;
  }

  private enqueueTask() {
    if (this.runningTask.size >= this.maxWorker) {
      this.eventEmmiterV1.once(this.TASK_COMPLETED_TOPIC, () => {
        this.enqueueTask();
      });
    } else {
      let nextTask = this.taskQueue.shift();
      if (!nextTask) return;
      this.runningTask.add(nextTask);
      workerPromise(nextTask.task, nextTask.args)
        .then((response: any) => {
          this.finishTaskOfRunning(nextTask as ITaskRunning);
          nextTask?.resolveCb(null, response);
        })
        .catch((error: any) => {
          this.finishTaskOfRunning(nextTask as ITaskRunning);
          nextTask?.resolveCb(error, null);
        })
        .finally(() => {
          this.eventEmmiterV1.emit(this.TASK_COMPLETED_TOPIC, null);
        });
    }
  }

  private finishTaskOfRunning(nextTask: ITaskRunning): void {
    if (!this.runningTask.has(nextTask)) throw new Error('Fatal error this should never happends');
    this.runningTask.delete(nextTask);
  }

  async exec(fn: (...params: any[]) => any = () => {}, args: any[] = []): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      let taskRunning: ITaskRunning = {
        task: fn,
        args: args,
        resolveCb: function (error, data) {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        },
      };
      this.taskQueue.push(taskRunning);
      this.enqueueTask();
    });
  }

  showState(): void {
    console.log('**********************STATE*******************************************');
    console.log('taskQueue:', this.taskQueue);
    console.log('runninTask:', this.runningTask);
    console.log('subscritors:', this.eventEmmiterV1.subscritors);
    console.log('**********************************************************************');
  }

  getEventEmmiter(): EventEmitterV1 {
    return this.eventEmmiterV1;
  }

  getState(): {
    taskQueue: ITaskRunning[];
    runningTasks: ITaskRunning[];
    taskWaiting: ITaskRunning[];
    threadsWorking: number;
  } {
    let taskWaiting: Array<ITaskRunning> = [];
    if (this.eventEmmiterV1.subscritors.get(this.TASK_COMPLETED_TOPIC)) {
      taskWaiting = [
        ...(this.eventEmmiterV1.subscritors.get(this.TASK_COMPLETED_TOPIC) as any),
      ] as Array<ITaskRunning>;
    }
    return {
      taskQueue: this.taskQueue,
      runningTasks: [...this.runningTask],
      taskWaiting: taskWaiting,
      threadsWorking: this.runningTask.size,
    };
  }
}

export const pool = new Pool();

export default workerPromise;
