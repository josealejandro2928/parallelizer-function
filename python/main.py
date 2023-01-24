from pool import TaskRunneable, Pool
from time import time


def sumUpTo(n: int):
    acc = 0
    for el in range(0, n+1):
        acc += el
    return acc


def finonacci(n: int):
    if n < 0:
        return 0
    if n < 1:
        return 1
    return finonacci(n-1) + finonacci(n-2)


def long_delay_task(delay_s=1):
    start = time()
    steps = 0
    while((time() - start) < delay_s):
        steps += 1
    return steps


def result_excecution(err, result, runnable_task: TaskRunneable):
    print(err, result, runnable_task)


pool = Pool(4)
# pool.exec(sumUpTo, [1_0_000_000], result_excecution)
# pool.exec(finonacci, [30], result_excecution)
# pool.exec(long_delay_task, [2], result_excecution)
# pool.exec(sumUpTo, [1_000_000], result_excecution)
# print("**********************************************************\nState: ", pool.get_state(),
#       "\n**********************************************************\n", end=None)


def run_returns_error(*args):
    raise Exception(*args)


start = time()
result1 = pool.await_tasks((sumUpTo, [888_568]),
                           (finonacci, [30]),
                           (long_delay_task, [1]),
                           (sumUpTo, [1_000]),
                           (run_returns_error, ["Custom Error", "From here"])
                           )
print("result1: ", result1)
print("time: ", time() - start)
