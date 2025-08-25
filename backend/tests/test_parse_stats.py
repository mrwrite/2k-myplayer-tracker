from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import parse_stats


def test_parse_stats_accepts_split_tokens() -> None:
    row = "AUSWEN A 21 5 11 2 0 4 0 9 16 2 2 1 2"
    stats = parse_stats(row)
    assert stats["username"] == "AUSWEN"
    assert stats["fgm"] == 9 and stats["fga"] == 16
    assert stats["tpm"] == 2 and stats["tpa"] == 2
    assert stats["ftm"] == 1 and stats["fta"] == 2

def test_parse_stats_tolerates_missing_tokens() -> None:
    row = "AUSWEN A 10 5 3 2 1 2 3 5/10 2/5"
    stats = parse_stats(row)
    assert stats["fta"] == 0 and stats["ftm"] == 0


