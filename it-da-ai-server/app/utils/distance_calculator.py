# app/utils/distance_calculator.py
from math import radians, sin, cos, sqrt, atan2


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    두 지점 간 거리 계산 (km)
    """
    R = 6371  # 지구 반지름 (km)

    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def calculate_centroid(points: list) -> tuple:
    """
    중간지점 계산
    points: [(lat, lon), ...]
    return: (avg_lat, avg_lon)
    """
    if not points:
        return (0.0, 0.0)

    avg_lat = sum(p[0] for p in points) / len(points)
    avg_lon = sum(p[1] for p in points) / len(points)

    return (avg_lat, avg_lon)