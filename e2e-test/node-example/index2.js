const { workerPromise, pool } = require("../../lib/cjs/index")


function fibonacci(n = 2) {
    if (n == 0) return 0
    if (n == 1) return 1;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

function sumUpTo(n = 500) {
    let sum = 0;
    for (let i = 0; i <= n; i++) {
        sum += i;
    }
    return sum;
}

function getTheFrecOfWord(word = "") {
    return word.split("").reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1
        return acc;
    }, {})
}



async function main() {


    try {
        let t1 = performance.now();
        pool.setMaxWorkers(8);
        Promise.allSettled(
            [pool.exec(sumUpTo, [200000]),
            pool.exec(sumUpTo, [5000]),
            pool.exec(fibonacci, [30]),
            pool.exec(() => {
                throw new Error("This is a generic error to checck Everything");
            }),
            pool.exec(getTheFrecOfWord, ["Hello World from JavaScript"]),
            ]).then((result) => {
                let t2 = performance.now();
                console.log("Time elapsed: ", t2 - t1);
                // console.log("Result1: ", result);
                console.log("The state1: ", pool.getState());
            })


        console.log("This code runs without blocking the EventLoop");
        console.log("The state2: ", pool.getState());


        console.log("Another computation secuentally: ", getTheFrecOfWord("Hello World from JavaScript"))
        console.log("Hello world");
        console.log("The state4: ", pool.getState());
    } catch (error) {
        console.log("🚀 ~ file: index.js:30 ~ main ~ error", error.message)
    }
}

main();

