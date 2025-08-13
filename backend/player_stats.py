from __future__ import annotations
from typing import List, Dict, Optional, Any


def _to_int(value: Any) -> int:
    """Best-effort conversion of ``value`` to ``int``.

    Any ``TypeError`` or ``ValueError`` results in ``0`` so that callers
    receive a deterministic structure even when OCR mis-reads a cell.
    """
    try:
        return int(str(value))
    except (TypeError, ValueError):
        return 0


def _parse_made_attempted(value: Any) -> tuple[int, int]:
    """Split a made/attempted string like ``"3/7"`` into integers.

    Invalid or missing values are interpreted as ``0/0``.
    """
    try:
        made, attempted = str(value).split("/", 1)
        return _to_int(made), _to_int(attempted)
    except (AttributeError, ValueError):
        return 0, 0


def get_player_stats(rows: List[Dict[str, Any]], username: str) -> Optional[Dict[str, Any]]:
    """Return the stats for ``username`` from ``rows``.

    Parameters
    ----------
    rows:
        A list of dictionaries as produced by OCR where each dictionary
        represents a player's row of statistics.  Keys may appear in any
        case.  Each row must include a ``team`` field identifying either
        "away" or "home".
    username:
        Target username to search for.  Comparison is case-insensitive.

    Returns
    -------
    dict | None
        A dictionary with normalized statistics for the first matching
        player or ``None`` when no match is found.
    """
    target = username.lower()
    for row in rows:
        normalized = {k.lower(): v for k, v in row.items()}
        name = str(normalized.get("username", "")).strip()
        if name.lower() != target:
            continue

        fgm, fga = _parse_made_attempted(normalized.get("fgm/fga"))
        tpm, tpa = _parse_made_attempted(normalized.get("3pm/3pa"))
        ftm, fta = _parse_made_attempted(normalized.get("ftm/fta"))

        return {
            "team": normalized.get("team", ""),
            "username": name,
            "grade": str(normalized.get("grd", "")),
            "points": _to_int(normalized.get("pts")),
            "rebounds": _to_int(normalized.get("reb")),
            "assists": _to_int(normalized.get("ast")),
            "steals": _to_int(normalized.get("stl")),
            "blocks": _to_int(normalized.get("blk")),
            "fouls": _to_int(normalized.get("fouls")),
            "turnovers": _to_int(normalized.get("to")),
            "fgm": fgm,
            "fga": fga,
            "three_pm": tpm,
            "three_pa": tpa,
            "ftm": ftm,
            "fta": fta,
        }

    return None
