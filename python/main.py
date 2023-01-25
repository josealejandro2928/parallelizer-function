from pool_parallel_executor import TaskRunneable, PoolThreadingExecutor
from time import time, sleep
from multiprocessing import Pool


def sumUpTo(n: int):
    acc = 0
    for el in range(0, n+1):
        acc += el
    return acc


def long_task(n: int):
    sleep(2)
    return n


def long_delay_task(delay_s=1):
    start = time()
    steps = 0
    while((time() - start) < delay_s):
        steps += 1
    return steps


def result_excecution(err, result, runnable_task: TaskRunneable):
    print(err, result, runnable_task)


def run_returns_error(*args):
    raise Exception(*args)


if __name__ == '__main__':
    pool_of_threads = PoolThreadingExecutor(4)

    print('Running the tasks in the main thread')
    start = time()
    print("...")
    print("long_task 1s:", long_task(1,))
    print("long_task: 2s:", long_task(2))
    print("sumUpTo: 1_000_000:", sumUpTo(1_000_000))
    try:
        run_returns_error("Hello", "Error")
    except Exception as e:
        print("run_returns_error: ", e)
    print("time: ", time() - start)

    print('\n Running the tasks in the using pool of thread')
    start = time()
    print("...")
    result1 = pool_of_threads.await_tasks((long_task,(1,)),
                                          (long_task, [2]),
                                          (sumUpTo, [1_000_000]),
                                          (run_returns_error, ["Hello", "Error"]))
    print("long_task 1s:", result1[0]["result"])
    print("long_task: 2s:",  result1[1]["result"])
    print("sumUpTo: 1_000_000:", result1[2]["result"])
    print("un_returns_error:", result1[3]["error"])
    print("time: ", time() - start)

    print('\n Running the tasks in the using pool of process')
    with Pool(4) as pool_of_process:
        start = time()
        print("...")
        tasks = ((long_task,(1,)),
                 (long_task, [2]),
                 (sumUpTo, [1_000_000]),
                 (run_returns_error, ["Hello", "Error"]))
        async_task_resolution = [None]*len(tasks)
        result1 = [None]*len(tasks)
        for i, task in enumerate(tasks):
            fn, args = task
            async_task_resolution[i] = pool_of_process.apply_async(fn, args)
        
        for i, async_task in enumerate(async_task_resolution):
            try:
                res = async_task.get()
                result1[i] = {"error": None, "result": res}
            except Exception as e:
                result1[i] = {"error": e, "result": None}

        print("long_task 1s:", result1[0]["result"])
        print("long_task: 2s:",  result1[1]["result"])
        print("sumUpTo: 1_000_000:", result1[2]["result"])
        print("un_returns_error:", result1[3]["error"])
        print("time: ", time() - start)

    # Using multiprocessing
    # from multiprocessing import Process
    # import multiprocessing
    # from threading import Thread

    # def on_finish_task_cb(error, value, task):
    #     print(error, value, task)

    # def executor(task: TaskRunneable):
    #     try:
    #         result = task.fn(*task.args)
    #         task.resolve_cb(None, result, task)
    #     except Exception as e:
    #         task.resolve_cb(e, None, task)
    #     finally:
    #         # multiprocessing.current_process().close()
    #         pass

    # runneable_task1: TaskRunneable = TaskRunneable(
    #     sumUpTo, (3_000_000_00,), on_finish_task_cb, 1)
    # runneable_task2: TaskRunneable = TaskRunneable(
    #     sumUpTo, (2_000_000_00,), on_finish_task_cb, 2)
    # runneable_task3: TaskRunneable = TaskRunneable(
    #     sumUpTo, (5_000_000_00,), on_finish_task_cb, 3)

    # p1 = Process(target=executor, args=(runneable_task1,))
    # p2 = Process(target=executor, args=(runneable_task2,))
    # p3 = Process(target=executor, args=(runneable_task3,))
    # p1.start()
    # p2.start()
    # p3.start()

    # sleep(20)

    # p4 = Process(target=executor, args=(runneable_task3,))
    # p4.start()
    # sleep(10)
    # print("Finish the overall process")
