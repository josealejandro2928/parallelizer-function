function main() {
  if (!(typeof window === 'undefined')) {
    const workerPromise = async (fn: (...params: [any]) => any = () => {}, args: any[] = []) => {
      let code = `
        self.onmessage = (msg) => {
          const {data} = msg
          Promise.resolve((${fn.toString()})(...data))
          .then((returnedData)=>self.postMessage(returnedData))
          .catch((e)=> {throw e});    
        }`;
      let urlToCode: any = URL.createObjectURL(new Blob([code]));
      const worker = new window.Worker(urlToCode);

      return new Promise((resolve, reject) => {
        worker.postMessage(args);
        worker.onmessage = (ev: MessageEvent<any>) => {
          resolve(ev.data);
          worker.terminate();
        };
        worker.onmessageerror = (ev: MessageEvent<any>) => {
          resolve(ev.data);
          worker.terminate();
        };
        worker.onerror = (ev: ErrorEvent) => {
          console.log('**********************ERROR*******************', ev);
          reject(ev.error);
          worker.terminate();
        };
        worker.addEventListener('error', (ev: ErrorEvent) => {
          console.log('**********************ERROR*******************', ev);
        });
      });
    };
    return workerPromise;
  } else {
    const { Worker } = require('worker_threads');

    const workerPromise = async (fn: (...params: [any]) => any = () => {}, args: any[] = []) => {
      const worker = new Worker(
        `
          const { workerData, parentPort } = require('worker_threads')
          Promise.resolve((${fn.toString()})(...workerData)).then((returnedData) => parentPort.postMessage(returnedData));
      `,
        {
          eval: true,
          workerData: args,
        }
      );

      return new Promise((resolve, reject) => {
        worker.once('message', (value: any) => {
          resolve(value);
          worker.terminate();
        });
        worker.once('error', (error: any) => {
          reject(error);
          worker.terminate();
        });
        worker.once('exit', (exitCode: any) => {
          if (exitCode != 0) {
            return reject('Process exit with error');
          }
        });
      });
    };
    return workerPromise;
  }
}

export const workerPromise = main();
export default workerPromise;
