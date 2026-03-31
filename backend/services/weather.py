import httpx
import os
from datetime import datetime

OWM_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
BASE_URL = "https://api.openweathermap.org/data/2.5"

INDIA_DISTRICTS = {
    "rewa": {"lat": 24.5355, "lon": 81.2997, "state": "Madhya Pradesh"},
    "bhopal": {"lat": 23.2599, "lon": 77.4126, "state": "Madhya Pradesh"},
    "indore": {"lat": 22.7196, "lon": 75.8577, "state": "Madhya Pradesh"},
    "nagpur": {"lat": 21.1458, "lon": 79.0882, "state": "Maharashtra"},
    "pune": {"lat": 18.5204, "lon": 73.8567, "state": "Maharashtra"},
    "ludhiana": {"lat": 30.9010, "lon": 75.8573, "state": "Punjab"},
    "varanasi": {"lat": 25.3176, "lon": 82.9739, "state": "Uttar Pradesh"},
}


class WeatherService:

    async def get_weather(self, location: str, include_forecast: bool = True) -> dict:
        coords = self._resolve_location(location)
        lat, lon = coords["lat"], coords["lon"]

        if not OWM_API_KEY:
            return self._mock_weather(location)

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                current_resp = await client.get(
                    f"{BASE_URL}/weather",
                    params={"lat": lat, "lon": lon, "appid": OWM_API_KEY, "units": "metric"},
                )
                current = current_resp.json()

                result = {
                    "location": location,
                    "current": {
                        "temperature_c": round(current["main"]["temp"], 1),
                        "humidity_percent": current["main"]["humidity"],
                        "wind_speed_kmh": round(current["wind"]["speed"] * 3.6, 1),
                        "description": current["weather"][0]["description"],
                        "rain_mm_last_1h": current.get("rain", {}).get("1h", 0),
                    },
                    "source": "OpenWeatherMap",
                    "timestamp": datetime.utcnow().isoformat(),
                }

                if include_forecast:
                    forecast_resp = await client.get(
                        f"{BASE_URL}/forecast",
                        params={"lat": lat, "lon": lon, "appid": OWM_API_KEY, "units": "metric"},
                    )
                    forecast_data = forecast_resp.json()
                    result["forecast_7day"] = self._parse_forecast(forecast_data)

                result["crop_advisory"] = self._generate_weather_advisory(result)
                return result

        except Exception as e:
            return {"error": str(e), "fallback": self._mock_weather(location)}

    def _parse_forecast(self, data: dict) -> list:
        days = {}
        for item in data.get("list", []):
            date = item["dt_txt"][:10]
            if date not in days:
                days[date] = {
                    "date": date,
                    "temp_max": item["main"]["temp_max"],
                    "temp_min": item["main"]["temp_min"],
                    "rain_mm": item.get("rain", {}).get("3h", 0),
                    "humidity": item["main"]["humidity"],
                    "wind_kmh": round(item["wind"]["speed"] * 3.6, 1),
                    "description": item["weather"][0]["description"],
                }
            else:
                days[date]["temp_max"] = max(days[date]["temp_max"], item["main"]["temp_max"])
                days[date]["temp_min"] = min(days[date]["temp_min"], item["main"]["temp_min"])
                days[date]["rain_mm"] += item.get("rain", {}).get("3h", 0)

        return list(days.values())[:7]

    def _generate_weather_advisory(self, weather: dict) -> dict:
        current = weather.get("current", {})
        temp = current.get("temperature_c", 25)
        humidity = current.get("humidity_percent", 60)
        wind = current.get("wind_speed_kmh", 10)
        rain = current.get("rain_mm_last_1h", 0)

        advisories = []
        spray_safe = True

        if temp > 35:
            advisories.append("High temperature — avoid spraying. Prefer early morning (6-9 AM)")
            spray_safe = False
        if wind > 15:
            advisories.append(f"Wind speed {wind} km/h is too high for spraying (max 15 km/h)")
            spray_safe = False
        if humidity > 80:
            advisories.append("High humidity — disease pressure is high. Monitor for fungal diseases")
        if rain > 2:
            advisories.append(f"Recent rainfall {rain} mm — wait 2 hours before spraying")
            spray_safe = False

        if temp >= 20 and temp <= 30 and humidity >= 40 and humidity <= 70:
            advisories.append("Ideal conditions for field operations")

        return {
            "safe_to_spray": spray_safe,
            "advisories": advisories,
            "irrigation_needed": humidity < 40 and rain == 0,
        }

    def _resolve_location(self, location: str) -> dict:
        location_lower = location.lower().split(",")[0].strip()
        if location_lower in INDIA_DISTRICTS:
            return INDIA_DISTRICTS[location_lower]

        # Try OWM Geocoding API for unknown locations
        if OWM_API_KEY:
            try:
                import httpx as _httpx
                resp = _httpx.get(
                    "https://api.openweathermap.org/geo/1.0/direct",
                    params={"q": f"{location},IN", "limit": 1, "appid": OWM_API_KEY},
                    timeout=5,
                )
                data = resp.json()
                if data and isinstance(data, list) and len(data) > 0:
                    return {"lat": data[0]["lat"], "lon": data[0]["lon"]}
            except Exception:
                pass

        # Fallback to Rewa if everything else fails
        return {"lat": 24.5355, "lon": 81.2997}

    def _mock_weather(self, location: str) -> dict:
        """Fallback mock data for demo when API key not set."""
        return {
            "location": location,
            "current": {
                "temperature_c": 28.5,
                "humidity_percent": 65,
                "wind_speed_kmh": 12,
                "description": "partly cloudy",
                "rain_mm_last_1h": 0,
            },
            "forecast_7day": [
                {"date": "2024-11-01", "temp_max": 30, "temp_min": 18, "rain_mm": 0, "humidity": 60, "wind_kmh": 10, "description": "sunny"},
                {"date": "2024-11-02", "temp_max": 28, "temp_min": 17, "rain_mm": 5, "humidity": 75, "wind_kmh": 8, "description": "light rain"},
                {"date": "2024-11-03", "temp_max": 29, "temp_min": 19, "rain_mm": 0, "humidity": 62, "wind_kmh": 11, "description": "partly cloudy"},
                {"date": "2024-11-04", "temp_max": 31, "temp_min": 20, "rain_mm": 0, "humidity": 55, "wind_kmh": 14, "description": "sunny"},
                {"date": "2024-11-05", "temp_max": 27, "temp_min": 16, "rain_mm": 12, "humidity": 80, "wind_kmh": 7, "description": "heavy rain"},
                {"date": "2024-11-06", "temp_max": 26, "temp_min": 15, "rain_mm": 3, "humidity": 78, "wind_kmh": 9, "description": "drizzle"},
                {"date": "2024-11-07", "temp_max": 29, "temp_min": 17, "rain_mm": 0, "humidity": 64, "wind_kmh": 12, "description": "clear"},
            ],
            "crop_advisory": {
                "safe_to_spray": True,
                "advisories": ["Conditions good for field operations", "Rain expected Nov 5 — plan spraying before then"],
                "irrigation_needed": False,
            },
            "source": "Demo data (set OPENWEATHER_API_KEY for live data)",
        }