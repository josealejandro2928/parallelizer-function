import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.scss'
import FibonacciComputator from './components/Fibonacci'
import GeneratePermutation from './components/GeneratePermutation'
import GetProducts, { IProduct } from './components/GetProducts'

function App() {
  const [count, setCount] = useState(0)
  const [permutations, setPermutations] = useState<Array<Array<number>>>([]);
  const [dataProduct, setDataProducts] = useState<{ products: Array<IProduct>, meta: any }>();

  useEffect(() => {
    console.log(dataProduct);
  }, [dataProduct])

  return (
    <div className="App">
      <div className="main-container">
        <div className='side-l'>
          <FibonacciComputator></FibonacciComputator>
        </div>
        <div className='side-r'>
          <div className='card'>
            <div>
              <a href="https://vitejs.dev" target="_blank">
                <img src="/vite.svg" className="logo" alt="Vite logo" />
              </a>
              <a href="https://reactjs.org" target="_blank">
                <img src={reactLogo} className="logo react" alt="React logo" />
              </a>
            </div>
            <h1>Vite + React</h1>
            <div >
              <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </button>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div className="main-container">
        <div className='side-l'>
          <GeneratePermutation setPermutations={setPermutations}></GeneratePermutation>
        </div>
        <div className='side-r' style={{ "alignItems": "flex-start", "justifyContent": "flex-start" }}>
          {permutations && (
            <>
              <div>
                <h3>The total of permutation are: {permutations.length}</h3>
              </div>
              <div>
                {permutations.slice(0, 24).map((value, index) => {
                  return (
                    <>
                      <span>[{value.toString()}]</span>
                      {index < Math.min(24 - 1, permutations.length - 1) && (<span>, </span>)}
                    </>
                  )
                })}
                {permutations.length > 24 && <>
                  ...
                </>}

              </div>
            </>
          )}
        </div>
      </div>
      <hr />
      <div className="main-container">
        <div className='side-l'>
          <GetProducts setData={setDataProducts} />
        </div>
        <div className='side-r' style={{ "alignItems": "flex-start", "justifyContent": "flex-start" }}>
          {dataProduct && (
            <>
              <h3>Sample of computation data</h3>
              <table className='table'>
                <tr>
                  <th>{"rating>4"}</th>
                  <th>{"rating<3"}</th>
                  <th>{"# out stock"}</th>
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
              <div className='product-container'>

                {dataProduct.products.slice(0, 6).map((product) => (
                  <div className="product-card">
                    <div className="product-image">
                      <img src={product.images[0]} alt={product.title} srcSet={product.tumbnail} />
                    </div>
                    <div className="product-body">
                      <p className='name'>{product.title}</p>
                      <p className='desc'>{product.description}</p>
                      <p className='price'>{product.price}$</p>
                    </div>
                  </div>
                ))}
              </div>
              <h3>Categories frecuencies</h3>
              <table className='table'>
                <tr>
                  <th>{"category"}</th>
                  <th>{"count"}</th>
                </tr>
                <tbody>
                  {Object.keys(dataProduct?.meta?.categoryInfo).map(key => {
                    return (
                      <tr>
                        <td>{key}</td>
                        <td>{dataProduct.meta.categoryInfo[key]}</td>
                      </tr>)
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>


    </div>
  )
}

export default App
