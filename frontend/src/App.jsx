import { useEffect, useState } from "react";
import VoiceInput from "./components/VoiceInput";
import ImageUpload from "./components/ImageUpload";
import SoilForm from "./components/SoilForm";
import Advisory from "./components/Advisory";
import AuditTrail from "./components/AuditTrail";
import { useKrishiAgent } from "./hooks/useKrishiAgent";
import { LANGUAGE_OPTIONS, cropLabel, cropOptions, t } from "./utils/i18n";
import "./App.css";

function cleanLocationPart(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function isTooGranularLocation(value) {
  return /(tehsil|tahsil|taluk|taluka|subdivision|sub-division|block)/i.test(value || "");
}

function formatDetectedLocation(address = {}) {
  const candidates = [
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.hamlet,
    address.suburb,
    address.city_district,
    address.state_district,
    address.county,
  ]
    .map(cleanLocationPart)
    .filter(Boolean);

  const locality = candidates.find((item) => !isTooGranularLocation(item)) || candidates[0] || "";
  const state = cleanLocationPart(address.state);

  if (locality && state && locality.toLowerCase() !== state.toLowerCase()) {
    return `${locality}, ${state}`;
  }

  return state || locality || "India";
}

const MODES = [
  { id: "voice", key: "modeVoice" },
  { id: "image", key: "modeImage" },
  { id: "soil", key: "modeSoil" },
  { id: "market", key: "modeMarket" },
];

const MARKET_CROPS = ["wheat", "soybean", "rice", "gram", "mustard", "maize"];

export default function App() {
  const [mode, setMode] = useState("voice");
  const [language, setLanguage] = useState("hi");
  const [location, setLocation] = useState("Rewa, Madhya Pradesh");
  const [locationStatus, setLocationStatus] = useState("detecting");
  const [cropType, setCropType] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const { loading, result, error, submit, reset } = useKrishiAgent();

  useEffect(() => {
    detectLocation();
  }, []);

  function detectLocation() {
    setLocationStatus("detecting");

    if (!navigator.geolocation) {
      setLocationStatus("manual");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await response.json();
          setLocation(formatDetectedLocation(data.address || {}));
          setLocationStatus("found");
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setLocationStatus("found");
        }
      },
      () => setLocationStatus("denied"),
      { timeout: 8000, enableHighAccuracy: false }
    );
  }

  function handleVoiceSubmit(transcript, imageFile, soilData) {
    submit({ query: transcript, language, location, cropType, imageFile, soilData });
  }

  const locationHintKey = {
    detecting: "detectingLocation",
    found: "detectedLocation",
    denied: "locationDenied",
    manual: "manualLocation",
  }[locationStatus] || "manualLocation";

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-leaf">KM</span>
            <div>
              <h1>KrishiMitra</h1>
              <p>{t(language, "tagline")}</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="location-bar">
            <span className="location-icon">{locationStatus === "detecting" ? "..." : t(language, "locationShort")}</span>

            <div className="location-field-wrap">
              <input
                className="location-input"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setLocationStatus("manual");
                }}
                placeholder={t(language, "districtPlaceholder")}
                title={t(language, "locationInputTitle")}
              />
              <span className="location-meta">{t(language, locationHintKey)}</span>
            </div>

            <button type="button" className="retry-loc-btn" onClick={detectLocation} title={t(language, "detectAgain")}>
              R
            </button>
          </div>

          <select className="lang-toggle" value={language} onChange={(event) => setLanguage(event.target.value)}>
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="crop-select">
            <select value={cropType} onChange={(event) => setCropType(event.target.value)}>
              <option value="">{t(language, "selectCrop")}</option>
              {cropOptions(language, false).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {locationStatus === "denied" && (
        <div className="loc-denied-banner">
          <span>{t(language, "locationDeniedBanner")}</span>
          <button type="button" onClick={detectLocation} className="loc-retry-link">
            {t(language, "retry")}
          </button>
        </div>
      )}

      <nav className="mode-nav">
        {MODES.map((item) => (
          <button
            key={item.id}
            className={`mode-btn ${mode === item.id ? "active" : ""}`}
            onClick={() => {
              setMode(item.id);
              reset();
            }}
          >
            <span className="mode-label-hi">{t(language, item.key)}</span>
            <span className="mode-label-en">&nbsp;</span>
          </button>
        ))}
      </nav>

      <main className="main-content">
        <div className="input-panel">
          {mode === "voice" && <VoiceInput language={language} onSubmit={(text) => handleVoiceSubmit(text, null, null)} loading={loading} />}

          {mode === "image" && (
            <ImageUpload
              language={language}
              cropType={cropType}
              location={location}
              onCropTypeChange={setCropType}
              onResetResult={reset}
              onSubmit={(file, query) => submit({ query, language, location, cropType, imageFile: file })}
              loading={loading}
            />
          )}

          {mode === "soil" && (
            <SoilForm cropType={cropType} language={language} onSubmit={(soilData, query) => handleVoiceSubmit(query, null, soilData)} loading={loading} />
          )}

          {mode === "market" && (
            <div className="market-input">
              <h3>{t(language, "modeMarket")}</h3>
              <p className="market-location-note">{`${t(language, "marketTitle")}: ${location}`}</p>
              <div className="market-crop-grid">
                {MARKET_CROPS.map((crop) => (
                  <button
                    key={crop}
                    className="crop-price-btn"
                    onClick={() =>
                      submit({
                        query:
                          language === "en"
                            ? `Tell me today's mandi price for ${cropLabel(language, crop)} and whether I should sell or hold. My location is ${location}.`
                            : `Aaj ${cropLabel(language, crop)} ka mandi bhaav batao aur bechne ya rakhne ki salah do. Meri location ${location} hai.`,
                        language,
                        location,
                        cropType: crop,
                      })
                    }
                  >
                    {cropLabel(language, crop)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-banner">
            <span>{`${t(language, "warning")}: ${error}`}</span>
          </div>
        )}

        {(loading || result) && (
          <div className="output-panel">
            {loading && (
              <div className="loading-state">
                <div className="loading-steps">
                  <div className="loading-step active">{`${t(language, "loadingDataPrefix")} ${location}...`}</div>
                  <div className="loading-step">{t(language, "loadingAnalyze")}</div>
                  <div className="loading-step">{t(language, "loadingChecks")}</div>
                </div>
              </div>
            )}

            {result && !loading && (
              <>
                <Advisory result={result} language={language} />

                <div className="audit-section">
                  <button className="audit-toggle-btn" onClick={() => setShowAudit(!showAudit)}>
                    {showAudit ? t(language, "hideDecisionAuditTrail") : t(language, "showDecisionAuditTrail")}
                    <span className="audit-count">{`${result.audit_trail?.length || 0} ${t(language, "steps")}`}</span>
                  </button>

                  {showAudit && <AuditTrail trail={result.audit_trail} language={language} />}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>{t(language, "footer")}</p>
      </footer>
    </div>
  );
}
