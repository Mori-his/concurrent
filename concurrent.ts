

interface Queue<T> {
    in(task: T): void,
    out(): T | undefined
}
interface Concurrent {
    limit: number,
    runTask(): void
}

interface Task {
    (): Promise<Function>
}


abstract class ConcurrentConfines implements Concurrent, Queue<Task> {
    private _queue: Task[] = [];
    // 并发数
    limit: number = 50;
    // 缓冲度
    private _bufferDegrees: number = 5;
    private _currentLimit: number = 0;
    private _state: boolean = false;
    in(task: Task) {
        this._queue.push(task);
        !this._state && this.runTask();
    }

    out(): Task | undefined {
        return this._queue.shift()
    }

    runTask() {
        this._state = true;
        while(this._currentLimit < this.limit) {
            const task: Task = this.out();
            if (!task) {
                // 如果没有可执行任务就停止执行
                this._state = false
                return;
            }
            ++this._currentLimit
            console.log('当前并发', this._currentLimit, '最大并发', this.limit);
            this.handle(task).finally(() => {
                --this._currentLimit
                // 如果任务终止了则唤醒任务
                if (!this._state && this._currentLimit + this._bufferDegrees === this.limit) {
                    console.log('当前任务被中断重新启动, 当前并发数达到', this._currentLimit)
                    this.runTask()
                } else {
                    console.log('当前并发被释放重新加入请求,当前并发数为', this._currentLimit)
                }
            })
        }
        this._state = false
    }
    get bufferDegrees() {
        return this._bufferDegrees
    }
    set bufferDegrees(newValue: number) {
        if (this.limit <= newValue) {
            throw new Error('缓冲度不能大于等于并发度')
        }
        this._bufferDegrees = newValue
    }
    abstract handle(task: Task): Promise<any>
}



class RequestConcurrent extends ConcurrentConfines {
    handle(task: Task): Promise<any> {
        return new Promise((resolve, reject) => {
            task().then(() => {
                resolve()
            })
        })
    } 
}


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
