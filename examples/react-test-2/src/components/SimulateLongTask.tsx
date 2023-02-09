import { useEffect, useState } from 'react';
import workerPromise, { pool } from 'parallelizer-function';
import 'highlight.js/styles/atom-one-dark-reasonable.css';
import hljs from 'highlight.js';

const SimulateLongTask = ({
  setSimulateLongTask = (x: number) => { },
  setDelayS = (x: number) => { },
}: {
  setSimulateLongTask: (x: number) => any;
  setDelayS: (x: number) => any;
}) => {
  const [inputVal, setInputVal] = useState(0);
  const [inASeparatedThread, setInASeparatedThread] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hljs.highlightAll();
  }, []);

  useEffect(() => {
    setDelayS(inputVal);
  }, [inputVal]);

  function simulateLongTask(delayS = 0) {
    // This function simulate a task that will take 10 seconds to finish
    let now = Date.now();
    let iter = 0;
    let MAX_DELAY = delayS * 1000; // 10 seconds 100000 milliseconds
    while (Date.now() - now < MAX_DELAY) {
      iter++;
    }
    return iter;
  }

  async function onSimulateLongTask() {
    setLoading(true);
    if (inASeparatedThread) {
      let res: number = await pool.exec(simulateLongTask, [inputVal]);
      setSimulateLongTask(res);
    } else {
      let res = simulateLongTask(inputVal);
      setSimulateLongTask(res);
    }
    setLoading(false);
  }

  const code = `
  function simulateLongTask(delayS = 0) {
    // This function simulate a task that will take 10 seconds to finish
    let now = Date.now();
    let iter = 0;
    let MAX_DELAY = delayS * 1000; // 10 seconds 100000 milliseconds
    while (Date.now() - now < MAX_DELAY) {
      iter++;
    }
    return iter;
  }
`;

  return (
    <>
      <h3>Example2: Simulate a long task</h3>
      <p>
        In this example, you have implemented a function that simulate a long
        task, that it will take a # of seconds based on the input value
        selected.
      </p>
      <pre style={{ fontSize: 11 }}>
        <code className="language-typescript">{code}</code>
      </pre>
      <p>
        This will simulate maybe a heavy task wich takes seconds to finis. If we
        do this in the main thread of JavaScript, we will block it and the page
        becomes unresponsible
      </p>
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            max={10}
            style={{ height: 40 }}
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(+e?.target?.value)}
          />
          <button
            disabled={inputVal > 10}
            onClick={onSimulateLongTask}
            style={{ backgroundColor: '#61dafbaa' }}
          >
            Compute
          </button>
          {loading && 'Loading ...'}
        </div>
        <p style={{ margin: 0, marginTop: 4 }}>
          <input
            type="checkbox"
            style={{ marginTop: 1 }}
            checked={inASeparatedThread}
            onChange={(e) => setInASeparatedThread(e.target.checked)}
          />{' '}
          Run in a separate thread
        </p>
        {!inASeparatedThread && (
          <small>This will block the main thread for {inputVal} seconds</small>
        )}
      </div>
      <br />
    </>
  );
};

export default SimulateLongTask;
