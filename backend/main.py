from typing import Optional, Tuple, Dict, List

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import sys
from datetime import date

# pytesseract may import pandas unconditionally; guard against local numpy/pandas mismatch
try:  # pragma: no cover
    import pandas  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover
    sys.modules["pandas"] = None  # type: ignore

import pytesseract
import difflib
import re


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------
# OCR & PREPROCESSING
# ---------------------------

def preprocess_image(image_bytes: bytes) -> Tuple[np.ndarray, np.ndarray]:
    """
    Return (bw_strong, gray_soft).

    - bw_strong: binarized, high-contrast image (best for crisp HUDs)
    - gray_soft: non-binarized but locally contrast-enhanced grayscale
                 (fallback when binarization erases thin glyphs)
    """
    file_array = np.asarray(bytearray(image_bytes), dtype=np.uint8)
    img = cv2.imdecode(file_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Unable to decode image")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Upscale if smallest dimension < ~1200 px to help tiny text
    h, w = gray.shape[:2]
    if min(h, w) < 1200:
        scale = max(2.0, 1200.0 / min(h, w))
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # Local contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_soft = clahe.apply(gray)

    # Light denoise while preserving edges
    gray_soft = cv2.bilateralFilter(gray_soft, d=7, sigmaColor=50, sigmaSpace=50)

    # Strong binarization
    bw_strong = cv2.adaptiveThreshold(
        gray_soft, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 5
    )

    return bw_strong, gray_soft


# ---------------------------
# ROW DETECTION HELPERS
# ---------------------------

def _norm_name(s: str) -> str:
    """Normalize player name strings for fuzzy matching and fused grade handling."""
    s = s.strip().upper()
    s = s.replace("0", "O")  # common OCR swap in gamer tags
    return re.sub(r"[^A-Z0-9]", "", s)  # strip punctuation so "B+AUSWEN" matches


def _group_key(data: Dict[str, List[int]], i: int) -> Tuple[int, int, int]:
    return (data["block_num"][i], data["par_num"][i], data["line_num"][i])


def _concat_line(data: Dict[str, List], idxs: List[int]) -> str:
    idxs = sorted(idxs, key=lambda k: data["left"][k])
    return " ".join(data["text"][k] for k in idxs if data["text"][k] and data["text"][k].strip())


def _line_bbox(data: Dict[str, List], idxs: List[int], pad: int = 6) -> Tuple[int, int, int, int]:
    """Compute bounding box (x0,y0,x1,y1) for a set of token indices."""
    xs, ys, xe, ye = [], [], [], []
    for i in idxs:
        l, t, w, h = int(data["left"][i]), int(data["top"][i]), int(data["width"][i]), int(data["height"][i])
        xs.append(l); ys.append(t); xe.append(l + w); ye.append(t + h)
    x0, y0, x1, y1 = min(xs), min(ys), max(xe), max(ye)
    return max(0, x0 - pad), max(0, y0 - pad), x1 + pad, y1 + pad


def _best_line_for_username(data: Dict[str, List], username: str) -> Optional[Tuple[Tuple[int, int, int], float]]:
    """
    PASS 1: choose the OCR 'line' whose concatenated text best matches the username.
    Returns (key, score) or None.
    """
    target = _norm_name(username)
    groups: Dict[Tuple[int, int, int], List[int]] = {}
    n = len(data["text"])
    for i in range(n):
        txt = data["text"][i]
        if not txt or not txt.strip():
            continue
        key = _group_key(data, i)
        groups.setdefault(key, []).append(i)

    best_key, best_score = None, 0.0
    for key, idxs in groups.items():
        line_text = _concat_line(data, idxs)
        fused = _norm_name(line_text)
        score = difflib.SequenceMatcher(None, fused, target).ratio()
        if score > best_score:
            best_key, best_score = key, score

    if best_key is not None and best_score >= 0.55:
        return best_key, best_score
    return None


def extract_row(img: np.ndarray, username: str) -> Tuple[str, Tuple[int, int, int, int]]:
    """
    Two-pass detection:
      1) Prefer Tesseract's (block, paragraph, line) grouping via fuzzy match.
      2) Fallback to a token-level Y-band collection around the best token.

    Returns (row_text, bbox) where bbox is (x0,y0,x1,y1) in the given img.
    """
    # Expanded whitelist to allow underscores, dots, @ used in gamer tags
    config = (
        "--oem 3 --psm 6 "
        "-c preserve_interword_spaces=1 "
        "-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:/+-.@_"
    )
    data = pytesseract.image_to_data(
        img, output_type=pytesseract.Output.DICT, config=config
    )

    # ---------- PASS 1: line-level fuzzy match ----------
    best = _best_line_for_username(data, username)
    if best:
        key, _ = best
        idxs = [
            i for i in range(len(data["text"]))
            if _group_key(data, i) == key and data["text"][i] and data["text"][i].strip()
        ]
        row = _concat_line(data, idxs)
        if row.strip():
            bbox = _line_bbox(data, idxs, pad=6)
            return row, bbox

    # ---------- PASS 2: token-level fallback ----------
    target = _norm_name(username)
    best_i, best_score = None, 0.0
    for i, txt in enumerate(data["text"]):
        if not txt or not txt.strip():
            continue
        cand = _norm_name(txt)
        score = difflib.SequenceMatcher(None, cand, target).ratio()
        if score > best_score:
            best_i, best_score = i, score

    if best_i is None or best_score < 0.50:
        raise ValueError("Username not found in image")

    # Rebuild a row around the best token using same line id OR similar Y
    y0 = int(data["top"][best_i])
    key0 = _group_key(data, best_i)
    band = 12  # pixels tolerance; adjust if your screenshots differ in scale

    idxs = []
    for j in range(len(data["text"])):
        if not data["text"][j] or not data["text"][j].strip():
            continue
        same_line = _group_key(data, j) == key0
        same_band = abs(int(data["top"][j]) - y0) <= band
        if same_line or same_band:
            idxs.append(j)

    row = _concat_line(data, idxs)
    if row.strip():
        bbox = _line_bbox(data, idxs, pad=6)
        return row, bbox

    raise ValueError("Username not found in image")


def reocr_line_region(img: np.ndarray, bbox: Tuple[int, int, int, int]) -> str:
    """
    Re-OCR ONLY the detected line region with a digits-and-slash-focused whitelist.
    Use single-line mode (psm 7) to reduce layout confusion.
    """
    x0, y0, x1, y1 = bbox
    h, w = img.shape[:2]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(w, x1), min(h, y1)
    crop = img[y0:y1, x0:x1]

    # Gentle upscale + light sharpen tends to help 2K HUD glyphs
    crop = cv2.resize(crop, None, fx=1.6, fy=1.6, interpolation=cv2.INTER_CUBIC)
    crop = cv2.GaussianBlur(crop, (3, 3), 0)

    # Single-line recognition, preserve spaces, and whitelist digits + slash
    config = (
        "--oem 3 --psm 7 "
        "-c preserve_interword_spaces=1 "
        "-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/+-"
    )
    text = pytesseract.image_to_string(crop, config=config)
    return " ".join(text.split())



# ---------------------------
# PARSER (tolerant to OCR noise)
# ---------------------------

def parse_stats(row, expected_username: Optional[str] = None) -> dict:
    # Accept either a str or a (row_text, bbox) tuple
    if isinstance(row, tuple):
        row = row[0]
    if not isinstance(row, str):
        raise ValueError("parse_stats expected row text or (row, bbox)")
    if not row or not row.strip():
        raise ValueError("Unable to parse stats row")

    import difflib, re
    from typing import List, Tuple

    grade_pattern = re.compile(r"^[A-F](?:[-+])?$", re.IGNORECASE)
    pair_like = re.compile(r"^\s*\d+\s*/\s*\d+\s*$")

    def clean_num(tok: str) -> str:
        tok = tok.upper().replace("O", "0").replace("I", "1")
        return re.sub(r"[^0-9]", "", tok)

    def is_int(tok: str) -> bool:
        return bool(clean_num(tok))

    def to_int(tok: str) -> int:
        c = clean_num(tok)
        return int(c) if c else 0

    # --- Tokenize & merge obvious split pairs around "/" ---
    raw = row.split()
    tokens: List[str] = []
    i = 0
    while i < len(raw):
        t = raw[i]
        if "/" in t:
            tokens.append(t)
            i += 1
            continue
        if is_int(t) and i + 2 < len(raw) and raw[i+1] == "/" and is_int(raw[i+2]):
            tokens.append(f"{t}/{raw[i+2]}")
            i += 3
            continue
        if t.endswith("/") and is_int(t[:-1]) and i + 1 < len(raw) and is_int(raw[i+1]):
            tokens.append(f"{t[:-1]}/{raw[i+1]}")
            i += 2
            continue
        if is_int(t) and i + 1 < len(raw) and raw[i+1].startswith("/") and is_int(raw[i+1][1:]):
            tokens.append(f"{t}/{raw[i+1][1:]}")
            i += 2
            continue
        tokens.append(t)
        i += 1

    # --- Username & grade (doesn't mutate numeric order) ---
    username = None
    grade = ""
    if expected_username:
        target = expected_username.upper()
        best_j, best_score = None, 0.0
        for j, tok in enumerate(tokens):
            s1 = difflib.SequenceMatcher(None, tok.upper(), target).ratio()
            s2 = difflib.SequenceMatcher(
                None, re.sub(r"[^A-Z0-9]", "", tok.upper()),
                re.sub(r"[^A-Z0-9]", "", target),
            ).ratio()
            score = max(s1, s2)
            if score > best_score:
                best_j, best_score = j, score
        if best_j is not None and best_score >= 0.60:
            fused = tokens[best_j]
            username = expected_username
            U = target
            F = fused.upper()
            if F.endswith(U):
                prefix = re.sub(r"[^A-Za-z+-]", "", fused[: -len(expected_username)])
                if grade_pattern.match(prefix):
                    grade = prefix.upper()
            elif F.startswith(U):
                suffix = re.sub(r"[^A-Za-z+-]", "", fused[len(expected_username):])
                if grade_pattern.match(suffix):
                    grade = suffix.upper()
    if username is None:
        username = tokens[0] if tokens else ""

    if not grade:
        for tok in tokens:
            if grade_pattern.match(tok):
                grade = tok.upper()
                break

    # --- Strategy A: explicit a/b pairs (take last three as FG, 3PT, FT) ---
    pair_idxs: List[int] = [idx for idx, tok in enumerate(tokens) if pair_like.match(tok)]
    def split_pair(tok: str) -> Tuple[int, int]:
        a, b = tok.split("/", 1)
        return to_int(a), to_int(b)

    got_stats = False
    fgm = fga = tpm = tpa = ftm = fta = 0
    pts = reb = ast = stl = blk = fls = tov = 0

    if len(pair_idxs) >= 3:
        last_three = sorted(pair_idxs[-3:])
        fg_idx, three_idx, ft_idx = last_three
        fgm, fga = split_pair(tokens[fg_idx])
        tpm, tpa = split_pair(tokens[three_idx])
        ftm, fta = split_pair(tokens[ft_idx])

        ints_left: List[int] = [to_int(t) for t in tokens[:fg_idx] if is_int(t)]
        if len(ints_left) < 7:
            ints_left += [to_int(t) for t in tokens[fg_idx:three_idx] if is_int(t)]
        if len(ints_left) >= 7:
            core = ints_left[-7:]
            pts, reb, ast, stl, blk, fls, tov = core[:7]
            got_stats = True

    # --- Strategy B: no/insufficient pairs — take last 6 integers for FT/3PT/FG ---
    if not got_stats:
        ints_with_idx: List[Tuple[int, int]] = []
        for idx, tok in enumerate(tokens):
            if is_int(tok):
                ints_with_idx.append((idx, to_int(tok)))

        if len(ints_with_idx) >= 13:
            last_six = ints_with_idx[-6:]
            ftm, fta, tpm, tpa, fgm, fga = [val for (_, val) in last_six][::-1]
            core_vals = [val for (_, val) in ints_with_idx[-13:-6]]
            if len(core_vals) != 7:
                preceding = [val for (_, val) in ints_with_idx[:-6]]
                core_vals = preceding[-7:]
            pts, reb, ast, stl, blk, fls, tov = core_vals
            got_stats = True

    # --- Strategy C: as a last resort, extract all numbers with regex and map from right ---
    if not got_stats:
        # Pull every number in order (even from tokens like '17:' or '7/10' -> 7,10)
        nums = [int(n) for n in re.findall(r"\d+", row)]
        if len(nums) >= 13:
            # Map: last 6 → FTm, FTa, 3Pm, 3Pa, FGm, FGa (right-to-left)
            ftm, fta, tpm, tpa, fgm, fga = nums[-6:][::-1]
            core = nums[-13:-6]
            if len(core) != 7:
                core = nums[:max(0, len(nums)-6)][-7:]  # take the 7 just before the pairs
            if len(core) == 7:
                pts, reb, ast, stl, blk, fls, tov = core
                got_stats = True

    if not got_stats:
        raise ValueError("Unable to locate enough numeric fields in row")

    if pts > 2000:
        raise ValueError(f"Parsed points value {pts} seems invalid")

    return {
        "username": username,
        "grade": grade,
        "points": pts,
        "rebounds": reb,
        "assists": ast,
        "steals": stl,
        "blocks": blk,
        "fouls": fls,
        "turnovers": tov,
        "fgm": fgm,
        "fga": fga,
        "tpm": tpm,
        "tpa": tpa,
        "ftm": ftm,
        "fta": fta,
        "date": date.today().isoformat(),
    }



# ---------------------------
# API ENDPOINT
# ---------------------------

@app.post("/parse-boxscore")
async def parse_boxscore(
    file: UploadFile = File(..., description="PNG or JPEG image"),
    username_query: Optional[str] = Query(None, alias="username", description="Player username"),
    username_form: Optional[str] = Form(None, alias="username", description="Player username"),
    debug: bool = Query(False, description="Return top OCR lines when username not found"),
):
    user = username_query or username_form
    if not user:
        raise HTTPException(status_code=400, detail="username is required")

    try:
        contents = await file.read()
        bw_strong, gray_soft = preprocess_image(contents)

        # Try strong binarized first, then softer grayscale
        try:
            row, bbox = extract_row(bw_strong, user)
        except ValueError:
            row, bbox = extract_row(gray_soft, user)

        # First parse attempt
        try:
            stats = parse_stats(row, user)
            return stats
        except ValueError as e1:
            # Second attempt: re-OCR the exact line region with digits-only emphasis
            # Use the best source (bw_strong if we got the bbox from it, else gray_soft)
            src = bw_strong if 'bw_strong' in locals() else gray_soft
            refined = reocr_line_region(src, bbox)
            try:
                stats = parse_stats(refined, user)
                return stats
            except ValueError:
                # If still failing, raise the original error for clarity
                raise e1

    except ValueError as e:
        if debug:
            # Provide diagnostic: top OCR lines by similarity from the last-used image
            config = (
                "--oem 3 --psm 6 "
                "-c preserve_interword_spaces=1 "
                "-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:/+-.@_"
            )
            src = 'bw_strong' in locals() and bw_strong or ('gray_soft' in locals() and gray_soft or None)
            if src is not None:
                data = pytesseract.image_to_data(
                    src, output_type=pytesseract.Output.DICT, config=config
                )
                groups: Dict[Tuple[int, int, int], List[int]] = {}
                for i, txt in enumerate(data["text"]):
                    if not txt or not txt.strip():
                        continue
                    key = _group_key(data, i)
                    groups.setdefault(key, []).append(i)

                lines: List[Tuple[float, str]] = []
                for key, idxs in groups.items():
                    s = _concat_line(data, idxs)
                    score = difflib.SequenceMatcher(None, _norm_name(s), _norm_name(user)).ratio()
                    if s.strip():
                        lines.append((score, s))
                lines.sort(key=lambda t: t[0], reverse=True)

                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": str(e),
                        "row": locals().get("row", ""),
                        "refined": locals().get("refined", ""),
                        "top_ocr_lines": [f"{score:.2f}  {s}" for score, s in lines[:10]],
                    },
                )
        raise HTTPException(status_code=400, detail=str(e))

    except pytesseract.TesseractNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="tesseract is not installed or it's not in your PATH",
        )
