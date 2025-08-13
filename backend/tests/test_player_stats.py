from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from player_stats import get_player_stats


def sample_rows():
    return [
        {
            "team": "away",
            "username": "AUSWEN",
            "GRD": "A",
            "PTS": "21",
            "REB": "5",
            "AST": "11",
            "STL": "2",
            "BLK": "0",
            "FOULS": "4",
            "TO": "0",
            "FGM/FGA": "9/16",
            "3PM/3PA": "2/2",
            "FTM/FTA": "1/2",
        },
        {
            "team": "home",
            "username": "OtherUser",
            "GRD": "B+",
            "PTS": "10",
            "REB": "4",
            "AST": "3",
            "STL": "1",
            "BLK": "1",
            "FOULS": "2",
            "TO": "1",
            "FGM/FGA": "4/12",
            "3PM/3PA": "1/4",
            "FTM/FTA": "1/1",
        },
    ]


def test_find_player_case_insensitive():
    stats = get_player_stats(sample_rows(), "auswen")
    assert stats == {
        "team": "away",
        "username": "AUSWEN",
        "grade": "A",
        "points": 21,
        "rebounds": 5,
        "assists": 11,
        "steals": 2,
        "blocks": 0,
        "fouls": 4,
        "turnovers": 0,
        "fgm": 9,
        "fga": 16,
        "three_pm": 2,
        "three_pa": 2,
        "ftm": 1,
        "fta": 2,
    }


def test_returns_none_when_missing():
    assert get_player_stats(sample_rows(), "missing") is None


def test_handles_bad_numbers():
    rows = [
        {
            "team": "home",
            "username": "User",
            "GRD": "B",
            "PTS": "N/A",
            "REB": None,
            "AST": "3",
            "STL": "1",
            "BLK": "1",
            "FOULS": "2",
            "TO": "1",
            "FGM/FGA": "bad",
            "3PM/3PA": "1/3",
            "FTM/FTA": "",
        }
    ]
    stats = get_player_stats(rows, "user")
    assert stats["points"] == 0
    assert stats["rebounds"] == 0
    assert stats["fgm"] == 0 and stats["fga"] == 0
    assert stats["three_pm"] == 1 and stats["three_pa"] == 3
    assert stats["ftm"] == 0 and stats["fta"] == 0
