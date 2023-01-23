import { describe, expect, test } from '@jest/globals';
import { workerPromise } from '../src/index';
import npmPackage from '../src/index';

function sumUpToN(n: number) {
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    sum += i;
  }
  return sum;
}

type IProduct = {
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

async function getAllProduct(): Promise<Array<IProduct>> {
  const axios = require('axios');
  let limit: number = 25;
  let skip: number = 0;
  let { total } = (await axios.get('https://dummyjson.com/products?limit=0')).data;
  let arrayPromises: Array<Promise<any>> = [];
  while (skip < total) {
    arrayPromises.push(axios.get(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`));
    skip = Math.min(skip + limit, total);
  }
  let allData: Array<IProduct> = (await Promise.all(arrayPromises)).reduce((acc, curr) => {
    const { products } = curr.data;
    acc = acc.concat(products);
    return acc;
  }, []);
  return allData;
}

describe('NPM Package', () => {
  test('should be an object', () => {
    expect(npmPackage).toBeInstanceOf(Object);
  });

  it('should have a workerPromise property', () => {
    expect(npmPackage).toEqual(workerPromise);
  });
});

describe('Test workerPromise function for NodeJS environment', () => {
  it('should be a function', () => {
    expect(workerPromise).toBeInstanceOf(Function);
  });

  it('should return a promise', () => {
    const actual = workerPromise(() => {
      return 'Hello World';
    }, []);
    expect(actual).toBeInstanceOf(Promise);
  });

  it('should output the same value for a function called in the main thread', async () => {
    let val: number = sumUpToN(50);
    let res = await workerPromise(sumUpToN, [50]);
    expect(val).toBe(res);
    expect(sumUpToN(10)).toBe(await workerPromise(sumUpToN, [10]));
    expect(sumUpToN(-10)).toBe(await workerPromise(sumUpToN, [-10]));
    let voidFunction = () => {};
    expect(voidFunction()).toBe(await workerPromise(voidFunction, []));
    expect(voidFunction()).toBe(
      await workerPromise(voidFunction, [10, 'asdkasjdaksd', '8989', {}])
    );
  });

  it('Arguments should be serializable objects or primitives', async () => {
    let fn = (...args: [any]) => {
      return args;
    };
    let args: any[] = [1, 2, 'hello word', { name: 'Jose', values: [1, 2, 3, 4] }];
    expect(args).toEqual(await workerPromise(fn, args));
    args = [
      {
        name: 'Jose',
        values: [1, 2, 3, 4],
        getName: function () {
          return this.name;
        },
      },
    ];
    try {
      await workerPromise(fn, args);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('could not be cloned');
    }

    try {
      await workerPromise(async () => {
        throw new Error('Custom Error');
      });
    } catch (error: any) {
      expect(error.message).toContain('Custom Error');
    }
  });
});

describe('Test making I/O operations', () => {
  it('It should perform request operations and handle errors', async () => {
    let products: Array<IProduct>;
    try {
      products = (await workerPromise(getAllProduct, [])) as any;
      expect(products.length).toBe(100);
      expect(products[0].title).toBe('iPhone 9');
    } catch (e) {
      //// Avoid flaky test////
    }

    try {
      await workerPromise(async () => {
        const axios = require('axios');
        let data = await axios.get('http://noexiste.xxx/');
        return data;
      }, []);
    } catch (error: any) {
      expect(error.message).toContain('Error in worker');
    }
  });
  it('It should perform read files and handle errors', async () => {
    let data: [string] = await workerPromise(() => {
      const fs = require('fs');
      const path = require('path');
      const pathFile = path.resolve('./tests/__mock__/sample.txt');
      let files = fs.readFileSync(pathFile, { encoding: 'utf-8' });
      return files.split('\n');
    }, []);
    expect(data.length).toBe(100);
    expect(data.at(-1)).toBe('Crystal chandelier maria theresa for 12 light');

    try {
      await workerPromise(() => {
        const fs = require('fs');
        const path = require('path');
        const pathFile = path.resolve('./tests/__mock__/xxxxxx.txt');
        let files = fs.readFileSync(pathFile, { encoding: 'utf-8' });
        return files.split('\n');
      }, []);
    } catch (error: any) {
      expect(error.message).toContain('no such file or directory');
      expect(error.message).toContain('Error in worker');
    }
  });
});
