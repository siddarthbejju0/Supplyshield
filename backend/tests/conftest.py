import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.main import app
from backend.app.data_loader import get_data_loader

@pytest.fixture(autouse=True)
def ensure_sample_data():
    get_data_loader().load_all()

@pytest.fixture(scope="session")
def client():
    return TestClient(app)

@pytest.fixture(scope="session")
def data_loader():
    loader = get_data_loader()
    loader.load_all()
    return loader
