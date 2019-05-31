# concurrent

const requestConcurrent: RequestConcurrent = new RequestConcurrent();
function test() {
    let ms = 100
    requestConcurrent.limit = 1000;
    for (let i = 0; i < 1000; i++) {
        requestConcurrent.in((): Promise<Function> => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log(i, ms * i)
                    resolve();
                }, Math.random() * ms * i);
            })
        })
    }
}
test();




