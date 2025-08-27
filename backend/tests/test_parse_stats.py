import types
from pathlib import Path
import sys

sys.modules["cv2"] = types.SimpleNamespace()
sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import parse_stats


def test_parse_stats_accepts_grade_first_split_tokens() -> None:
    row = "A AUSWEN 21 5 11 2 0 4 0 9 16 2 2 1 2"

    stats = parse_stats(row, "AUSWEN")

    assert stats["username"] == "AUSWEN"
    assert stats["grade"] == "A"
    assert stats["fgm"] == 9 and stats["fga"] == 16
    assert stats["tpm"] == 2 and stats["tpa"] == 2
    assert stats["ftm"] == 1 and stats["fta"] == 2


def test_parse_stats_accepts_username_first() -> None:
    row = "AUSWEN B+ 15 3 4 1 1 2 0 6/10 3/5 0/0"

    stats = parse_stats(row, "AUSWEN")

    assert stats["grade"] == "B+"
    assert stats["points"] == 15
    assert stats["fgm"] == 6 and stats["fga"] == 10
    assert stats["tpm"] == 3 and stats["tpa"] == 5


def test_parse_stats_tolerates_missing_tokens() -> None:
    row = "A AUSWEN 10 5 3 2 1 2 3 5/10 2/5"
    stats = parse_stats(row, "AUSWEN")
    assert stats["fta"] == 0 and stats["ftm"] == 0


def test_parse_stats_accepts_fused_grade_username() -> None:
    row = "B-AUSWEN 8 2 1 0 0 1 0 3/5 1/3 1/2"
    stats = parse_stats(row, "AUSWEN")
    assert stats["username"] == "AUSWEN"
    assert stats["grade"] == "B-"
    assert stats["points"] == 8


def test_parse_stats_skips_non_numeric_prefix() -> None:
    row = "B; AUSWEN 14 2 3 1 0 0 0 7/14 2/5 1/2"
    stats = parse_stats(row, "AUSWEN")
    assert stats["points"] == 14
    assert stats["rebounds"] == 2
    assert stats["assists"] == 3
    assert stats["fgm"] == 7 and stats["fga"] == 14
