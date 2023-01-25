import unittest
from collections import deque
from pool_parallel_executor import PoolThreadingExecutor
import time


class TestPool(unittest.TestCase):
    def setUp(self):
        self.pool = PoolThreadingExecutor(4)

    def tearDownClass():
        files_to_destory = ["file.txt", "file1.txt", "file2.txt"]
        import os
        for file in files_to_destory:
            if os.path.isfile(file):
                os.remove(file)
        print("\nAll generated files by the test has been deleted")

    def test_exec(self):
        def task(n):
            return n*n

        def on_resolve_cb(err, result, _):
            self.assertIsNone(err)
            self.assertEqual(result, 16)

        self.pool.exec(task, [4], on_resolve_cb)

    def test_await_tasks(self):
        def task1(n):
            return n*n

        def task2(n):
            return n*n*n

        results = self.pool.await_tasks((task1, [2]), (task2, [2]))
        self.assertEqual(results[0]["result"], 4)
        self.assertEqual(results[1]["result"], 8)

    def test_exec_error_handling(self):
        def task(n):
            raise ValueError("An error occurred")

        def on_resolve_cb(err, result, runnable_task):
            self.assertIsNotNone(err)
            self.assertIsInstance(err, ValueError)

        self.pool.exec(task, [2], on_resolve_cb)

    def test_await_tasks_error_handling(self):
        def task1(n):
            raise ValueError("An error occurred")

        def task2(n):
            return n*n*n

        results = self.pool.await_tasks((task1, [4]), (task2, [2]))
        self.assertIsNotNone(results[0]["error"])
        self.assertIsInstance(results[0]["error"], ValueError)
        self.assertEqual(results[1]["result"], 8)

    def test_exec_io_task(self):
        def task():
            with open("file.txt", "w") as f:
                f.write("Hello World!")

        def on_resolve_cb(err, result, runnable_task):
            self.assertIsNone(err)
            with open("file.txt", "r") as f:
                content = f.read()
                self.assertEqual(content, "Hello World!")

        self.pool.exec(task, [], on_resolve_cb)

    def test_await_tasks_io_tasks(self):
        def task1():
            with open("file1.txt", "w") as f:
                f.write("Hello World!")

        def task2():
            with open("file2.txt", "w") as f:
                f.write("Hello World!")

        response = self.pool.await_tasks((task1, []), (task2, []))

        index = 1
        for data in response:
            self.assertIsNone(data["error"])
            with open(f"file{index}.txt", "r") as f:
                content = f.read()
                self.assertEqual(content, "Hello World!")
            index += 1

    def test_concurrency(self):
        def task(n):
            time.sleep(n)
            return n

        self.pool.set_max_workers(2)
        start_time = time.time()
        self.pool.await_tasks((task, [1]), (task, [1]))
        end_time = time.time()
        self.assertTrue(end_time - start_time < 2)

    def test_concurrency_2(self):
        def task(n):
            time.sleep(n)
            return n

        self.pool.set_max_workers(1)

        start_time = time.time()
        self.pool.await_tasks((task, [1]), (task, [1]))
        end_time = time.time()
        self.assertTrue(end_time - start_time > 2)

    def test_concurrency_not_block_the_main_thread(self):
        def task(n):
            import time
            time.sleep(n)
            return n

        def on_resolve_cb(err, result, runnable_task):
            self.assertIsNone(err)

        start_time = time.time()
        self.pool.exec(task, [1], on_resolve_cb)
        self.pool.exec(task, [2], on_resolve_cb)
        self.pool.exec(task, [3], on_resolve_cb)
        end_time = time.time()
        self.assertTrue(end_time - start_time < 1)

    def test_queue_state(self):
        def task(n):
            import time
            time.sleep(n)
            return n

        self.pool.set_max_workers(2)

        def on_resolve_cb(err, result, runnable_task):
            self.assertIsNone(err)

        self.pool.exec(task, [0.5], on_resolve_cb, 1)
        self.pool.exec(task, [0.5], on_resolve_cb, 2)
        self.pool.exec(task, [0.5], on_resolve_cb, 3)
        self.pool.exec(task, [0.5], on_resolve_cb, 4)

        self.assertEqual(set([3, 4]), set(
            map(lambda x: x.id, self.pool.get_task_queue())))
        self.assertEqual(set([1, 2]), set(
            map(lambda x: x.id, self.pool.get_running_tasks())))

        time.sleep(0.6)
        self.assertEqual(set([]), set(
            map(lambda x: x.id, self.pool.get_task_queue())))
        self.assertEqual(set([3, 4]), set(
            map(lambda x: x.id, self.pool.get_running_tasks())))


if __name__ == '__main__':
    unittest.main()
