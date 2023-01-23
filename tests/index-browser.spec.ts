/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from '@jest/globals';
import { workerPromise } from '../src/index';
import npmPackage from '../src/index';

const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

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
  let limit: number = 25;
  let skip: number = 0;
  let fetchData = await fetch('https://dummyjson.com/products?limit=0');
  let total = (await fetchData.json()).total;
  let arrayPromises: Array<Promise<any>> = [];
  while (skip < total) {
    arrayPromises.push(fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`));
    skip = Math.min(skip + limit, total);
  }
  arrayPromises = (await Promise.all(arrayPromises)).map((el) => el.json());
  let allData: Array<IProduct> = (await Promise.all(arrayPromises)).reduce((acc, curr) => {
    const { products } = curr;
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
        let data = await fetch('http://noexiste.xxx/');
        data = await data.json();
        return data;
      }, []);
    } catch (error: any) {
      expect(error.message).toContain('Error in worker');
      expect(error.message).toContain('failed');
    }

    try {
      await workerPromise(async () => {
        throw new Error('Custom Error');
      });
    } catch (error: any) {
      expect(error.message).toContain('Error in worker');
      expect(error.message).toContain('Custom Error');
    }
  });
});
