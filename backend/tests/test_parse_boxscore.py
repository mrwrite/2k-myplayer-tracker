from fastapi.testclient import TestClient

import sys
from pathlib import Path
import types
import pytesseract

sys.modules["cv2"] = types.SimpleNamespace()
sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import app


def fake_preprocess_image(_: bytes) -> str:  # pragma: no cover - simple stub
    return "stub"


def fake_extract_row(_: str, username: str) -> str:  # pragma: no cover - simple stub
    return f"{username} A 10 5 3 2 1 2 1 5/10 2/5 1/2"


def raise_tesseract_error(_: str, __: str) -> str:  # pragma: no cover - simple stub
    raise pytesseract.TesseractNotFoundError()


def test_username_in_form_is_recognized(monkeypatch) -> None:
    """Submitting a file with a username should not trigger a missing username error."""

    monkeypatch.setattr("main.preprocess_image", fake_preprocess_image)
    monkeypatch.setattr("main.extract_row", fake_extract_row)

    client = TestClient(app)
    response = client.post(
        "/parse-boxscore",
        files={"file": ("test.png", b"fake", "image/png")},
        data={"username": "testuser"},
    )

    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


def test_missing_tesseract_returns_500(monkeypatch) -> None:
    """A clear error is returned when tesseract OCR is unavailable."""

    monkeypatch.setattr("main.preprocess_image", fake_preprocess_image)
    monkeypatch.setattr("main.extract_row", raise_tesseract_error)

    client = TestClient(app)
    response = client.post(
        "/parse-boxscore",
        files={"file": ("test.png", b"fake", "image/png")},
        data={"username": "testuser"},
    )

    assert response.status_code == 500
    assert "tesseract" in response.json()["detail"].lower()

