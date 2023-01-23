import workerPromiseFn from './worker-promise';

export const workerPromise = workerPromiseFn;
export default workerPromise;

type ISubscritors = {
  [topic: string]: Set<(...params: [any]) => any>;
};
class EventEmitterV1 {
  subscritors: ISubscritors = {};
  emit(topic: string, data: any): void {
    if (!(topic in this.subscritors)) {
      return;
    }
    for (let fn of this.subscritors[topic]) {
      queueMicrotask(() => {
        fn(data);
        this.subscritors[topic].delete(fn);
      });
    }
  }
  once(topic: string, cb: (...params: [any]) => any) {
    if (!(topic in this.subscritors)) {
      this.subscritors[topic] = new Set();
    }
    this.subscritors[topic].add(cb);
  }
}

type ITaskRunning = {
  task: (...params: [any]) => any;
  args: any[];
  resolveCb: (error: any, data: any, taskResolved?: (...params: [any]) => any) => void;
};

export class Pool {
  private maxWorker: number = 4;
  private taskQueue: ITaskRunning[] = [];
  private runningTask: ITaskRunning[] = [];
  private eventEmmiterV1 = new EventEmitterV1();
  private Task_Completed_Topic = 'task-completed';

  constructor(workers: number = 4) {
    this.maxWorker = workers;
  }

  setMaxWorkers(workers = 4): Pool {
    this.maxWorker = workers;
    return this;
  }

  private enqueueTask(task?: ITaskRunning) {
    if (task) {
      this.taskQueue.push(task);
    }
    if (this.runningTask.length >= this.maxWorker) {
      this.eventEmmiterV1.once(this.Task_Completed_Topic, () => {
        this.enqueueTask();
      });
    } else {
      let nextTask = this.taskQueue.shift();
      if (!nextTask) return;
      this.runningTask.push(nextTask);
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
          this.eventEmmiterV1.emit(this.Task_Completed_Topic, null);
        });
    }
  }

  private finishTaskOfRunning(nextTask: ITaskRunning): void {
    let index = this.runningTask.indexOf(nextTask as ITaskRunning);
    if (index < 0) throw new Error('Fatal error this should never happends');
    this.runningTask.splice(index, 1);
  }

  async exec(fn: (...params: [any]) => any = () => {}, args: any[] = []): Promise<any> {
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
      this.enqueueTask(taskRunning);
    });
  }

  showState(): void {
    console.log('**********************STATE*******************************************');
    console.log('taskQueue:', this.taskQueue);
    console.log('runninTask:', this.runningTask);
    console.log('subscritors', this.eventEmmiterV1.subscritors);
    console.log('**********************************************************************');
  }
  getState(): {
    taskQueue: ITaskRunning[];
    runningTasks: ITaskRunning[];
    taskWaiting: ITaskRunning[];
    threadsWorking: number;
  } {
    let taskWaiting: Array<ITaskRunning> = [];
    if (this.eventEmmiterV1.subscritors[this.Task_Completed_Topic]) {
      taskWaiting = [
        ...(this.eventEmmiterV1.subscritors[this.Task_Completed_Topic] as any),
      ] as Array<ITaskRunning>;
    }
    return {
      taskQueue: this.taskQueue,
      runningTasks: this.runningTask,
      taskWaiting: taskWaiting,
      threadsWorking: this.runningTask.length,
    };
  }
}

export const pool = new Pool();
