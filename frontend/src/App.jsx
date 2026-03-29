import { useEffect, useState } from "react";
import VoiceInput from "./components/VoiceInput";
import ImageUpload from "./components/ImageUpload";
import SoilForm from "./components/SoilForm";
import Advisory from "./components/Advisory";
import AuditTrail from "./components/AuditTrail";
import { useKrishiAgent } from "./hooks/useKrishiAgent";
import "./App.css";

const MODES = [
  { id: "voice", label: "आवाज से पूछें", labelEn: "Voice Query" },
  { id: "image", label: "फोटो भेजें", labelEn: "Crop Photo" },
  { id: "soil", label: "मिट्टी जांच", labelEn: "Soil Analysis" },
  { id: "market", label: "बाजार भाव", labelEn: "Market Price" },
];

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
      () => {
        setLocationStatus("denied");
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }

  function handleVoiceSubmit(transcript, imageFile, soilData) {
    submit({ query: transcript, language, location, cropType, imageFile, soilData });
  }

  const locationHint =
    locationStatus === "detecting"
      ? "Detecting location"
      : locationStatus === "found"
        ? "Detected location"
        : locationStatus === "denied"
          ? "Location access denied"
          : "Manual location";

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-leaf">🌿</span>
            <div>
              <h1>KrishiMitra</h1>
              <p>कृषि सलाहकार AI</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="location-bar">
            <span className="location-icon">
              {locationStatus === "detecting" ? "⏳" : "📍"}
            </span>

            <div className="location-field-wrap">
              <input
                className="location-input"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setLocationStatus("manual");
                }}
                placeholder={language === "hi" ? "जिला, राज्य लिखें" : "Enter district, state"}
                title="Click here and type any location manually"
              />
              <span className="location-meta">{locationHint}</span>
            </div>

            <button
              type="button"
              className="retry-loc-btn"
              onClick={detectLocation}
              title={language === "hi" ? "फिर से मेरी लोकेशन detect करें" : "Detect my location again"}
            >
              ↻
            </button>
          </div>

          <select
            className="lang-toggle"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="hi">हिंदी</option>
            <option value="en">English</option>
          </select>

          <div className="crop-select">
            <select value={cropType} onChange={(event) => setCropType(event.target.value)}>
              <option value="">{language === "hi" ? "फसल चुनें" : "Select crop"}</option>
              <option value="wheat">गेहूं (Wheat)</option>
              <option value="soybean">सोयाबीन</option>
              <option value="rice">धान (Rice)</option>
              <option value="gram">चना (Gram)</option>
              <option value="mustard">सरसों</option>
              <option value="maize">मक्का</option>
            </select>
          </div>
        </div>
      </header>

      {locationStatus === "denied" && (
        <div className="loc-denied-banner">
          <span>
            {language === "hi"
              ? "Location access deny ho gaya. Aap manually location type kar sakte hain."
              : "Location access was denied. You can type any location manually."}
          </span>
          <button type="button" onClick={detectLocation} className="loc-retry-link">
            {language === "hi" ? "Retry" : "Retry"}
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
            <span className="mode-label-hi">{item.label}</span>
            <span className="mode-label-en">{item.labelEn}</span>
          </button>
        ))}
      </nav>

      <main className="main-content">
        <div className="input-panel">
          {mode === "voice" && (
            <VoiceInput
              language={language}
              onSubmit={(text) => handleVoiceSubmit(text, null, null)}
              loading={loading}
            />
          )}

          {mode === "image" && (
            <ImageUpload
              language={language}
              cropType={cropType}
              location={location}
              onSubmit={(file, query) => submit({ query, language, location, cropType, imageFile: file })}
              loading={loading}
            />
          )}

          {mode === "soil" && (
            <SoilForm
              cropType={cropType}
              language={language}
              onSubmit={(soilData, query) => handleVoiceSubmit(query, null, soilData)}
              loading={loading}
            />
          )}

          {mode === "market" && (
            <div className="market-input">
              <h3>{language === "hi" ? "कौन सी फसल का भाव देखें?" : "Which crop price?"}</h3>
              <p className="market-location-note">
                📍 {language === "hi" ? `${location} के मंडी भाव` : `Mandi prices for ${location}`}
              </p>
              <div className="market-crop-grid">
                {["गेहूं", "सोयाबीन", "धान", "चना", "सरसों", "मक्का"].map((crop) => (
                  <button
                    key={crop}
                    className="crop-price-btn"
                    onClick={() =>
                      submit({
                        query:
                          language === "hi"
                            ? `${crop} का आज का मंडी भाव बताओ और बेचने या रखने की सलाह दो। मेरी लोकेशन ${location} है।`
                            : `Tell me today's mandi price for ${crop} and whether I should sell or hold. My location is ${location}.`,
                        language,
                        location,
                        cropType: crop,
                      })
                    }
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        {(loading || result) && (
          <div className="output-panel">
            {loading && (
              <div className="loading-state">
                <div className="loading-steps">
                  <div className="loading-step active">
                    📡 {language === "hi" ? `${location} का डेटा इकट्ठा हो रहा है...` : `Collecting data for ${location}...`}
                  </div>
                  <div className="loading-step">
                    🌿 {language === "hi" ? "विश्लेषण हो रहा है..." : "Analyzing..."}
                  </div>
                  <div className="loading-step">
                    ✅ {language === "hi" ? "जांच हो रही है..." : "Running compliance checks..."}
                  </div>
                </div>
              </div>
            )}

            {result && !loading && (
              <>
                <Advisory result={result} language={language} />

                <div className="audit-section">
                  <button className="audit-toggle-btn" onClick={() => setShowAudit(!showAudit)}>
                    {showAudit ? "▲" : "▼"}{" "}
                    {language === "hi" ? "निर्णय का लेखा-जोखा देखें" : "View decision audit trail"}
                    <span className="audit-count">{result.audit_trail?.length || 0} steps</span>
                  </button>

                  {showAudit && <AuditTrail trail={result.audit_trail} language={language} />}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          {language === "hi"
            ? "KrishiMitra - CIB&RC, ICAR aur NPOP guidelines ke anusar | Kisan Helpline: 1800-180-1551"
            : "KrishiMitra - Compliant with CIB&RC, ICAR and NPOP guidelines | Kisan Helpline: 1800-180-1551"}
        </p>
      </footer>
    </div>
  );
}
