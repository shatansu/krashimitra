from datetime import datetime
from typing import Optional
import json
import os

AUDIT_DIR = os.path.join(os.path.dirname(__file__), "../audit_logs")
os.makedirs(AUDIT_DIR, exist_ok=True)


class AuditLogger:
    """
    Immutable audit trail for every KrishiMitra advisory.
    Records: input, tool calls, compliance checks, final output.
    Designed for regulatory inspection and quality review.
    """

    def __init__(self):
        self._sessions: dict = {}
        self._hydrate_from_disk()

    def _hydrate_from_disk(self):
        """Load existing audit sessions from disk so they survive server restarts."""
        try:
            for filename in os.listdir(AUDIT_DIR):
                if not filename.endswith(".json"):
                    continue
                session_id = filename[:-5]
                path = os.path.join(AUDIT_DIR, filename)
                try:
                    with open(path, encoding="utf-8") as f:
                        self._sessions[session_id] = json.load(f)
                except (json.JSONDecodeError, OSError):
                    continue
        except OSError:
            pass

    def start_session(self, session_id: str, input_data: dict):
        self._sessions[session_id] = {
            "session_id": session_id,
            "started_at": datetime.utcnow().isoformat(),
            "input": input_data,
            "steps": [],
            "completed_at": None,
        }
        self._persist(session_id)

    def log_step(self, session_id: str, step_name: str, data: dict):
        if session_id not in self._sessions:
            self.start_session(session_id, {})

        step = {
            "step": step_name,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data,
        }
        self._sessions[session_id]["steps"].append(step)

        if step_name == "final_response":
            self._sessions[session_id]["completed_at"] = datetime.utcnow().isoformat()

        self._persist(session_id)

    def log_error(self, session_id: str, error: str):
        self.log_step(session_id, "error", {"error": error})

    def get_trail(self, session_id: str) -> list:
        if session_id in self._sessions:
            return self._sessions[session_id]["steps"]

        path = os.path.join(AUDIT_DIR, f"{session_id}.json")
        if os.path.exists(path):
            with open(path) as f:
                data = json.load(f)
                return data.get("steps", [])

        return []

    def get_full_session(self, session_id: str) -> Optional[dict]:
        if session_id in self._sessions:
            return self._sessions[session_id]
        path = os.path.join(AUDIT_DIR, f"{session_id}.json")
        if os.path.exists(path):
            with open(path) as f:
                return json.load(f)
        return None

    def _persist(self, session_id: str):
        path = os.path.join(AUDIT_DIR, f"{session_id}.json")
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(self._sessions[session_id], f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def format_for_display(self, session_id: str) -> list:
        """Return audit steps formatted for frontend display."""
        steps = self.get_trail(session_id)
        display = []
        for step in steps:
            name = step.get("step", "")
            ts = step.get("timestamp", "")
            data = step.get("data", {})

            label = {
                "agent_start": "Input received & parsed",
                "llm_call_1": "Agent started reasoning",
                "llm_call_2": "Agent continued reasoning",
                "llm_call_3": "Agent finalizing response",
                "compliance_check": "Compliance guardrails checked",
                "final_response": "Advisory delivered to farmer",
                "error": "Error occurred",
            }.get(name, name.replace("_", " ").title())

            if name.startswith("tool_call_"):
                tool = name.replace("tool_call_", "")
                label = f"Tool called: {tool}"
            elif name.startswith("tool_result_"):
                tool = name.replace("tool_result_", "")
                label = f"Data received: {tool}"

            status = "success"
            if name == "error":
                status = "error"
            elif name == "compliance_check":
                status = "warning" if data.get("status") == "WARNING" else (
                    "error" if data.get("status") == "BLOCKED" else "success"
                )

            display.append({
                "label": label,
                "timestamp": ts,
                "status": status,
                "details": data,
            })

        return display