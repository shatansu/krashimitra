from __future__ import annotations

import os
import json
from typing import Any

from agent.prompts import SYSTEM_PROMPT_EN, SYSTEM_PROMPT_HI
from agent.tools import execute_tool
from audit.logger import AuditLogger
from compliance.engine import ComplianceEngine

try:
    import google.generativeai as genai
except ImportError:
    genai = None


class KrishiAgent:
    def __init__(
        self,
        audit_logger: AuditLogger | None = None,
        compliance_engine: ComplianceEngine | None = None,
    ) -> None:
        self.audit_logger = audit_logger or AuditLogger()
        self.compliance_engine = compliance_engine or ComplianceEngine()
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if genai and api_key:
            genai.configure(api_key=api_key)
            self.client = genai
        else:
            self.client = None

    async def process(
        self,
        session_id: str,
        query: str,
        language: str = "hi",
        location: str = "Rewa, Madhya Pradesh",
        soil_data: dict[str, Any] | None = None,
        crop_type: str | None = None,
        image_b64: str | None = None,
        image_media_type: str = "image/jpeg",
    ) -> dict[str, Any]:
        crop = (crop_type or self._guess_crop(query) or "your crop").strip()

        self.audit_logger.log_step(session_id, "agent_start", {
            "query": query, "language": language,
            "location": location, "crop_type": crop,
            "has_image": image_b64 is not None,
        })

        tool_context = await self._collect_tool_context(
            session_id=session_id, query=query,
            location=location, crop=crop, soil_data=soil_data,
        )

        advisory_payload = await self._build_advisory(
            query=query, language=language, location=location, crop=crop,
            tool_context=tool_context, has_image=image_b64 is not None,
            image_b64=image_b64, image_media_type=image_media_type,
        )

        compliance_result = self.compliance_engine.validate_advisory(advisory_payload, crop)
        self.audit_logger.log_step(session_id, "compliance_check", {
            "status": compliance_result["status"],
            "flags": compliance_result["flags"],
        })

        if compliance_result["status"] == "BLOCKED":
            blocked_msg = self._build_blocked_response(
                compliance_result["flags"],
                compliance_result.get("safe_alternatives", []),
                language,
            )
            advisory_payload["advisory"] = blocked_msg
            advisory_payload["advisory_hindi"] = blocked_msg

        response = {
            "session_id": session_id,
            "advisory": advisory_payload["advisory"],
            "advisory_hindi": advisory_payload.get("advisory_hindi") or advisory_payload["advisory"],
            "compliance_status": compliance_result["status"],
            "compliance_flags": compliance_result["flags"],
            "safe_alternatives": compliance_result.get("safe_alternatives", []),
            "data_sources": tool_context["data_sources"],
            "audit_trail": self.audit_logger.get_trail(session_id),
            "market_signal": tool_context["market_signal"],
            "scheme_eligibility": tool_context["scheme_eligibility"],
            "confidence_score": advisory_payload["confidence_score"],
            "action_steps": advisory_payload["action_steps"],
        }

        self.audit_logger.log_step(session_id, "final_response", {
            "compliance_status": response["compliance_status"],
            "data_sources": response["data_sources"],
            "confidence_score": response["confidence_score"],
        })
        response["audit_trail"] = self.audit_logger.get_trail(session_id)
        return response

    async def _collect_tool_context(
        self,
        session_id: str,
        query: str,
        location: str,
        crop: str,
        soil_data: dict[str, Any] | None,
    ) -> dict[str, Any]:
        tool_context: dict[str, Any] = {
            "weather": None, "mandi": None, "soil": None,
            "schemes": None, "pesticide": None,
            "data_sources": [], "market_signal": None, "scheme_eligibility": [],
        }

        tool_plan: list[tuple[str, dict[str, Any]]] = [
            ("get_weather",      {"location": location, "include_forecast": True}),
            ("get_mandi_prices", {"crop": crop, "location": location}),
            ("get_govt_schemes", {"state": self._extract_state(location), "crop": crop, "scheme_type": "all"}),
        ]

        if soil_data:
            tool_plan.append(("analyze_soil", {
                "crop": crop,
                "nitrogen":       soil_data.get("nitrogen"),
                "phosphorus":     soil_data.get("phosphorus"),
                "potassium":      soil_data.get("potassium"),
                "ph":             soil_data.get("ph"),
                "organic_carbon": soil_data.get("organic_carbon"),
            }))

        pesticide_name = self._extract_pesticide_name(query)
        if pesticide_name:
            tool_plan.append(("check_pesticide_safety", {
                "pesticide_name": pesticide_name,
                "crop": crop, "pest_target": query,
            }))

        if self._needs_crop_calendar(query):
            tool_plan.append(("get_crop_calendar", {
                "crop": crop, "region": location,
                "season": self._guess_season(query),
            }))

        for tool_name, tool_input in tool_plan:
            self.audit_logger.log_step(session_id, f"tool_call_{tool_name}", {"input": tool_input})
            result = await execute_tool(tool_name, tool_input)
            self.audit_logger.log_step(session_id, f"tool_result_{tool_name}", {"result": result})
            tool_context["data_sources"].append(tool_name)

            if tool_name == "get_weather":
                tool_context["weather"] = result
            elif tool_name == "get_mandi_prices":
                tool_context["mandi"] = result
                tool_context["market_signal"] = result.get("market_signal")
            elif tool_name == "analyze_soil":
                tool_context["soil"] = result
            elif tool_name == "get_govt_schemes":
                tool_context["schemes"] = result
                tool_context["scheme_eligibility"] = result.get("eligible_schemes", [])[:3]
            elif tool_name == "check_pesticide_safety":
                tool_context["pesticide"] = result
            elif tool_name == "get_crop_calendar":
                tool_context["calendar"] = result

        return tool_context

    async def _build_advisory(self, query, language, location, crop,
                               tool_context, has_image, image_b64, image_media_type):
        llm_payload = await self._try_gemini_summary(
            query=query, language=language, location=location, crop=crop,
            tool_context=tool_context, has_image=has_image,
            image_b64=image_b64, image_media_type=image_media_type,
        )
        if llm_payload:
            return llm_payload
        return self._build_rule_based_advisory(
            query=query, language=language, location=location,
            crop=crop, tool_context=tool_context, has_image=has_image,
        )

    async def _try_gemini_summary(self, query, language, location, crop,
                                   tool_context, has_image, image_b64, image_media_type):
        if self.client is None:
            return None

        system_prompt = SYSTEM_PROMPT_HI if language == "hi" else SYSTEM_PROMPT_EN
        prompt = (
            "Use the provided tool outputs to answer the farmer.\n"
            "Respond ONLY in strict JSON with keys:\n"
            "  advisory, advisory_hindi, action_steps (list), confidence (high/medium/low)\n"
            "Do NOT invent data. Use only what is provided.\n\n"
            f"Language: {language}\nLocation: {location}\nCrop: {crop}\n"
            f"Farmer query: {query}\nHas image: {has_image}\n"
            f"Tool data:\n{json.dumps(tool_context, ensure_ascii=False, indent=2)}"
        )

        try:
            model = self.client.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_prompt,
                generation_config={"max_output_tokens": 1400},
            )

            parts: list[Any] = []
            if image_b64 and has_image:
                parts.append({
                    "inline_data": {
                        "mime_type": image_media_type,
                        "data": image_b64,
                    }
                })
            parts.append(prompt)

            response = model.generate_content(parts)
            raw_text = response.text.strip()
            parsed = self._parse_json_response(raw_text)

            if not parsed:
                return {
                    "advisory": raw_text,
                    "advisory_hindi": raw_text,
                    "action_steps": [],
                    "confidence_score": 0.65,
                }

            confidence = str(parsed.get("confidence", "medium")).lower()
            return {
                "advisory":       parsed.get("advisory") or raw_text,
                "advisory_hindi": parsed.get("advisory_hindi") or parsed.get("advisory") or raw_text,
                "action_steps":   parsed.get("action_steps") or [],
                "confidence_score": self._confidence_to_score(confidence),
            }

        except Exception as e:
            print(f"[KrishiAgent] Gemini error: {e}")
            return None

    def _build_rule_based_advisory(self, query, language, location, crop, tool_context, has_image):
        weather   = tool_context.get("weather") or {}
        mandi     = tool_context.get("mandi") or {}
        soil      = tool_context.get("soil") or {}
        pesticide = tool_context.get("pesticide") or {}
        calendar  = tool_context.get("calendar") or {}

        weather_advice = (weather.get("crop_advisory") or {}).get("advisories", [])
        soil_steps     = (soil.get("fertilizer_recommendations") or []) + (soil.get("other_recommendations") or [])
        scheme_names   = [s.get("scheme") for s in tool_context.get("scheme_eligibility", []) if s.get("scheme")]

        action_steps: list[str] = []
        if weather_advice:
            action_steps.append(weather_advice[0])
        if soil_steps:
            action_steps.append(soil_steps[0])
        else:
            action_steps.append("Scout field carefully — note how much crop is affected before spraying.")

        if pesticide:
            status = pesticide.get("status", "UNVERIFIED")
            if status == "BANNED":
                alts = ", ".join(pesticide.get("alternatives", [])[:3])
                action_steps.append(f"Do NOT use requested pesticide (BANNED). Safer options: {alts}.")
            elif status == "RESTRICTED":
                action_steps.append("Verify pesticide label, crop registration, and waiting period before use.")
            elif status == "APPROVED":
                action_steps.append(
                    f"If using {pesticide.get('name')}, follow label — keep at least "
                    f"{pesticide.get('phi_days')} days before harvest."
                )

        market_signal = mandi.get("market_signal") or {}
        if market_signal.get("reason"):
            action_steps.append(market_signal["reason"])
        if calendar.get("sowing_window"):
            action_steps.append(f"Crop calendar: {calendar['sowing_window']}.")
        elif scheme_names:
            action_steps.append(f"Check eligible schemes: {', '.join(scheme_names[:3])}.")

        action_steps = action_steps[:5]

        current       = weather.get("current") or {}
        current_price = mandi.get("current_price_per_quintal")

        en_parts = [f"For {crop} in {location}, reported issue: {query}."]
        if has_image:
            en_parts.append("Crop image received — use alongside field inspection.")
        if current:
            en_parts.append(
                f"Weather: {current.get('description','stable')} at "
                f"{current.get('temperature_c','NA')}°C, humidity {current.get('humidity_percent','NA')}%."
            )
        if current_price:
            en_parts.append(f"Current mandi price for {crop}: Rs.{current_price}/quintal.")
        if market_signal.get("reason"):
            en_parts.append(f"Market: {market_signal['reason']}")
        if scheme_names:
            en_parts.append(f"Eligible schemes: {', '.join(scheme_names[:3])}.")

        advisory = " ".join(en_parts)
        advisory_hindi = (
            f"{crop} ke liye {location} mein turant dhyan: {query}. "
            "Mausam aur mandi sanket dekhkar nirnay lein."
        )
        if scheme_names:
            advisory_hindi += f" Yojanaen: {', '.join(scheme_names[:3])}."

        confidence_score = round(min(0.45 + len(tool_context.get("data_sources", [])) * 0.1, 0.9), 2)

        return {
            "advisory":        advisory_hindi if language == "hi" else advisory,
            "advisory_hindi":  advisory_hindi,
            "action_steps":    action_steps,
            "confidence_score": confidence_score,
        }

    def _build_blocked_response(self, flags, alternatives, language):
        if language == "hi":
            msg = "यह सलाह कृषि नियमों के अनुसार नहीं दी जा सकती:\n"
            for f in flags:
                msg += f"• {f}\n"
            if alternatives:
                msg += "\nसुरक्षित विकल्प:\n"
                for a in alternatives:
                    msg += f"• {a}\n"
        else:
            msg = "Advisory blocked by compliance rules:\n"
            for f in flags:
                msg += f"• {f}\n"
            if alternatives:
                msg += "\nSafe alternatives:\n"
                for a in alternatives:
                    msg += f"• {a}\n"
        return msg

    def _parse_json_response(self, text: str) -> dict[str, Any] | None:
        start = text.find("{")
        end   = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            return json.loads(text[start: end + 1])
        except Exception:
            return None

    def _confidence_to_score(self, confidence: str) -> float:
        return {"high": 0.85, "medium": 0.65, "low": 0.40}.get(confidence, 0.65)

    def _extract_state(self, location: str) -> str:
        parts = [p.strip() for p in location.split(",") if p.strip()]
        return parts[-1] if len(parts) >= 2 else "Madhya Pradesh"

    def _guess_crop(self, query: str) -> str | None:
        mapping = {
            "wheat":   ["wheat", "gehu", "gehun", "गेहूं"],
            "rice":    ["rice", "paddy", "dhan", "dhaan", "धान"],
            "soybean": ["soybean", "soyabean", "soya", "सोयाबीन"],
            "gram":    ["gram", "chana", "चना"],
            "mustard": ["mustard", "sarson", "सरसों"],
            "maize":   ["maize", "makka", "corn", "मक्का"],
            "tomato":  ["tomato", "tamatar", "टमाटर"],
            "lentil":  ["lentil", "masoor", "मसूर"],
        }
        q = query.lower()
        for crop, aliases in mapping.items():
            if any(a in q for a in aliases):
                return crop
        return None

    def _extract_pesticide_name(self, query: str) -> str | None:
        known = [
            "chlorpyrifos", "imidacloprid", "mancozeb", "carbendazim",
            "glyphosate", "endosulfan", "monocrotophos", "acephate",
            "paraquat", "thiamethoxam", "lambda", "cypermethrin",
        ]
        q = query.lower()
        for name in known:
            if name in q:
                return name
        return None

    def _needs_crop_calendar(self, query: str) -> bool:
        keywords = ["sow", "sowing", "harvest", "irrigation", "calendar",
                    "season", "buwai", "बुवाई", "fasal", "फसल"]
        return any(kw in query.lower() for kw in keywords)

    def _guess_season(self, query: str) -> str:
        q = query.lower()
        if "kharif" in q: return "kharif"
        if "zaid"   in q: return "zaid"
        return "rabi"