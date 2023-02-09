const { workerPromise } = require("parallelizer-function");


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



async function main() {

    workerPromise(fibonacci, [40]).then((res) => {
        console.log("Fibonacci for: ", 40, "is", res);
    })
    console.log("The Fibonacci computation using  workerPromised does not block the main thread");

    let data = await Promise.all([
        workerPromise(fibonacci, [20]),
        workerPromise(sumUpTo, [500])
    ]);
    console.log("data: ", data);


    try {
        let res = await workerPromise(async () => {
            throw new Error('Custom Error');
            return 5;
        });
        console.log("🚀 ~ file: index.js:25 ~ res ~ res", res)
    } catch (error) {
        console.log("🚀 ~ file: index.js:30 ~ main ~ error", error.message)
    }
}

main();

