import os
import sys

# Ensure root workspace is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn
from backend.main import app

if __name__ == "__main__":
    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",
        port=8001,
        log_level="info",
        loop="asyncio"
    )
    server = uvicorn.Server(config)
    server.install_signal_handlers = lambda: None
    server.run()
