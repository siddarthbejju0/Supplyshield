import uvicorn
import os
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"Starting SupplyShield AI Backend on http://{host}:{port}")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)
