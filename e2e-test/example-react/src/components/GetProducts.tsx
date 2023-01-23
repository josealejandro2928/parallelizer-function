import { useEffect, useState } from 'react';
import { pool } from 'parallelizer-function';
import 'highlight.js/styles/atom-one-dark-reasonable.css';
import hljs from 'highlight.js';

export type IProduct = {
  title: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  stock: number;
  tumbnail: string;
  images: [string];
};

const GetProducts = ({ setData = () => {} }: { setData: (x: any) => any }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hljs.highlightAll();
  }, []);

  async function getAllProduct(): Promise<{
    products: Array<IProduct>;
    meta: any;
  }> {
    let limit: number = 25;
    let skip: number = 0;
    let fetchData = await fetch('https://dummyjson.com/products?limit=0');
    let total = (await fetchData.json()).total;
    let arrayPromises: Array<Promise<any>> = [];
    while (skip < total) {
      arrayPromises.push(
        fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`)
      );
      skip = Math.min(skip + limit, total);
    }
    arrayPromises = (await Promise.all(arrayPromises)).map((el) => el.json());
    let allData: Array<IProduct> = (await Promise.all(arrayPromises)).reduce(
      (acc, curr) => {
        const { products } = curr;
        acc = acc.concat(products);
        return acc;
      },
      []
    );
    let output: { products: Array<IProduct>; meta: any } = {
      products: allData,
      meta: {},
    };
    //// do some proccessing //////
    output.meta = allData.reduce(
      (acc, curr) => {
        (acc.categoryInfo as any)[curr.category] =
          ((acc.categoryInfo as any)[curr.category] || 0) + 1;
        acc.lessThan3Rate =
          curr.rating < 3 ? acc.lessThan3Rate + 1 : acc.lessThan3Rate;
        acc.moreThan4Rate =
          curr.rating >= 3 ? acc.moreThan4Rate + 1 : acc.moreThan4Rate;
        if (curr.stock == 0) {
          (acc.productOutOfStock as any).push(acc);
        }
        return acc;
      },
      {
        categoryInfo: {},
        moreThan4Rate: 0,
        lessThan3Rate: 0,
        productOutOfStock: [],
      }
    );

    return output;
  }

  async function getProducts() {
    setLoading(true);
    try {
      let data: any = await pool.exec(getAllProduct);
      setData(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const code = `
    ...
    async function getAllProduct():
    const BASE_API = "https://dummyjson.com/products" 
    Promise<{ products: Array<IProduct>, meta: any }> {
        let limit: number = 25;
        let skip: number = 0;
        let fetchData = await fetch(BASE_API + '?limit=0');
        let total = (await fetchData.json()).total;
        let arrayPromises: Array<Promise<any>> = [];
        while (skip < total) {
            arrayPromises.push(
              fetch(BASE_API + '?limit=' + limit + '&skip=' + skip));
            skip = Math.min(skip + limit, total);
        }
        ...
        //// Some proccessing //////
        ...
        return output
    }

    async function getProducts() {
        setLoading(true);
        try {
            // We can excecute the above function in a separate thread
            let data: any = await workerPromise(getAllProduct);
            setData(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }
    `;

  return (
    <>
      <h3>Example2: Making Several Request to external endpoint</h3>
      <p>
        {' '}
        You can use the workerPromise package for performing IO tasks involving
        data processing and computation. For example, sometimes, you need to
        perform some requests to an external API to gather some data. If this
        API has implemented pagination, you can make several requests
        simultaneously based on the limit and offset. Then you proceed with the
        rest of the processing.
      </p>
      <p>
        This could be a heavy task if you have several sources of data from
        which you will request. That could block the page's render because the
        main thread of JavaScript can be blocked.
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
          <button
            disabled={loading}
            onClick={getProducts}
            style={{ backgroundColor: '#61dafbaa' }}
          >
            Compute
          </button>
          {loading && 'Loading ...'}
        </div>
      </div>
      <br />
      <pre style={{ fontSize: 11 }}>
        <code className="language-typescript">{code}</code>
      </pre>
    </>
  );
};

export default GetProducts;
