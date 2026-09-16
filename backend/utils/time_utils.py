from datetime import datetime, timezone

def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def get_utc_timestamp() -> float:
    return datetime.now(timezone.utc).timestamp()
