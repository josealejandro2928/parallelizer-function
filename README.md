# parallelizer-function

An npm package for running JavaScript functions in a different Thread. This implementation uses the Worker API. It works for both browsers and NodeJs. Based on the run environment, it uses the Nodejs build-in library "worker_threads" or the default window.Worker class in case of a browser environment.
I got the inspiration from the python implementation of thread library, where you can run a function in another thread in a very straightforward way:

```Python
from threading import Thread
def function_name(*args,**kwargs):
    pass

thread = Thread(target=function_name, args=[, kwargs])
thread.start()
thread.join()
```

## installation

npm

```sh
 npm i parallelizer-function --save
```

yarn

```sh
 yarn add parallelizer-function
```

In order to use **parallelizer-function** package in JavaScript you can use like this:

```JavaScript
const { workerPromise } = require("parallelizer-function");

function function_name(...args){
    // some computation ..
    return value
}

/// It return a promise of the returned value of the function passed
workerPromise(function_name,[arg0,arg1])
    .then((res)=>{console.log(res)})
    .catch((error)=>{console.error(error)})

/// or using try-catch
try{
    let res = await workerPromise(function_name,[arg0,arg1]);
    console.log(res);
}catch(error){
    console.error(error)
}
```


##### Stackblitz examples

#### [stackblitz example in a react application](https://stackblitz.com/edit/parallelizer-function-example-react?file=src/App.tsx)

#### [stackblitz example in a node application](https://stackblitz.com/edit/parallelizer-function-example-node?file=index.js)


The primary importance of **workerPromise** is that it executes the passed function in a separate thread, which makes the execution of that function not block the main JavaScript thread during the execution of the event loop. It should be noted that extensive thread usage will cause a memory impact on the program process. It is a trade-off between performance and responsiveness.
We should rely on the built-in JavaScript functionalities to execute I/O operations like querying a database, read-write files, or making an http request. These tasks will not block the main JS event loop execution; behind the scenes, the v8 engine uses the C libuv library to execute these I/O tasks.

But if we have to perform some extensive computation that includes a lot of iteration, like performing a kind of data processing or data normalization, process images, math computation, physic simulation, web crawling, etc. We can use the workerPromise function to allow that.
And the important thing is that all the libraries or packages the function uses in performing its task should be imported inside the function. That is because the Worker class works in JavaScirpt; The function will be isolated as if it were in a separate script. This fn can access every file of the script in which was invoked and can access the same process.env of the main thread.

```TypeScript
import workerPromise from "parallelizer-function";
import path from "path";

//////////// main script
try{
    let res:Array<string> = await workerPromise(async (pathFile)=>{
        const fs = require('fs');
        let files = fs.readFileSync(pathFile, { encoding: 'utf-8' });
        return files.split('\n');
    },[path.resolve("../docs/sample-name.txt")]);
    console.log("Names: ", res)
}catch(error){
    console.error(error)
}
/// this is like if where in a separate thread on another js script like this
const fs = require('fs');
self.onmessage = async ({data})=>{
    try{
        let files = fs.readFileSync(pathFile, { encoding: 'utf-8' });
        let res = files.split('\n');
        self.postMessage({ error: null, data: res });
    }catch(error){
        self.postMessage({ error: error, data: null });
    }
}
```

Is important to clarify that the the script is created in memory with the use of URL.createObjectURL function and Blob class of JavaScript.

## Example uses case

Let's imagine we have this sample of functions we want to compute on a website or respond to a request using an express server.

```TypeScript
import workerPromise from "parallelizer-function";

function isPrimeThisNumber(n){
    // This function takes an integer and returns whether it is a prime number or not. Complexity O(n^1/2)
    for(let i=2;i*i<=n;i++){
        if(n%i == 0) return false;
    }
    return true
}

function 3Sum(arr=[]){
    // This function return all the distinc triplet i,j,k i<j<k,
    // where arr[i] + arr[j] + arr[k] sum up to 0. Complexity O(n^2)
    let visited = new Set()
    let sol = []
    arr = arr.sort()
    for(let i =0;i<arr.length;i++){
        let target = -arr[i]
        let isSeen = new Set()
        for(let j=i+1;j<arr.length;j++){
            if(isSeen.has(target - arr[j])){
                let key = `${arr[i]},${arr[j]},${target - arr[j]}`
                if(!visited.has(key))
                    sol.push([arr[i],arr[j],target - arr[j]])
                visited.add(key)
            }else{
                isSeen.add(arr[j])
            }

        }
    }
    return sol
}

function simulateLongTask(){
    // This function simulate a task that will take 10 seconds to finish
    let now = Date.now();
    let iter = 0;
    let MAX_DELAY = 10*1000; // 10 seconds 100000 milliseconds
    while((Date.now() - now) < MAX_DELAY ){
        iter++;
    }
    return iter;
}

```

If you have a listener to react to the click button or an endpoint API and the inputs for the functions are bigger enough. The following snippets code will block the main thread of JS; which will cause a web site becomes unresponsible or an API that will not accept more incoming requests.

```TypeScript
someBTNEl.addEventListener("click",()=>{
    console.log(isPrimeThisNumber(352684978))
    /// This will block the main thread
})
// Also this

someBTNEl.addEventListener("click",()=>{
    let promiseFn = new Promise((resolve)=>{
        resolve(isPrimeThisNumber(352684978));
    })
    promiseFn.then(console.log);
    /// This also will block the main thread.
    // Wrapping normal code in a Promise does not guarantee that the main thread will not be blocked.
})
```

using **workerPromise** we can avoid the bloking of the EventLopp for the above functions.

```TypeScript
someBTNEl.addEventListener("click",async ()=>{
    try{
        let res = await workerPromise(isPrimeThisNumber,[352684978]);
        console.log(res);
    // This will not block the main thread of JS, it will run "isPrimeThisNumber"
    // in a separate thread using Worker class.

    }catch(error){

    }

})
// You can do all computation in once
someBTNEl.addEventListener("click",async ()=>{
    const[isPrime,sum] = await Promise.all([
        workerPromise(isPrimeThisNumber,[352684978]),
        workerPromise(simulateLongTask)
    ])
    /// This will not block the main thread of JS, it will run
})

// Or in and endpoind for the computation of the functions
let functions = {
    3Sum,
    isPrimeThisNumber,
    simulateLongTask
}
app.post("/compute/:fn",(req,res)=>{
    let fn = req.params.fn;
    if(!fn || !(fn in functions)){
        return res.status(401).json({msg:"Not found the function"});
    }
    try{
        let res = await workerPromise(functions[fn],req.body.args);
        // This will not block the main thread of JS, it will run
        return res.status(200).json({error:false,msg:"OK",data:res});
    }catch(e){
        return res.status(400).json({error:true,msg:e.message});
    }
})
```

##### Stackblitz examples

#### [stackblitz example in a react application](https://stackblitz.com/edit/parallelizer-function-example-react?file=src/App.tsx)

#### [stackblitz example in a node application](https://stackblitz.com/edit/parallelizer-function-example-node?file=index.js)
