import logging
from logging.config import dictConfig

def setup_logging(level: str = "INFO"):
    """Configure a simple, structured logger for the application.

    - JSON‑style log lines are easy to ship to observability platforms.
    - Includes timestamp, level, logger name, and message.
    - Can be extended with handlers (e.g., file, syslog) later.
    """
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            }
        },
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "level": level,
            }
        },
        "root": {"handlers": ["default"], "level": level},
    }
    dictConfig(logging_config)
    logging.getLogger(__name__).info("Logging configured – level=%s", level)
