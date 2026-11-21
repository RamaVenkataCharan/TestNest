def calculate_risk(points: int) -> str:

    points = int(
        points or 0
    )

    if points >= 100:
        return "Critical"

    elif points >= 80:
        return "High"

    elif points >= 50:
        return "Medium"

    elif points >= 30:
        return "Warning"

    else:
        return "Low"