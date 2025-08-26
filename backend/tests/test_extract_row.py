import numpy as np
import pytesseract
import sys
from pathlib import Path
import types

sys.modules["cv2"] = types.SimpleNamespace()
sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import extract_row


def test_extract_row_handles_ocr_errors(monkeypatch) -> None:
    fake_data = {
        "text": [
            "T3STUSER",
            "A",
            "10",
            "5",
            "3",
            "2",
            "1",
            "2",
            "1",
            "5/10",
            "2/5",
            "1/2",
        ],
        "top": [0] * 12,
        "left": list(range(0, 1200, 100)),
    }

    def fake_image_to_data(img, output_type, **kwargs):
        return fake_data

    monkeypatch.setattr(pytesseract, "image_to_data", fake_image_to_data)

    img = np.zeros((10, 10), dtype=np.uint8)
    row = extract_row(img, "TESTUSER")
    assert row.startswith("T3STUSER A 10 5 3 2 1 2 1 5/10 2/5 1/2")
