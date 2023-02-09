import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.scss'
import { IProduct, getProductsFromExternalApi } from './data'
import { pool } from "parallelizer-function";
pool.setMaxWorkers(4);

function App() {
  const [dataProduct, setDataProducts] =
    useState<{ products: Array<IProduct>; meta: any }>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getExternalData();
  }, [])

  async function getExternalData() {
    try {
      setIsLoading(true);
      let data: {
        products: Array<IProduct>;
        meta: any;
      } = await pool.exec(getProductsFromExternalApi);
      setDataProducts(data);
    } catch (e: any) {
      console.error(e);
    }
    setIsLoading(false);

  }

  return (
    <>
      <div className="toolbar" role="banner">
        <img
          width="40"
          alt="React Logo"
          src={reactLogo}
        />
        <span style={{ "marginLeft": 16 }}>Welcome React</span>
        <div className="spacer"></div>
      </div>

      <div className="content" role="main">
        <p style={{fontSize: "1.2rem" }}>
          In this example, we are using <strong>parallelizer-function</strong> to perform calling to an external API that provides the data with pagination.
          Then we execute the requests in parallel in another thread and perform some data processing.
        </p>
        {isLoading && (
          <h2>Loading...</h2>
        )}
        {dataProduct && !isLoading && (
          <>
            <h3>Sample of computation data</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>{'rating>4'}</th>
                  <th>{'rating<3'}</th>
                  <th>{'# out stock'}</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>{dataProduct.meta.moreThan4Rate}</td>
                  <td>{dataProduct.meta.lessThan3Rate}</td>
                  <td>{dataProduct.meta.productOutOfStock.length}</td>
                </tr>
              </tbody>
            </table>
            <hr />
            <br />
            <h3>Sample of products</h3>
            <div className="product-container">
              {dataProduct.products.slice(0, 20).map((product) => (
                <div key={product.id} className="product-card">
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
            <br />
            <h3>Categories frecuencies</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>{'category'}</th>
                  <th>{'count'}</th>
                </tr>
              </thead>

              <tbody>
                {Object.keys(dataProduct?.meta?.categoryInfo).map((key) => {
                  return (
                    <tr key={key}>
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
    </>
  )
}

export default App
