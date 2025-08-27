from __future__ import annotations
from typing import List, Dict, Optional, Any
import re

def _to_int(value: Any) -> int:
    """Best-effort conversion of value to int with OCR-friendly cleanup."""
    try:
        s = str(value).upper().strip()
        s = s.replace("O", "0").replace("I", "1")
        s = re.sub(r"[^0-9-]", "", s)
        return int(s) if s not in ("", "-",) else 0
    except (TypeError, ValueError):
        return 0

def _parse_made_attempted(value: Any, alt_made: Any = None, alt_att: Any = None) -> tuple[int, int]:
    """
    Split a made/attempted string like "3/7" into integers.
    If not present, try alt_made/alt_att fields (already split).
    """
    if value is not None:
        try:
            made, attempted = str(value).split("/", 1)
            return _to_int(made), _to_int(attempted)
        except (AttributeError, ValueError):
            pass
    return _to_int(alt_made), _to_int(alt_att)

def get_player_stats(rows: List[Dict[str, Any]], username: str) -> Optional[Dict[str, Any]]:
    """
    Return the stats for username from rows (case-insensitive).
    Tolerant to different key casings and common header variations.
    """
    target = username.lower()
    for row in rows:
        normalized = {str(k).lower(): v for k, v in row.items()}
        name = str(normalized.get("username", "")).strip()
        if name.lower() != target:
            continue

        # Accept header variants (grd/grade, pts/points, etc.)
        grade = str(normalized.get("grd", normalized.get("grade", "")))
        pts = _to_int(normalized.get("pts", normalized.get("points")))
        reb = _to_int(normalized.get("reb", normalized.get("rebounds")))
        ast = _to_int(normalized.get("ast", normalized.get("assists")))
        stl = _to_int(normalized.get("stl", normalized.get("steals")))
        blk = _to_int(normalized.get("blk", normalized.get("blocks")))
        fouls = _to_int(normalized.get("fouls", normalized.get("fls")))
        tov = _to_int(normalized.get("to", normalized.get("tov", normalized.get("turnovers"))))

        fgm, fga = _parse_made_attempted(normalized.get("fgm/fga"), normalized.get("fgm"), normalized.get("fga"))
        tpm, tpa = _parse_made_attempted(normalized.get("3pm/3pa"), normalized.get("tpm"), normalized.get("tpa"))
        ftm, fta = _parse_made_attempted(normalized.get("ftm/fta"), normalized.get("ftm"), normalized.get("fta"))

        return {
            "team": normalized.get("team", ""),
            "username": name,
            "grade": grade,
            "points": pts,
            "rebounds": reb,
            "assists": ast,
            "steals": stl,
            "blocks": blk,
            "fouls": fouls,
            "turnovers": tov,
            "fgm": fgm,
            "fga": fga,
            "three_pm": tpm,
            "three_pa": tpa,
            "ftm": ftm,
            "fta": fta,
        }
    return None
