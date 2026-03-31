import httpx
import os
import hashlib
from datetime import datetime, timedelta
import random

AGMARKNET_API = os.environ.get("AGMARKNET_API_KEY", "")

# Correct Resource ID for: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
# Source: data.gov.in | Ministry of Agriculture and Farmers Welfare
AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
AGMARKNET_BASE_URL = f"https://api.data.gov.in/resource/{AGMARKNET_RESOURCE_ID}"

# Correct field names (all lowercase as per data.gov.in schema):
# state, district, market, commodity, variety, grade,
# arrival_date, min_price, max_price, modal_price


class MandiService:
    """
    Fetches mandi (wholesale market) prices from Agmarknet via data.gov.in.
    Resource: Current Daily Price of Various Commodities from Various Markets (Mandi)
    Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
    """

    MSP_2024_25 = {
        "wheat":      2275,
        "rice":       2300,
        "soybean":    4892,
        "gram":       5440,
        "lentil":     6425,
        "mustard":    5950,
        "maize":      2090,
        "groundnut":  6783,
        "sunflower":  7280,
        "cotton":     7521,
        "sugarcane":  340,
    }

    async def get_prices(self, crop: str, location: str, state: str = "Madhya Pradesh") -> dict:
        crop_english = self._normalize_crop_name(crop.lower().strip())
        msp = self.MSP_2024_25.get(crop_english)

        if AGMARKNET_API:
            try:
                return await self._fetch_live_prices(crop_english, location, state, msp)
            except Exception as e:
                print(f"[MandiService] Live fetch failed: {e} — using mock data")

        return self._mock_prices(crop_english, location, msp)

    async def _fetch_live_prices(self, crop: str, location: str, state: str, msp: int) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                AGMARKNET_BASE_URL,
                params={
                    "api-key":            AGMARKNET_API,
                    "format":             "json",
                    "filters[state]":     state,          # CORRECT: lowercase field name
                    "filters[commodity]": crop.title(),   # CORRECT: lowercase field name
                    "limit":              10,
                },
            )

            if resp.status_code == 403:
                raise Exception("API key invalid or not activated on data.gov.in")
            if resp.status_code == 401:
                raise Exception("Unauthorized — check AGMARKNET_API_KEY")
            if resp.status_code != 200:
                raise Exception(f"HTTP {resp.status_code}")

            data = resp.json()
            records = data.get("records", [])

            if not records:
                # Try without state filter — some commodities have different state spellings
                resp2 = await client.get(
                    AGMARKNET_BASE_URL,
                    params={
                        "api-key":            AGMARKNET_API,
                        "format":             "json",
                        "filters[commodity]": crop.title(),
                        "limit":              10,
                    },
                )
                data = resp2.json()
                records = data.get("records", [])

            if not records:
                return self._mock_prices(crop, location, msp)

            # CORRECT field name: modal_price (lowercase)
            prices = [
                float(r["modal_price"])
                for r in records
                if r.get("modal_price") and float(r.get("modal_price", 0)) > 0
            ]

            avg_price = sum(prices) / len(prices) if prices else 0
            return self._build_price_response(crop, location, avg_price, prices, msp, live=True)

    def _build_price_response(self, crop, location, current_price, price_history, msp, live=False):
        signal = self._generate_market_signal(current_price, price_history, msp)
        return {
            "crop":                      crop,
            "location":                  location,
            "current_price_per_quintal": round(current_price),
            "msp_per_quintal":           msp,
            "vs_msp_percent":            round(((current_price - msp) / msp) * 100, 1) if msp and current_price else None,
            "market_signal":             signal,
            "price_history_7day":        self._format_history(price_history),
            "source":                    "Agmarknet (data.gov.in — live)" if live else "Mock data (set AGMARKNET_API_KEY)",
            "resource_id":               AGMARKNET_RESOURCE_ID,
            "timestamp":                 datetime.utcnow().isoformat(),
        }

    def _generate_market_signal(self, current, history, msp):
        if not history or len(history) < 2:
            trend = "stable"
        else:
            half = max(len(history) // 2, 1)
            old_avg = sum(history[half:]) / half
            new_avg = sum(history[:half]) / half
            pct = ((new_avg - old_avg) / old_avg * 100) if old_avg else 0
            trend = "rising" if pct > 3 else ("falling" if pct < -3 else "stable")

        below_msp = bool(msp and current and current < msp)

        if below_msp:
            signal = "hold"
            reason = f"Price Rs.{round(current)}/q is below MSP Rs.{msp}/q. Hold or use PM-KISAN Samridhi."
        elif trend == "rising" and current and msp and current > msp * 1.05:
            signal = "sell_now"
            reason = f"Price is rising and {round(((current - msp) / msp) * 100, 1)}% above MSP. Good time to sell."
        elif trend == "falling":
            signal = "sell_partial"
            reason = "Price trend falling. Consider selling 50% now, hold rest."
        else:
            signal = "monitor"
            reason = "Price is stable. Monitor for 3-5 days before deciding."

        return {"signal": signal, "trend": trend, "reason": reason, "below_msp": below_msp}

    def _format_history(self, prices):
        today = datetime.now()
        return [
            {
                "date":  (today - timedelta(days=len(prices) - 1 - i)).strftime("%Y-%m-%d"),
                "price": round(p),
            }
            for i, p in enumerate(prices)
        ]

    def _normalize_crop_name(self, name: str) -> str:
        mapping = {
            "gehu": "wheat", "gehun": "wheat", "गेहूं": "wheat",
            "chawal": "rice", "dhaan": "rice", "dhan": "rice", "धान": "rice", "paddy": "rice",
            "soya": "soybean", "soyabean": "soybean", "सोयाबीन": "soybean",
            "chana": "gram", "चना": "gram",
            "masoor": "lentil", "मसूर": "lentil",
            "sarson": "mustard", "सरसों": "mustard",
            "makka": "maize", "corn": "maize", "मक्का": "maize",
            "moongfali": "groundnut", "मूंगफली": "groundnut",
            "ganna": "sugarcane", "गन्ना": "sugarcane",
        }
        return mapping.get(name, name)

    def _mock_prices(self, crop: str, location: str, msp: int) -> dict:
        base = {
            "wheat": 2380, "rice": 2450, "soybean": 4650,
            "gram": 5600, "lentil": 6200, "mustard": 6100,
            "maize": 2150, "groundnut": 6900, "sugarcane": 355,
        }.get(crop, 3000)

        # Seed by crop + today's date so prices are deterministic within a day
        seed_str = f"{crop}:{datetime.now().strftime('%Y-%m-%d')}"
        seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16) % (2**32)
        rng = random.Random(seed)
        history = [base + rng.randint(-120, 120) for _ in range(7)]
        return self._build_price_response(crop, location, history[-1], history, msp, live=False)