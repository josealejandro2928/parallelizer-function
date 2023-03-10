import { Pool, workerPromise } from "../../lib/esm/index.mjs";

const blokingInputEl = document.querySelector("#bloking-input");
const blokingBtnEl = document.querySelector("#bloking-btn");
const blokingRes = document.querySelector("#bloking-res");

const nonBlokingInputEl = document.querySelector("#non-bloking-input");
const nonBlokingBtnEl = document.querySelector("#non-bloking-btn");
const nonBlokingRes = document.querySelector("#non-bloking-res");
const clickBtnEl = document.querySelector("#click-btn");
const resClickEl = document.querySelector("#res-click");

const pool = new Pool(4);

function fibonacci(n = 2) {
    if (n <= 0) return 0
    if (n == 1) return 1;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

blokingBtnEl.addEventListener("click", async () => {
    try {
        let res = fibonacci(+blokingInputEl.value)
        blokingRes.textContent = res
    } catch (e) {
        console.error(e.message);
    }
})

nonBlokingBtnEl.addEventListener("click", async () => {
    try {
        let res = await pool.exec(fibonacci, [+nonBlokingInputEl.value])
        nonBlokingRes.textContent = res
    } catch (e) {
        console.error(e.message);
    }
})

let clicks = 0;

async function getAllProduct() {
    let limit = 25;
    let skip = 0;
    let fetchData = await fetch("https://dummyjson.com/products?limit=0");
    let total = (await fetchData.json()).total;
    let arrayPromises = [];
    while (skip < total) {
        arrayPromises.push(fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`));
        skip = Math.min(skip + limit, total);
    }
    arrayPromises = (await Promise.all(arrayPromises)).map(el => el.json());
    let allData = (await Promise.all(arrayPromises)).reduce((acc, curr) => {
        const { products } = curr;
        acc = acc.concat(products);
        return acc
    }, []);
    return allData;
}

clickBtnEl.addEventListener("click", async () => {
    try {
        clicks++;
        resClickEl.textContent = clicks;
        let res = await workerPromise(getAllProduct, [])
        console.log(res.map(el => el.title).join("\n"));

    } catch (e) {
        console.error("Error in method click:", e.message);
    }
})

async function main() {
    let fn = (...args) => {
        return args;
    };
    let args = [1, 2, 'hello word', { name: 'Jose', values: [1, 2, 3, 4] }];
    console.log("testing some examples")
    console.log("res: ", await workerPromise(fn, [args]));

    function sumUpToN(n) {
        let sum = 0;
        for (let i = 0; i <= n; i++) {
            sum += i;
        }
        return sum;
    }

    console.log("sum Up to 10: ", await workerPromise(sumUpToN, [10]));
    console.log("sum Up to 10: ", await workerPromise(sumUpToN, [10000]));
    console.log("sum Up to 10: ", await workerPromise(sumUpToN, [-50]));

    console.log("Testing Errors")

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
    } catch (error) {
        console.log("Error: ", error.message);
    }

    try {
        await workerPromise(async () => {
            throw new Error("Custom Error")
        });
    } catch (error) {
        console.log("andlaksjd;akdm;adkls")
        console.log("Error: ", error.message);
    }

}


main()