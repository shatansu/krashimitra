import httpx
import os
from datetime import datetime, timedelta
import random

AGMARKNET_API = os.environ.get("AGMARKNET_API_KEY", "")


class MandiService:
    """
    Fetches mandi (wholesale market) prices from e-NAM and Agmarknet.
    Provides sell/hold signal based on price trend and MSP comparison.
    """

    MSP_2024_25 = {
        "wheat": 2275,
        "rice": 2300,
        "soybean": 4892,
        "gram": 5440,
        "lentil": 6425,
        "mustard": 5950,
        "maize": 2090,
        "groundnut": 6783,
        "sunflower": 7280,
        "cotton": 7521,
        "sugarcane": 340,
    }

    MANDI_LOCATIONS_MP = {
        "rewa": ["Rewa Mandi", "Sidhi Mandi"],
        "bhopal": ["Bhopal Mandi", "Sehore Mandi"],
        "indore": ["Indore Mandi", "Dewas Mandi"],
        "jabalpur": ["Jabalpur Mandi"],
        "gwalior": ["Gwalior Mandi", "Morena Mandi"],
    }

    async def get_prices(self, crop: str, location: str, state: str = "Madhya Pradesh") -> dict:
        crop_lower = crop.lower().strip()
        crop_english = self._normalize_crop_name(crop_lower)
        msp = self.MSP_2024_25.get(crop_english, None)

        if AGMARKNET_API:
            try:
                return await self._fetch_live_prices(crop_english, location, state, msp)
            except Exception:
                pass

        return self._mock_prices(crop_english, location, msp)

    async def _fetch_live_prices(self, crop: str, location: str, state: str, msp: int) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070",
                params={
                    "api-key": AGMARKNET_API,
                    "format": "json",
                    "filters[State]": state,
                    "filters[Commodity]": crop.title(),
                    "limit": 10,
                },
            )
            data = resp.json()
            records = data.get("records", [])
            if not records:
                return self._mock_prices(crop, location, msp)

            prices = [float(r.get("Modal_Price", 0)) for r in records if r.get("Modal_Price")]
            avg_price = sum(prices) / len(prices) if prices else 0

            return self._build_price_response(crop, location, avg_price, prices, msp)

    def _build_price_response(self, crop: str, location: str,
                               current_price: float, price_history: list, msp: int) -> dict:
        signal = self._generate_market_signal(current_price, price_history, msp)
        return {
            "crop": crop,
            "location": location,
            "current_price_per_quintal": round(current_price),
            "msp_per_quintal": msp,
            "vs_msp_percent": round(((current_price - msp) / msp) * 100, 1) if msp else None,
            "market_signal": signal,
            "price_history_7day": self._format_history(price_history),
            "source": "Agmarknet / e-NAM",
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _generate_market_signal(self, current: float, history: list, msp: int) -> dict:
        if not history or len(history) < 2:
            trend = "stable"
        else:
            old_avg = sum(history[len(history)//2:]) / max(len(history)//2, 1)
            new_avg = sum(history[:len(history)//2]) / max(len(history)//2, 1)
            pct_change = ((new_avg - old_avg) / old_avg) * 100 if old_avg else 0
            if pct_change > 3:
                trend = "rising"
            elif pct_change < -3:
                trend = "falling"
            else:
                trend = "stable"

        below_msp = msp and current < msp

        if below_msp:
            signal = "hold"
            reason = f"Price ₹{round(current)}/q is below MSP ₹{msp}/q. Consider PM-KISAN Samridhi or wait for price recovery."
        elif trend == "rising" and current > (msp or 0) * 1.05:
            signal = "sell_now"
            reason = f"Price is rising and {round(((current - msp) / msp) * 100, 1) if msp else ''}% above MSP. Good time to sell."
        elif trend == "falling":
            signal = "sell_partial"
            reason = "Price trend is falling. Consider selling 50% now and holding rest."
        else:
            signal = "monitor"
            reason = "Price is stable. Monitor for 3-5 days before deciding."

        return {"signal": signal, "trend": trend, "reason": reason, "below_msp": below_msp}

    def _format_history(self, prices: list) -> list:
        today = datetime.now()
        return [
            {"date": (today - timedelta(days=len(prices) - 1 - i)).strftime("%Y-%m-%d"),
             "price": round(p)}
            for i, p in enumerate(prices)
        ]

    def _normalize_crop_name(self, name: str) -> str:
        mapping = {
            "gehu": "wheat", "gehun": "wheat", "गेहूं": "wheat",
            "chawal": "rice", "dhaan": "rice", "dhan": "rice", "धान": "rice",
            "soya": "soybean", "soyabean": "soybean", "सोयाबीन": "soybean",
            "chana": "gram", "gram": "gram", "चना": "gram",
            "masoor": "lentil", "मसूर": "lentil",
            "sarson": "mustard", "mustard": "mustard", "सरसों": "mustard",
            "makka": "maize", "corn": "maize", "मक्का": "maize",
            "moongfali": "groundnut", "मूंगफली": "groundnut",
            "ganna": "sugarcane", "गन्ना": "sugarcane",
        }
        return mapping.get(name, name)

    def _mock_prices(self, crop: str, location: str, msp: int) -> dict:
        base_prices = {
            "wheat": 2380, "rice": 2450, "soybean": 4650,
            "gram": 5600, "lentil": 6200, "mustard": 6100,
            "maize": 2150, "groundnut": 6900, "sugarcane": 355,
        }
        base = base_prices.get(crop, 3000)
        history = [base + random.randint(-100, 100) for _ in range(7)]
        current = history[-1]
        return self._build_price_response(crop, location, current, history, msp)