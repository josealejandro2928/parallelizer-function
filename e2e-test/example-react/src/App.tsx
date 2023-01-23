import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.scss';
import FibonacciComputator from './components/Fibonacci';
import SimulateLongTask from './components/SimulateLongTask';
import GetProducts, { IProduct } from './components/GetProducts';
import { pool } from 'parallelizer-function';
pool.setMaxWorkers(2);

function App() {
  const [count, setCount] = useState(0);
  const [delayS, setDelayS] = useState<number>(0);
  const [simulateLongTask, setSimulateLongTask] = useState<number>(0);
  const [dataProduct, setDataProducts] =
    useState<{ products: Array<IProduct>; meta: any }>();

  useEffect(() => {
    console.log(dataProduct);
  }, [dataProduct]);

  useEffect(() => {
    console.log("Console.log:", pool.getState());
  }, [pool]);

  return (
    <div className="App">
      <div className="main-container">
        <div className="side-l">
          <FibonacciComputator></FibonacciComputator>
        </div>
        <div className="side-r">
          <div className="card">
            <div>
              <a href="https://vitejs.dev" target="_blank">
                <img src="/vite.svg" className="logo" alt="Vite logo" />
              </a>
              <a href="https://reactjs.org" target="_blank">
                <img src={reactLogo} className="logo react" alt="React logo" />
              </a>
            </div>
            <h1>Vite + React</h1>
            <div>
              <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </button>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div className="main-container">
        <div className="side-l">
          <SimulateLongTask
            setDelayS={setDelayS}
            setSimulateLongTask={setSimulateLongTask}
          ></SimulateLongTask>
        </div>
        <div
          className="side-r"
          style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
        >
          <div>
            <h3>The delay in seconds of the long task is: {delayS} s</h3>
          </div>
          <div>
            <p style={{ margin: 0 }}>
              The number of iteration was: {simulateLongTask}
            </p>
          </div>
        </div>
      </div>
      <hr />
      <div className="main-container">
        <div className="side-l">
          <GetProducts setData={setDataProducts} />
        </div>
        <div
          className="side-r"
          style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
        >
          {dataProduct && (
            <>
              <h3>Sample of computation data</h3>
              <table className="table">
                <tr>
                  <th>{'rating>4'}</th>
                  <th>{'rating<3'}</th>
                  <th>{'# out stock'}</th>
                </tr>
                <tbody>
                  <tr>
                    <td>{dataProduct.meta.moreThan4Rate}</td>
                    <td>{dataProduct.meta.lessThan3Rate}</td>
                    <td>{dataProduct.meta.productOutOfStock.length}</td>
                  </tr>
                </tbody>
              </table>
              <hr />
              <h3>Sample of products</h3>
              <div className="product-container">
                {dataProduct.products.slice(0, 6).map((product) => (
                  <div className="product-card">
                    <div className="product-image">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        srcSet={product.tumbnail}
                      />
                    </div>
                    <div className="product-body">
                      <p className="name">{product.title}</p>
                      <p className="desc">{product.description}</p>
                      <p className="price">{product.price}$</p>
                    </div>
                  </div>
                ))}
              </div>
              <h3>Categories frecuencies</h3>
              <table className="table">
                <tr>
                  <th>{'category'}</th>
                  <th>{'count'}</th>
                </tr>
                <tbody>
                  {Object.keys(dataProduct?.meta?.categoryInfo).map((key) => {
                    return (
                      <tr>
                        <td>{key}</td>
                        <td>{dataProduct.meta.categoryInfo[key]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
