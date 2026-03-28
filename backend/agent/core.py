from __future__ import annotations

import os
from typing import Any

from agent.prompts import SYSTEM_PROMPT_EN, SYSTEM_PROMPT_HI
from agent.tools import execute_tool
from audit.logger import AuditLogger
from compliance.engine import ComplianceEngine

try:
    import anthropic
except ImportError:
    anthropic = None


class KrishiAgent:
    def __init__(
        self,
        audit_logger: AuditLogger | None = None,
        compliance_engine: ComplianceEngine | None = None,
    ) -> None:
        self.audit_logger = audit_logger or AuditLogger()
        self.compliance_engine = compliance_engine or ComplianceEngine()
        self.model = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest")
        self.max_tokens = 1400

        api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
        self.client = anthropic.Anthropic(api_key=api_key) if anthropic and api_key else None

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

        self.audit_logger.log_step(
            session_id,
            "agent_start",
            {
                "query": query,
                "language": language,
                "location": location,
                "crop_type": crop,
                "has_image": image_b64 is not None,
            },
        )

        tool_context = await self._collect_tool_context(
            session_id=session_id,
            query=query,
            location=location,
            crop=crop,
            soil_data=soil_data,
        )

        advisory_payload = await self._build_advisory(
            query=query,
            language=language,
            location=location,
            crop=crop,
            tool_context=tool_context,
            has_image=image_b64 is not None,
            image_media_type=image_media_type,
        )

        compliance_result = self.compliance_engine.validate_advisory(advisory_payload, crop)
        self.audit_logger.log_step(
            session_id,
            "compliance_check",
            {
                "status": compliance_result["status"],
                "flags": compliance_result["flags"],
            },
        )

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

        self.audit_logger.log_step(
            session_id,
            "final_response",
            {
                "compliance_status": response["compliance_status"],
                "data_sources": response["data_sources"],
                "confidence_score": response["confidence_score"],
            },
        )
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
            "weather": None,
            "mandi": None,
            "soil": None,
            "schemes": None,
            "pesticide": None,
            "data_sources": [],
            "market_signal": None,
            "scheme_eligibility": [],
        }

        tool_plan: list[tuple[str, dict[str, Any]]] = [
            ("get_weather", {"location": location, "include_forecast": True}),
            ("get_mandi_prices", {"crop": crop, "location": location}),
            ("get_govt_schemes", {"state": self._extract_state(location), "crop": crop, "scheme_type": "all"}),
        ]

        if soil_data:
            tool_plan.append(
                (
                    "analyze_soil",
                    {
                        "crop": crop,
                        "nitrogen": soil_data.get("nitrogen"),
                        "phosphorus": soil_data.get("phosphorus"),
                        "potassium": soil_data.get("potassium"),
                        "ph": soil_data.get("ph"),
                        "organic_carbon": soil_data.get("organic_carbon"),
                    },
                )
            )

        pesticide_name = self._extract_pesticide_name(query)
        if pesticide_name:
            tool_plan.append(
                (
                    "check_pesticide_safety",
                    {
                        "pesticide_name": pesticide_name,
                        "crop": crop,
                        "pest_target": query,
                    },
                )
            )

        if self._needs_crop_calendar(query):
            tool_plan.append(
                (
                    "get_crop_calendar",
                    {
                        "crop": crop,
                        "region": location,
                        "season": self._guess_season(query),
                    },
                )
            )

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

    async def _build_advisory(
        self,
        query: str,
        language: str,
        location: str,
        crop: str,
        tool_context: dict[str, Any],
        has_image: bool,
        image_media_type: str,
    ) -> dict[str, Any]:
        llm_payload = await self._try_llm_summary(
            query=query,
            language=language,
            location=location,
            crop=crop,
            tool_context=tool_context,
            has_image=has_image,
            image_media_type=image_media_type,
        )
        if llm_payload:
            return llm_payload
        return self._build_rule_based_advisory(
            query=query,
            language=language,
            location=location,
            crop=crop,
            tool_context=tool_context,
            has_image=has_image,
        )

    async def _try_llm_summary(
        self,
        query: str,
        language: str,
        location: str,
        crop: str,
        tool_context: dict[str, Any],
        has_image: bool,
        image_media_type: str,
    ) -> dict[str, Any] | None:
        if self.client is None:
            return None

        system_prompt = SYSTEM_PROMPT_HI if language == "hi" else SYSTEM_PROMPT_EN
        prompt = (
            "Use the provided tool outputs to answer the farmer in strict JSON with keys: "
            "advisory, advisory_hindi, action_steps, confidence. Do not invent data.\n\n"
            f"Location: {location}\n"
            f"Crop: {crop}\n"
            f"Query: {query}\n"
            f"Has image: {has_image}\n"
            f"Image media type: {image_media_type}\n"
            f"Tool context: {tool_context}"
        )

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}],
            )
            text_blocks = [block.text for block in response.content if hasattr(block, "text")]
            raw_text = "\n".join(text_blocks).strip()
            parsed = self._parse_json_response(raw_text)
            if not parsed:
                return None
            action_steps = parsed.get("action_steps") or []
            confidence = str(parsed.get("confidence", "medium")).lower()
            return {
                "advisory": parsed.get("advisory") or raw_text,
                "advisory_hindi": parsed.get("advisory_hindi") or parsed.get("advisory") or raw_text,
                "action_steps": action_steps,
                "confidence_score": self._confidence_to_score(confidence),
            }
        except Exception:
            return None

    def _build_rule_based_advisory(
        self,
        query: str,
        language: str,
        location: str,
        crop: str,
        tool_context: dict[str, Any],
        has_image: bool,
    ) -> dict[str, Any]:
        weather = tool_context.get("weather") or {}
        mandi = tool_context.get("mandi") or {}
        soil = tool_context.get("soil") or {}
        schemes = tool_context.get("schemes") or {}
        pesticide = tool_context.get("pesticide") or {}
        calendar = tool_context.get("calendar") or {}

        weather_advice = (weather.get("crop_advisory") or {}).get("advisories", [])
        soil_steps = (soil.get("fertilizer_recommendations") or []) + (soil.get("other_recommendations") or [])
        scheme_names = [item.get("scheme") for item in tool_context.get("scheme_eligibility", []) if item.get("scheme")]

        action_steps: list[str] = []
        if weather_advice:
            action_steps.append(weather_advice[0])
        if soil_steps:
            action_steps.append(soil_steps[0])
        else:
            action_steps.append("Scout the field carefully and note how much of the crop is affected before spraying anything.")
        if pesticide:
            pesticide_status = pesticide.get("status", "UNVERIFIED")
            if pesticide_status == "BANNED":
                alternatives = ", ".join(pesticide.get("alternatives", [])[:3])
                action_steps.append(f"Do not use the asked pesticide. Consider safer alternatives such as {alternatives}.")
            elif pesticide_status == "RESTRICTED":
                action_steps.append("Verify the pesticide label, crop registration, and waiting period before use.")
            elif pesticide_status == "APPROVED":
                action_steps.append(
                    f"If you use {pesticide.get('name')}, follow the label and keep at least {pesticide.get('phi_days')} days before harvest."
                )
        if mandi.get("market_signal"):
            action_steps.append(mandi["market_signal"].get("reason", "Monitor mandi prices before selling."))
        if calendar.get("sowing_window"):
            action_steps.append(f"Crop calendar: {calendar.get('sowing_window')}.")
        elif scheme_names:
            action_steps.append(f"Review these schemes if relevant: {', '.join(scheme_names[:3])}.")

        action_steps = action_steps[:5]

        current = weather.get("current") or {}
        market_signal = mandi.get("market_signal") or {}
        current_price = mandi.get("current_price_per_quintal")

        english_summary_parts = [
            f"For {crop} in {location}, the immediate focus is to assess the reported issue: {query}.",
        ]
        if has_image:
            english_summary_parts.append("An image was received and should be used as supportive evidence, but field inspection is still recommended.")
        if current:
            english_summary_parts.append(
                f"Weather is currently {current.get('description', 'stable')} at about {current.get('temperature_c', 'NA')} C with humidity near {current.get('humidity_percent', 'NA')}%."
            )
        if current_price:
            english_summary_parts.append(
                f"Indicative mandi price for {crop} around {location} is {current_price} INR/quintal."
            )
        if market_signal:
            english_summary_parts.append(f"Market signal: {market_signal.get('reason', 'Monitor prices closely.')}")
        if scheme_names:
            english_summary_parts.append(f"Relevant schemes may include {', '.join(scheme_names[:3])}.")

        advisory = " ".join(english_summary_parts)

        advisory_hindi = (
            f"{crop} ke liye {location} mein turant dhyan dene wali baat yeh hai: {query}. "
            f"Mausam aur mandi sanket ko dekhkar nirnay lein, aur spray se pehle khet ka nirikshan zarur karein."
        )
        if scheme_names:
            advisory_hindi += f" Upyogi yojanaen: {', '.join(scheme_names[:3])}."

        confidence_score = 0.45 + min(len(tool_context.get("data_sources", [])), 4) * 0.1
        confidence_score = round(min(confidence_score, 0.9), 2)

        if language == "hi":
            return {
                "advisory": advisory_hindi,
                "advisory_hindi": advisory_hindi,
                "action_steps": action_steps,
                "confidence_score": confidence_score,
            }

        return {
            "advisory": advisory,
            "advisory_hindi": advisory_hindi,
            "action_steps": action_steps,
            "confidence_score": confidence_score,
        }

    def _parse_json_response(self, text: str) -> dict[str, Any] | None:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            import json

            return json.loads(text[start : end + 1])
        except Exception:
            return None

    def _confidence_to_score(self, confidence: str) -> float:
        mapping = {"high": 0.85, "medium": 0.65, "low": 0.4}
        return mapping.get(confidence, 0.65)

    def _extract_state(self, location: str) -> str:
        parts = [part.strip() for part in location.split(",") if part.strip()]
        if len(parts) >= 2:
            return parts[-1]
        return "Madhya Pradesh"

    def _guess_crop(self, query: str) -> str | None:
        mapping = {
            "wheat": ["wheat", "gehu", "gehun"],
            "rice": ["rice", "paddy", "dhan", "dhaan"],
            "soybean": ["soybean", "soyabean", "soya"],
            "gram": ["gram", "chana"],
            "mustard": ["mustard", "sarson"],
            "maize": ["maize", "makka", "corn"],
            "tomato": ["tomato"],
        }
        query_lower = query.lower()
        for crop, aliases in mapping.items():
            if any(alias in query_lower for alias in aliases):
                return crop
        return None

    def _extract_pesticide_name(self, query: str) -> str | None:
        known_names = [
            "chlorpyrifos",
            "imidacloprid",
            "mancozeb",
            "carbendazim",
            "glyphosate",
            "endosulfan",
            "monocrotophos",
            "acephate",
            "paraquat",
        ]
        query_lower = query.lower()
        for name in known_names:
            if name in query_lower:
                return name
        return None

    def _needs_crop_calendar(self, query: str) -> bool:
        query_lower = query.lower()
        keywords = ["sow", "sowing", "harvest", "irrigation", "calendar", "season"]
        return any(keyword in query_lower for keyword in keywords)

    def _guess_season(self, query: str) -> str:
        query_lower = query.lower()
        if "kharif" in query_lower:
            return "kharif"
        if "zaid" in query_lower:
            return "zaid"
        return "rabi"
