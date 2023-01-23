const workerPromise = async (
  fn: (...params: [any]) => any = () => {},
  args: any[] = []
): Promise<any> => {
  if (!(typeof window === 'undefined')) {
    return new Promise((resolve, reject) => {
      try {
        let code = `
          self.onmessage = ({ data }) => {
            Promise.resolve((${fn.toString()})(...data)).then((value) => {
              self.postMessage({ error: null, data: value });
            }).catch((error) => {
              self.postMessage({ error: error, data: null });
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
  } else {
    return new Promise((resolve, reject) => {
      const { Worker } = require('worker_threads');
      try {
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
      } catch (error) {
        reject(error);
      }
    });
  }
};

export default workerPromise;
