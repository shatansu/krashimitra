from services.weather import WeatherService
from services.mandi import MandiService
from services.soil import SoilService
from services.schemes import SchemesService
from compliance.pesticide_db import PesticideDatabase

weather_svc = WeatherService()
mandi_svc = MandiService()
soil_svc = SoilService()
schemes_svc = SchemesService()
pesticide_db = PesticideDatabase()

TOOL_DEFINITIONS = [
    {
        "name": "get_weather",
        "description": "Get current weather and 7-day forecast for a location in India. Essential for spray timing, sowing decisions, and disease risk assessment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City/district name in India (e.g. 'Rewa, Madhya Pradesh')"
                },
                "include_forecast": {
                    "type": "boolean",
                    "description": "Whether to include 7-day forecast",
                    "default": True
                }
            },
            "required": ["location"]
        }
    },
    {
        "name": "get_mandi_prices",
        "description": "Get current and historical mandi (wholesale market) prices for agricultural commodities from e-NAM and Agmarknet.",
        "input_schema": {
            "type": "object",
            "properties": {
                "crop": {
                    "type": "string",
                    "description": "Crop name in English or Hindi (e.g. 'wheat', 'gehu', 'soybean', 'soya')"
                },
                "location": {
                    "type": "string",
                    "description": "Mandi/district location (e.g. 'Rewa')"
                },
                "state": {
                    "type": "string",
                    "description": "State name",
                    "default": "Madhya Pradesh"
                }
            },
            "required": ["crop", "location"]
        }
    },
    {
        "name": "analyze_soil",
        "description": "Interpret soil health card data and give fertilizer/amendment recommendations for a specific crop.",
        "input_schema": {
            "type": "object",
            "properties": {
                "nitrogen": {"type": "number", "description": "Nitrogen level in kg/ha"},
                "phosphorus": {"type": "number", "description": "Phosphorus level in kg/ha"},
                "potassium": {"type": "number", "description": "Potassium level in kg/ha"},
                "ph": {"type": "number", "description": "Soil pH (typically 4.0 to 9.0)"},
                "organic_carbon": {"type": "number", "description": "Organic carbon percentage"},
                "crop": {"type": "string", "description": "Target crop for recommendations"},
                "soil_type": {
                    "type": "string",
                    "description": "Soil type",
                    "enum": ["black", "red", "alluvial", "sandy", "clay", "loamy"]
                }
            },
            "required": ["crop"]
        }
    },
    {
        "name": "check_pesticide_safety",
        "description": "Check if a pesticide/chemical is approved, banned, or restricted in India. Returns PHI, MRL, approved crops, and safer alternatives.",
        "input_schema": {
            "type": "object",
            "properties": {
                "pesticide_name": {
                    "type": "string",
                    "description": "Common or brand name of pesticide (e.g. 'Endosulfan', 'Chlorpyrifos', 'Imidacloprid')"
                },
                "crop": {
                    "type": "string",
                    "description": "Target crop to check registration status"
                },
                "pest_target": {
                    "type": "string",
                    "description": "Pest or disease being targeted"
                }
            },
            "required": ["pesticide_name"]
        }
    },
    {
        "name": "get_govt_schemes",
        "description": "Check eligibility and details for government agricultural schemes in India (PM-KISAN, PMFBY, KCC, Soil Health Card, etc.)",
        "input_schema": {
            "type": "object",
            "properties": {
                "state": {
                    "type": "string",
                    "description": "State name",
                    "default": "Madhya Pradesh"
                },
                "land_holding_acres": {
                    "type": "number",
                    "description": "Farmer's total land holding in acres"
                },
                "crop": {
                    "type": "string",
                    "description": "Current crop for insurance-related schemes"
                },
                "scheme_type": {
                    "type": "string",
                    "description": "Type of scheme to look up",
                    "enum": ["income_support", "insurance", "credit", "input_subsidy", "all"]
                }
            },
            "required": ["state"]
        }
    },
    {
        "name": "get_crop_calendar",
        "description": "Get sowing, irrigation, fertilization, and harvesting schedule for a crop in a specific region.",
        "input_schema": {
            "type": "object",
            "properties": {
                "crop": {"type": "string", "description": "Crop name"},
                "region": {"type": "string", "description": "Region or district"},
                "season": {
                    "type": "string",
                    "enum": ["kharif", "rabi", "zaid"],
                    "description": "Cropping season"
                }
            },
            "required": ["crop", "region"]
        }
    },
]


async def execute_tool(tool_name: str, tool_input: dict) -> dict:
    """Route tool calls to appropriate service."""
    try:
        if tool_name == "get_weather":
            return await weather_svc.get_weather(
                location=tool_input.get("location", "Rewa"),
                include_forecast=tool_input.get("include_forecast", True),
            )

        elif tool_name == "get_mandi_prices":
            return await mandi_svc.get_prices(
                crop=tool_input.get("crop"),
                location=tool_input.get("location", "Rewa"),
                state=tool_input.get("state", "Madhya Pradesh"),
            )

        elif tool_name == "analyze_soil":
            return soil_svc.analyze(
                nitrogen=tool_input.get("nitrogen"),
                phosphorus=tool_input.get("phosphorus"),
                potassium=tool_input.get("potassium"),
                ph=tool_input.get("ph"),
                organic_carbon=tool_input.get("organic_carbon"),
                crop=tool_input.get("crop"),
                soil_type=tool_input.get("soil_type", "black"),
            )

        elif tool_name == "check_pesticide_safety":
            return pesticide_db.check(
                pesticide_name=tool_input.get("pesticide_name"),
                crop=tool_input.get("crop"),
                pest_target=tool_input.get("pest_target"),
            )

        elif tool_name == "get_govt_schemes":
            return schemes_svc.get_schemes(
                state=tool_input.get("state", "Madhya Pradesh"),
                land_holding_acres=tool_input.get("land_holding_acres"),
                crop=tool_input.get("crop"),
                scheme_type=tool_input.get("scheme_type", "all"),
            )

        elif tool_name == "get_crop_calendar":
            return soil_svc.get_crop_calendar(
                crop=tool_input.get("crop"),
                region=tool_input.get("region", "Rewa"),
                season=tool_input.get("season", "rabi"),
            )

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        return {"error": str(e), "tool": tool_name}