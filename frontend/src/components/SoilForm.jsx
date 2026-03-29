import { useState } from "react";
import { t } from "../utils/i18n";

const FIELD_LABELS = {
  nitrogen: { hi: "Nitrogen (N)", en: "Nitrogen (N)", unit: "kg/ha", low: 0, high: 600, typical: 280 },
  phosphorus: { hi: "Phosphorus (P)", en: "Phosphorus (P)", unit: "kg/ha", low: 0, high: 60, typical: 22 },
  potassium: { hi: "Potash (K)", en: "Potassium (K)", unit: "kg/ha", low: 0, high: 500, typical: 200 },
  ph: { hi: "Mitti ka pH", en: "Soil pH", unit: "", low: 4, high: 10, typical: 7 },
  organic_carbon: { hi: "Jaivik carbon", en: "Organic carbon", unit: "%", low: 0, high: 3, step: 0.1, typical: 0.6 },
};

export default function SoilForm({ cropType, language, onSubmit, loading }) {
  const [soilData, setSoilData] = useState({ nitrogen: "", phosphorus: "", potassium: "", ph: "", organic_carbon: "", soil_type: "black" });
  const local = language === "en" ? "en" : "hi";

  function handleChange(field, value) {
    setSoilData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    const cleanData = {};
    Object.entries(soilData).forEach(([key, value]) => {
      if (value !== "" && value !== null) {
        cleanData[key] = parseFloat(value) || value;
      }
    });

    const query = language === "en"
      ? `Based on my soil health card, give fertilizer recommendations for ${cropType || "my crop"}. Soil: N=${soilData.nitrogen}, P=${soilData.phosphorus}, K=${soilData.potassium}, pH=${soilData.ph}`
      : `Meri mitti jaanch report ke anusaar ${cropType || "fasal"} ke liye khaad aur urvarak ki salah dein. Mitti data: N=${soilData.nitrogen || "?"}, P=${soilData.phosphorus || "?"}, K=${soilData.potassium || "?"}, pH=${soilData.ph || "?"}`;

    onSubmit(cleanData, query);
  }

  function getNutrientStatus(field, value) {
    if (!value) return null;
    const v = parseFloat(value);
    const ranges = {
      nitrogen: { low: 280, high: 560 },
      phosphorus: { low: 10, high: 25 },
      potassium: { low: 108, high: 280 },
      ph: { low: 6.0, high: 7.5 },
      organic_carbon: { low: 0.5, high: 0.75 },
    };
    const r = ranges[field];
    if (!r) return null;
    if (field === "ph") {
      if (v < r.low) return "low";
      if (v > r.high) return "high";
      return "good";
    }
    if (v < r.low) return "low";
    if (v < r.high) return "medium";
    return "good";
  }

  return (
    <div className="soil-form-container">
      <h3>{t(language, "soilTitle")}</h3>
      <p className="soil-subtitle">{t(language, "soilSubtitle")}</p>

      <div className="soil-fields">
        {Object.entries(FIELD_LABELS).map(([field, meta]) => {
          const status = getNutrientStatus(field, soilData[field]);
          return (
            <div key={field} className="soil-field">
              <div className="soil-field-header">
                <label className="soil-label">
                  {meta[local]}
                  {meta.unit && <span className="soil-unit"> ({meta.unit})</span>}
                </label>
                {status && <span className="nutrient-status">{t(language, status)}</span>}
              </div>
              <div className="soil-input-row">
                <input
                  type="number"
                  className="soil-input"
                  value={soilData[field]}
                  onChange={(event) => handleChange(field, event.target.value)}
                  placeholder={`${t(language, "eg")} ${meta.typical}`}
                  min={meta.low}
                  max={meta.high}
                  step={meta.step || 1}
                />
                {meta.unit && <span className="soil-unit-label">{meta.unit}</span>}
              </div>
            </div>
          );
        })}

        <div className="soil-field">
          <label className="soil-label">{t(language, "soilType")}</label>
          <select className="soil-input" value={soilData.soil_type} onChange={(event) => handleChange("soil_type", event.target.value)}>
            <option value="black">Black (Cotton soil)</option>
            <option value="red">Red soil</option>
            <option value="alluvial">Alluvial</option>
            <option value="sandy">Sandy</option>
            <option value="loamy">Loamy</option>
          </select>
        </div>
      </div>

      <div className="shc-info">
        <span>{t(language, "info")}</span>
        <p>{t(language, "soilInfo")}</p>
      </div>

      <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? t(language, "loadingAnalyze") : t(language, "soilAnalyze")}
      </button>
    </div>
  );
}
