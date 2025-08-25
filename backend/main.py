from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import sys
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
    """Parse a row of OCR text into structured statistics.

    The game client sometimes renders shooting splits either as a single
    ``made/attempted`` token (e.g. ``"5/12"``) or as two separate tokens
    (``"5 12"``).  The original regular expression expected the former
    format exclusively and rejected rows that used the latter.  To make the
    parser more tolerant, we now tokenise the row and interpret the shooting
    numbers whether they appear as combined or separate values.
    """

    tokens = row.split()
    if len(tokens) < 2:
        raise ValueError("Unable to parse stats row")

    username, grade = tokens[0], tokens[1]


    def _get(index: int) -> str:
        return tokens[index] if index < len(tokens) else "0"

    def _to_int(value: str) -> int:
        try:
            return int(value)
        except ValueError:
            return 0

    points = _to_int(_get(2))
    rebounds = _to_int(_get(3))
    assists = _to_int(_get(4))
    steals = _to_int(_get(5))
    blocks = _to_int(_get(6))
    fouls = _to_int(_get(7))
    turnovers = _to_int(_get(8))


    idx = 9

    def _parse_pair(index: int) -> tuple[int, int, int]:
        token = _get(index)
        if "/" in token:
            made, attempted = token.split("/", 1)
            return _to_int(made), _to_int(attempted), index + 1
        else:
            made = token
            attempted = _get(index + 1)

            return _to_int(made), _to_int(attempted), index + 2

    fgm, fga, idx = _parse_pair(idx)
    tpm, tpa, idx = _parse_pair(idx)
    ftm, fta, idx = _parse_pair(idx)

    return {
        "username": username,
        "grade": grade,
        "points": points,
        "rebounds": rebounds,
        "assists": assists,
        "steals": steals,
        "blocks": blocks,
        "fouls": fouls,
        "turnovers": turnovers,
        "fgm": fgm,
        "fga": fga,
        "tpm": tpm,
        "tpa": tpa,
        "ftm": ftm,
        "fta": fta,
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

