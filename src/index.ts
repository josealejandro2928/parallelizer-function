import workerPromiseFn from './worker-promise';

export const workerPromise = workerPromiseFn;
export default workerPromise;

class EventEmitterV1 {
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

type ITaskRunning = {
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
      workerPromiseFn(nextTask.task, nextTask.args)
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
