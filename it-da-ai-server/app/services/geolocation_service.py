# app/services/geolocation_service.py
from app.schemas.place import Participant, Centroid
from app.utils.distance_calculator import calculate_centroid, haversine_distance
from typing import List


class GeolocationService:

    async def calculate_centroid(self, participants: List[Participant]) -> Centroid:
        """참가자들의 중간지점 계산"""
        points = [(p.latitude, p.longitude) for p in participants]
        avg_lat, avg_lon = calculate_centroid(points)

        # 주소는 카카오 역지오코딩으로 구하거나 간단하게
        address = f"위도 {avg_lat:.4f}, 경도 {avg_lon:.4f}"

        return Centroid(
            latitude=avg_lat,
            longitude=avg_lon,
            address=address
        )

    def get_max_distance_from_centroid(
            self,
            participants: List[Participant],
            centroid: Centroid
    ) -> float:
        """중간지점에서 가장 먼 참가자까지의 거리"""
        max_dist = 0.0
        for p in participants:
            dist = haversine_distance(
                centroid.latitude, centroid.longitude,
                p.latitude, p.longitude
            )
            max_dist = max(max_dist, dist)

        return max_dist * 1000  # km → m