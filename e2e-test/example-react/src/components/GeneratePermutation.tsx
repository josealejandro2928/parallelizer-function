import { useEffect, useState } from "react";
import workerPromise from "parallelizer-function";
import "highlight.js/styles/atom-one-dark-reasonable.css";
import hljs from "highlight.js";

const GeneratePermutation = ({ setPermutations = (x = []) => { } }: { setPermutations: (x: Array<Array<number>>) => any }) => {
    const [inputVal, setInputVal] = useState(5);
    const [inASeparatedThread, setInASeparatedThread] = useState(false);
    const [loading, setLoading] = useState(false);



    useEffect(() => {
        hljs.highlightAll();
        onGeneratePermutations();
    }, []);

    function generatePermutations(n: number = 2): Array<Array<number>> {
        let array = Array.from(new Array(n), (_, index) => index + 1);
        let sol: Array<Array<number>> = [];
        let visited = new Set();
        function solve(partial: number[] = []) {
            if (partial.length == array.length) {
                sol.push([...partial]);
                return;
            }
            for (let el of array) {
                if (!visited.has(el)) {
                    partial.push(el);
                    visited.add(el);
                    solve(partial);
                    partial.pop();
                    visited.delete(el);
                }
            }
        }
        solve([]);
        return sol;
    }

    async function onGeneratePermutations() {
        setLoading(true);
        if (inASeparatedThread) {
            let res: Array<Array<number>> = await workerPromise(generatePermutations, [inputVal]);
            setPermutations(res);

        } else {
            let res = generatePermutations(inputVal);
            setPermutations(res);
        }
        setLoading(false);
    }



    return <>
        <h3>Example2: Generate all permotations up to n</h3>
        <p>IIn this example, you will compute all permutations for a given number n, (1...n) and display the results.
            For example, the permutation for n=3</p>
        <strong>[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]</strong>.
        <p>This is a heavy task wich complexity is O(!n). If we do this in the main thread of JavaScript, we will block the main thread;</p>

        <div style={{ "width": "100%" }}>
            <div style={{ "display": "flex", "flexDirection": "row", "alignItems": "center", gap: "8px" }}>
                <input max={10} style={{ "height": 40 }} type="number" value={inputVal} onChange={(e) => setInputVal(+e?.target?.value)} />
                <button disabled={inputVal > 10} onClick={onGeneratePermutations} style={{ backgroundColor: "#61dafbaa" }}>Compute</button>
                {loading && ("Loading ...")}
            </div>
            <p><input type="checkbox" style={{ "marginTop": 1 }} checked={inASeparatedThread} onChange={(e) => setInASeparatedThread(e.target.checked)} /> Run in a separate thread</p>
        </div>
        <br />
    </>
}

export default GeneratePermutation;