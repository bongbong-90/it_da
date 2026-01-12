# app/services/kakao_map_service.py
import httpx
from app.core.config import settings
from typing import List, Dict


class KakaoMapService:

    async def search_places(
            self,
            query: str,
            x: float,
            y: float,
            radius: int = 3000
    ) -> List[Dict]:
        """카카오 로컬 API 장소 검색"""
        url = f"{settings.KAKAO_LOCAL_API_URL}/search/keyword.json"

        headers = {
            "Authorization": f"KakaoAK {settings.KAKAO_REST_API_KEY}"
        }

        params = {
            "query": query,
            "x": x,
            "y": y,
            "radius": radius,
            "size": 15
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params)

            if response.status_code == 200:
                data = response.json()
                return data.get('documents', [])
            else:
                return []