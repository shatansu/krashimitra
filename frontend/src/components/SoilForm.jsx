import { useState } from "react";

const FIELD_LABELS = {
  nitrogen: { hi: "Nitrogen (N)", en: "Nitrogen (N)", unit: "kg/ha", low: 0, high: 600, typical: 280 },
  phosphorus: { hi: "Phosphorus (P)", en: "Phosphorus (P)", unit: "kg/ha", low: 0, high: 60, typical: 22 },
  potassium: { hi: "Potash (K)", en: "Potassium (K)", unit: "kg/ha", low: 0, high: 500, typical: 200 },
  ph: { hi: "Mitti ka pH", en: "Soil pH", unit: "", low: 4, high: 10, typical: 7 },
  organic_carbon: { hi: "Jaivik carbon", en: "Organic carbon", unit: "%", low: 0, high: 3, step: 0.1, typical: 0.6 },
};

export default function SoilForm({ cropType, language, onSubmit, loading }) {
  const [soilData, setSoilData] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
    organic_carbon: "",
    soil_type: "black",
  });

  const handleChange = (field, value) => {
    setSoilData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const cleanData = {};
    Object.entries(soilData).forEach(([k, v]) => {
      if (v !== "" && v !== null) cleanData[k] = parseFloat(v) || v;
    });

    const query = language === "hi"
      ? `Meri mitti jaanch report ke anusaar ${cropType || "fasal"} ke liye khaad aur urvarak ki salah dein. Mitti data: N=${soilData.nitrogen || "?"}, P=${soilData.phosphorus || "?"}, K=${soilData.potassium || "?"}, pH=${soilData.ph || "?"}`
      : `Based on my soil health card, give fertilizer recommendations for ${cropType || "my crop"}. Soil: N=${soilData.nitrogen}, P=${soilData.phosphorus}, K=${soilData.potassium}, pH=${soilData.ph}`;

    onSubmit(cleanData, query);
  };

  const getNutrientStatus = (field, value) => {
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
  };

  const statusLabel = {
    low: { hi: "Kam", en: "Low", color: "var(--color-text-danger)" },
    medium: { hi: "Madhyam", en: "Medium", color: "var(--color-text-warning)" },
    good: { hi: "Achha", en: "Good", color: "var(--color-text-success)" },
    high: { hi: "Adhik", en: "High", color: "var(--color-text-warning)" },
  };

  return (
    <div className="soil-form-container">
      <h3>{language === "hi" ? "Mitti jaanch card data daalein" : "Enter soil health card data"}</h3>
      <p className="soil-subtitle">
        {language === "hi"
          ? "Mitti jaanch card se numbers dekhar bharein. Unknown ho to blank chhod sakte hain."
          : "Fill from your Soil Health Card. Leave blank if unknown."}
      </p>

      <div className="soil-fields">
        {Object.entries(FIELD_LABELS).map(([field, meta]) => {
          const status = getNutrientStatus(field, soilData[field]);
          const statusInfo = status ? statusLabel[status] : null;
          return (
            <div key={field} className="soil-field">
              <div className="soil-field-header">
                <label className="soil-label">
                  {language === "hi" ? meta.hi : meta.en}
                  {meta.unit && <span className="soil-unit"> ({meta.unit})</span>}
                </label>
                {statusInfo && (
                  <span className="nutrient-status" style={{ color: statusInfo.color }}>
                    {language === "hi" ? statusInfo.hi : statusInfo.en}
                  </span>
                )}
              </div>
              <div className="soil-input-row">
                <input
                  type="number"
                  className="soil-input"
                  value={soilData[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={`${language === "hi" ? "Udaharan" : "e.g."} ${meta.typical}`}
                  min={meta.low}
                  max={meta.high}
                  step={meta.step || 1}
                />
                {meta.unit && <span className="soil-unit-label">{meta.unit}</span>}
              </div>
              {soilData[field] && (
                <div className="nutrient-bar">
                  <div
                    className="nutrient-bar-fill"
                    style={{
                      width: `${Math.min(100, (parseFloat(soilData[field]) / meta.high) * 100)}%`,
                      backgroundColor: status === "low"
                        ? "var(--color-background-danger)"
                        : status === "good"
                          ? "var(--color-background-success)"
                          : "var(--color-background-warning)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        <div className="soil-field">
          <label className="soil-label">{language === "hi" ? "Mitti ka prakaar" : "Soil type"}</label>
          <select
            className="soil-input"
            value={soilData.soil_type}
            onChange={(e) => handleChange("soil_type", e.target.value)}
          >
            <option value="black">Black (Cotton soil)</option>
            <option value="red">Red soil</option>
            <option value="alluvial">Alluvial</option>
            <option value="sandy">Sandy</option>
            <option value="loamy">Loamy</option>
          </select>
        </div>
      </div>

      <div className="shc-info">
        <span>Info</span>
        <p>
          {language === "hi"
            ? "Soil Health Card nahi hai? soilhealth.dac.gov.in par apply karein."
            : "No Soil Health Card? Apply at soilhealth.dac.gov.in"}
        </p>
      </div>

      <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading
          ? (language === "hi" ? "Vishleshan ho raha hai..." : "Analyzing...")
          : (language === "hi" ? "Mitti ka vishleshan karein ->" : "Analyze soil ->")}
      </button>
    </div>
  );
}
