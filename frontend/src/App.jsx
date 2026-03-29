import { useState, useEffect } from "react";
import VoiceInput from "./components/VoiceInput";
import ImageUpload from "./components/ImageUpload";
import SoilForm from "./components/SoilForm";
import Advisory from "./components/Advisory";
import AuditTrail from "./components/AuditTrail";
import { useKrishiAgent } from "./hooks/useKrishiAgent";
import "./App.css";

const MODES = [
  { id: "voice", label: "आवाज़ से पूछें", labelEn: "Voice Query" },
  { id: "image", label: "फ़ोटो भेजें", labelEn: "Crop Photo" },
  { id: "soil", label: "मिट्टी जांच", labelEn: "Soil Analysis" },
  { id: "market", label: "बाज़ार भाव", labelEn: "Market Price" },
];

export default function App() {
  const [mode, setMode] = useState("voice");
  const [language, setLanguage] = useState("hi");
  const [location, setLocation] = useState("Rewa, Madhya Pradesh");
  const [locationStatus, setLocationStatus] = useState("detecting"); // detecting | found | manual | denied
  const [cropType, setCropType] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const { loading, result, error, submit, reset } = useKrishiAgent();

  // ── AUTO LOCATION DETECT ON LOAD ──────────────────────────
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocationStatus("detecting");
    if (!navigator.geolocation) {
      setLocationStatus("manual");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode using OpenStreetMap (free, no key needed)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          // Build location string: District, State
          const district = addr.county || addr.city_district || addr.city || addr.town || addr.village || "";
          const state = addr.state || "";
          const locStr = district && state ? `${district}, ${state}` : (state || "India");
          setLocation(locStr);
          setLocationStatus("found");
        } catch {
          // Fallback: use lat/lon directly
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setLocationStatus("found");
        }
      },
      (err) => {
        // User denied or error
        setLocationStatus("denied");
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  const handleVoiceSubmit = (transcript, imageFile, soilData) => {
    submit({ query: transcript, language, location, cropType, imageFile, soilData });
  };

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
              {locationStatus === "detecting" ? "⏳" :
               locationStatus === "found" ? "📍" :
               locationStatus === "denied" ? "📍" : "📍"}
            </span>
            <input
              className="location-input"
              value={locationStatus === "detecting" ? "पता लगा रहे हैं..." : location}
              onChange={(e) => { setLocation(e.target.value); setLocationStatus("manual"); }}
              placeholder="Location"
              title="अपना स्थान बदलने के लिए यहाँ लिखें"
            />
            {locationStatus === "denied" && (
              <button
                className="retry-loc-btn"
                onClick={detectLocation}
                title="फिर से location detect करें"
              >↻</button>
            )}
          </div>
          <select
            className="lang-toggle"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="hi">हिंदी</option>
            <option value="en">English</option>
          </select>
          <div className="crop-select">
            <select value={cropType} onChange={(e) => setCropType(e.target.value)}>
              <option value="">फसल चुनें</option>
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

      {/* Location denied banner */}
      {locationStatus === "denied" && (
        <div className="loc-denied-banner">
          📍 Location access denied —
          <strong> browser settings mein allow karo</strong> ya neeche manually likhो।
          <button onClick={detectLocation} className="loc-retry-link">Retry</button>
        </div>
      )}

      <nav className="mode-nav">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-btn ${mode === m.id ? "active" : ""}`}
            onClick={() => { setMode(m.id); reset(); }}
          >
            <span className="mode-label-hi">{m.label}</span>
            <span className="mode-label-en">{m.labelEn}</span>
          </button>
        ))}
      </nav>

      <main className="main-content">
        <div className="input-panel">
          {mode === "voice" && (
            <VoiceInput
              language={language}
              onSubmit={(t) => handleVoiceSubmit(t, null, null)}
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
                📍 {location} ke mandi bhav
              </p>
              <div className="market-crop-grid">
                {["गेहूं", "सोयाबीन", "धान", "चना", "सरसों", "मक्का"].map((crop) => (
                  <button
                    key={crop}
                    className="crop-price-btn"
                    onClick={() => submit({
                      query: `${crop} का आज का मंडी भाव बताओ और बेचने या रखने की सलाह दो। मेरी लोकेशन ${location} है।`,
                      language, location, cropType: crop
                    })}
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
                  <div className="loading-step active">📡 {location} का डेटा इकट्ठा हो रहा है...</div>
                  <div className="loading-step">🌿 विश्लेषण हो रहा है...</div>
                  <div className="loading-step">✅ जांच पड़ताल हो रही है...</div>
                </div>
              </div>
            )}

            {result && !loading && (
              <>
                <Advisory result={result} language={language} />
                <div className="audit-section">
                  <button
                    className="audit-toggle-btn"
                    onClick={() => setShowAudit(!showAudit)}
                  >
                    {showAudit ? "▲" : "▼"}{" "}
                    {language === "hi" ? "निर्णय का लेखा-जोखा देखें" : "View Decision Audit Trail"}
                    <span className="audit-count">{result.audit_trail?.length || 0} steps</span>
                  </button>
                  {showAudit && (
                    <AuditTrail trail={result.audit_trail} language={language} />
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          KrishiMitra — {language === "hi"
            ? "CIB&RC, ICAR और NPOP दिशानिर्देशों के अनुसार | किसान हेल्पलाइन: 1800-180-1551"
            : "Compliant with CIB&RC, ICAR & NPOP guidelines | Kisan Helpline: 1800-180-1551"}
        </p>
      </footer>
    </div>
  );
}