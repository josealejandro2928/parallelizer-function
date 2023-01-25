import threading
from collections import deque

class TaskRunneable:
    def __init__(self, fn, args: list, resolve_cb, id):
        self.fn = fn if fn else lambda x: x
        self.args = args if args else []
        self.resolve_cb = resolve_cb if resolve_cb else lambda x: x
        self.id = id

    def __str__(self) -> str:
        return f"fn:{self.fn.__name__}, args:{self.args}, id: {self.id}"


class PoolThreadingExecutor:
    id_workers = 0

    def __init__(self, workers: int = 4):
        self.max_workers: int = workers
        self.__task_queue = deque()
        self.__running_tasks = set()
        self.lock_queue = threading.Lock()
        self.lock_tasks = threading.Lock()

    def set_max_workers(self, workers: int = 4):
        self.max_workers = workers

    def __enqueue_task(self):
        self.lock_queue.acquire()
        try:
            if len(self.__running_tasks) >= self.max_workers:
                return
            else:
                if len(self.__task_queue) == 0:
                    return
                next_task: TaskRunneable = self.__task_queue.popleft()
                self.__running_tasks.add(next_task)
                thread = threading.Thread(
                    target=self.__execute_task, args=(next_task,))
                thread.start()
        finally:
            self.lock_queue.release()

    def __execute_task(self, task_runnable: TaskRunneable):
        try:
            result = task_runnable.fn(*task_runnable.args)
            self.__finish_task_of_running(task_runnable)
            task_runnable.resolve_cb(None, result, task_runnable)
        except Exception as e:
            self.__finish_task_of_running(task_runnable)
            task_runnable.resolve_cb(e, None, task_runnable)
        finally:
            self.__enqueue_task()

    def __finish_task_of_running(self, next_task):
        self.lock_tasks.acquire()
        self.__running_tasks.remove(next_task)
        self.lock_tasks.release()

    def exec(self, task, args: list, on_resolve_cb, id=None):
        if id == None:
            id = PoolThreadingExecutor.id_workers
            PoolThreadingExecutor.id_workers += 1

        task_running: TaskRunneable = TaskRunneable(
            task, args, on_resolve_cb, id)
        self.__task_queue.append(task_running)
        self.__enqueue_task()
        return self

    def await_tasks(self, *params: list):

        result_tasks_count = 0
        resultTasks = [None] * len(params)

        for fn, args in params:
            if not callable(fn) or not iter(args):
                raise Exception(
                    "Error in the params of the function, should be a list of callback with arguments")

        def on_resolve_callback(err, result, runnable_task: TaskRunneable):
            nonlocal resultTasks, result_tasks_count
            self.lock_tasks.acquire()
            try:
                result_tasks_count += 1
                resultTasks[runnable_task.id] = {
                    "error": err, "result": result}
            finally:
                self.lock_tasks.release()

        index = 0
        for fn, args in params:
            self.exec(fn, args, on_resolve_callback, index)
            index += 1

        while result_tasks_count < len(params):
            pass

        return resultTasks

    def get_state(self):
        data = {
            "task_queue": list(map(str, self.__task_queue)),
            "running_tasks": list(map(str, self.__running_tasks)),
            "thread_working": len(self.__running_tasks),
        }
        return data

    def get_task_queue(self):
        return self.__task_queue

    def get_running_tasks(self):
        return self.__running_tasks


