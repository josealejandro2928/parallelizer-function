import { useEffect, useState } from "react";
import workerPromise from "parallelizer-function";
import "highlight.js/styles/atom-one-dark-reasonable.css";
import hljs from "highlight.js";

const FibonacciComputator = () => {
    const [blockInput, setBlockInput] = useState(42);
    const [blockValue, setBlockValue] = useState(0);

    const [nonBlockInput, setNonBlockInput] = useState(42);
    const [nonBlockValue, setNonBlockValue] = useState(0);

    useEffect(() => {
        hljs.highlightAll();
    }, []);

    function fibonacci(n: number = 2): number {
        if (n <= 0) return 0
        if (n == 1) return 1;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    function onUpdateBlockValue() {
        let fib: number = fibonacci(blockInput);
        setBlockValue(fib);
    }

    async function onUpdateNonBlockValue() {
        let fib: number = await workerPromise(fibonacci, [nonBlockInput])
        setNonBlockValue(fib);
    }

    const code = `async function onUpdateNonBlockValue(value:number){
        let fib = await workerPromise(fibonacci,[value])
        setNonBlockingValue(fib);
    }`
    return <>
        <h3>Example1: Compute the nth of Fibonacci</h3>
        <p>In this example, we will test the <strong>"workerPromise"</strong> computing the Fibonacci element for a given <strong>n</strong> value.
            The first example will run the function in the main thread, which will cause a blocking state,
            where React won't be able to render the state of the count button. The second will run the function in a separate thread like this:
        </p>
        <pre style={{ "fontSize": 13 }}>
            <code className="language-typescript">{code}</code>
        </pre>

        <div style={{ "width": "100%" }}>
            <h3>Bloking</h3>
            <div style={{ "display": "flex", "flexDirection": "row", "alignItems": "center", gap: "8px" }}>
                <input style={{ "height": 40 }} type="number" value={blockInput} onChange={(e) => setBlockInput(+e?.target?.value)} />
                <button onClick={onUpdateBlockValue} style={{ backgroundColor: "#61dafbaa" }}>Compute</button>
                <span>result: </span><span><strong>{blockValue}</strong></span>
            </div>
            {<p style={{ "fontStyle": "italic" }}>**This function <strong>will block</strong> the main thread. Try to click the count button when computing Fibonacci for values greater than 40</p>}
        </div>
        <br />
        <div style={{ "width": "100%" }}>
            <h3>Non Bloking</h3>
            <div style={{ "display": "flex", "flexDirection": "row", "alignItems": "center", gap: "8px" }}>
                <input style={{ "height": 40 }} type="number" value={nonBlockInput} onChange={(e) => setNonBlockInput(+e?.target?.value)} />
                <button onClick={onUpdateNonBlockValue} style={{ backgroundColor: "#61dafbaa" }}>Compute</button>
                <span>result: </span><span><strong>{nonBlockValue}</strong></span>
            </div>
            {<p style={{ "fontStyle": "italic" }}>**This function <strong>will not block</strong> the main thread. Try to click the count button when computing Fibonacci for values greater than 40</p>}
        </div>
    </>
}

export default FibonacciComputator;