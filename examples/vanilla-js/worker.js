async function fn(...args) {
    // throw new Error("Hola new Error");
    return { msg: "this was created by worker", args, id: (Date.now() + Math.floor(Math.random() * 1e+10)).toString(32) }
}

self.onmessage = ({ data }) => {
    Promise.resolve(fn(data)).then((value) => {
        self.postMessage({ error: null, data: value });
    }).catch((error) => {
        self.postMessage({ error: error, data: null });
    })
}

addEventListener("unhandledrejection", (e) => {
    self.postMessage({ error: e, data: null });
})
