import datetime

CELERY_BEAT_SCHEDULE = {
    "resolve_segment_and_create_email_dispatches_task": {
        "task": "tapir_mail.tasks.resolve_segment_and_create_email_dispatches_task",
        "schedule": datetime.timedelta(minutes=1),
    },
    "send_email_dispatch_batch_task": {
        "task": "tapir_mail.tasks.send_email_dispatch_batch_task",
        "schedule": datetime.timedelta(minutes=1),
    },
    "check_email_bounces": {
        "task": "tapir_mail.tasks.check_email_bounces",
        "schedule": datetime.timedelta(minutes=1),
    },
}
