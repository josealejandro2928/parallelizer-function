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

function encode(str = "", charToNumb = {}) {
    let tokens = []
    for (let char of str.split("")) {
        tokens.push(charToNumb[char]);
    }
    return tokens;
}

function decode(tokens = [], numbToChar) {
    let str = ""
    for (let index of tokens) {
        str += numbToChar[index]
    }
    return str;
}

function tokenize(word = "") {
    let setTokens = [...new Set(word.split(""))];
    let characterToNumber = setTokens.reduce((acc, curr, index) => {
        acc[curr] = index
        return acc
    }, {})
    let numberToCharacter = setTokens.reduce((acc, curr, index) => {
        acc[index] = curr;
        return acc
    }, {})
    return [
        characterToNumber,
        numberToCharacter
    ]
}



async function main() {
    let text = `The size of a thread pool is the number of threads kept in reserve for executing tasks. It is usually a tunable parameter of the application, adjusted to optimize program performance.[3] Deciding the optimal thread pool size is crucial to optimize performance.
    One benefit of a thread pool over creating a new thread for each task is that thread creation and destruction overhead is 
    restricted to the initial creation of the pool, which may result in better performance and better system stability. 
    Creating and destroying a thread and its associated resources can be an expensive process in terms of time. 
    An excessive number of threads in reserve, however, wastes memory, and context-switching between the runnable threads invokes performance penalties. 
    A socket connection to another network host, which might take many CPU cycles to drop and re-establish, can be maintained more efficiently by associating it with a thread that lives over the course of more than one network transaction.`


    try {
        let t1 = performance.now();
        pool.setMaxWorkers(4);
        const [encoderData, decoderData] = await pool.exec(tokenize, [text]);
        console.log("The state1: ", pool.getState());
        Promise.all(
            [pool.exec(sumUpTo, [200000]),
            pool.exec(sumUpTo, [5000]),
            pool.exec(fibonacci, [30]),
            pool.exec(encode, ["The CPU cycles are creation", encoderData]),
            pool.exec(decode, [[0, 1, 2, 3, 36, 39, 40, 3, 22, 26, 22, 14, 2, 4, 3, 9, 11, 2, 3, 22, 11, 2, 9, 10, 5, 7, 15], decoderData])
            ]).then((result) => {
                let t2 = performance.now();
                console.log("Time elapsed: ", t2 - t1);
                console.log("Result1: ", result);
                console.log("The state4: ", pool.getState());
            }).catch((error) => {
                console.log("Error", error)
            })

        console.log("This code runs without blocking the EventLoop");
        console.log("Another computation secuentally: ", sumUpTo(1000000))
        console.log("Hello world");
        console.log("The state2: ", pool.getState());

        Promise.allSettled([
            pool.exec(sumUpTo, [1_000_000]),
            pool.exec(() => {
                stela.key = 45;
                return 45;
            }),
            pool.exec(async () => {
                let res = await fetch("http://asdasdsd.xxx.com")
                res = await res.json();
                return res;
            })
        ]).then((result) => {
            console.log("The result",result);
        })
    } catch (error) {
        console.log("🚀 ~ file: index.js:30 ~ main ~ error", error.message)
    }
}

main();

