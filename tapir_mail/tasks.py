import time

from celery import shared_task


@shared_task
def dummy_task():
    print("TASK STARTING")
    time.sleep(6)
    print("TASK ENDING")
