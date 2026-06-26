# gunicorn_config.py
# Vercel's recommended configuration for a serverless environment

# The number of worker processes
workers = 4
# The type of worker class
worker_class = "gunicorn.workers.sync.SyncWorker"
# The address to bind to
bind = "0.0.0.0:8000"
# Log level
loglevel = "info"
# Timeout for handling a request
timeout = 120
