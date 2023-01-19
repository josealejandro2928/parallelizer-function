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
      expect(error).toBeInstanceOf(DOMException);
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
