from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import sys
import re
from datetime import date

# ``pytesseract`` unconditionally imports :mod:`pandas`, which can fail when
# the local ``pandas`` installation is not compatible with the installed
# ``numpy`` version (raising a ``ValueError`` during import).  Since this
# application does not rely on ``pandas`` at all, we attempt to import it and
# silently fall back to a stub when any exception occurs.  This prevents the
# incompatibility from crashing the API on start-up while allowing
# ``pytesseract`` to operate in its "pandas not installed" mode.
try:  # pragma: no cover - best effort to avoid optional dependency issues
    import pandas  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover
    sys.modules["pandas"] = None  # type: ignore

import pytesseract
import difflib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    file_array = np.asarray(bytearray(image_bytes), dtype=np.uint8)
    img = cv2.imdecode(file_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Unable to decode image")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    contrasted = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)
    _, thresh = cv2.threshold(contrasted, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    return thresh


def extract_row(img: np.ndarray, username: str) -> str:
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    target = username.upper()
    best_idx = None
    best_score = 0.0
    for i, text in enumerate(data["text"]):
        candidate = text.strip().upper()
        if not candidate:
            continue
        score = difflib.SequenceMatcher(None, candidate, target).ratio()
        if score > best_score:
            best_score = score
            best_idx = i
        if score == 1.0:
            break
    if best_idx is not None and best_score > 0.8:
        target_top = data["top"][best_idx]
        words = []
        for j in range(len(data["text"])):
            if abs(data["top"][j] - target_top) <= 10 and data["text"][j].strip():
                words.append((data["left"][j], data["text"][j]))
        row = " ".join(w for _, w in sorted(words, key=lambda x: x[0]))
        return row
    raise ValueError("Username not found in image")


def parse_stats(row: str) -> dict:
    pattern = re.compile(
        r"^(?P<username>\w+)\s+(?P<grade>[A-F])\s+"\
        r"(?P<points>\d+)\s+(?P<rebounds>\d+)\s+(?P<assists>\d+)\s+"\
        r"(?P<steals>\d+)\s+(?P<blocks>\d+)\s+(?P<fouls>\d+)\s+(?P<turnovers>\d+)\s+"\
        r"(?P<fgm>\d+)/(?P<fga>\d+)\s+(?P<tpm>\d+)/(?P<tpa>\d+)\s+(?P<ftm>\d+)/(?P<fta>\d+)"
    )
    match = pattern.match(row)
    if not match:
        raise ValueError("Unable to parse stats row")
    groups = match.groupdict()
    return {
        "username": groups["username"],
        "grade": groups["grade"],
        "points": int(groups["points"]),
        "rebounds": int(groups["rebounds"]),
        "assists": int(groups["assists"]),
        "steals": int(groups["steals"]),
        "blocks": int(groups["blocks"]),
        "fouls": int(groups["fouls"]),
        "turnovers": int(groups["turnovers"]),
        "fgm": int(groups["fgm"]),
        "fga": int(groups["fga"]),
        "tpm": int(groups["tpm"]),
        "tpa": int(groups["tpa"]),
        "ftm": int(groups["ftm"]),
        "fta": int(groups["fta"]),
        "date": date.today().isoformat(),
    }


@app.post("/parse-boxscore")
async def parse_boxscore(
    file: UploadFile = File(..., description="PNG or JPEG image"),
    username_query: Optional[str] = Query(
        None, alias="username", description="Player username"
    ),
    username_form: Optional[str] = Form(
        None, alias="username", description="Player username"
    ),
):
    user = username_query or username_form
    if not user:
        raise HTTPException(status_code=400, detail="username is required")
    try:
        contents = await file.read()
        processed = preprocess_image(contents)
        row = extract_row(processed, user)
        stats = parse_stats(row)
        return stats
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except pytesseract.TesseractNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="tesseract is not installed or it's not in your PATH",
        )

