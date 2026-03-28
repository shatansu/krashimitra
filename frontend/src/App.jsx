import { useState } from "react";
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
  const [cropType, setCropType] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const { loading, result, error, submit, reset } = useKrishiAgent();

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
            <span className="location-icon">📍</span>
            <input
              className="location-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
            />
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
              <div className="market-crop-grid">
                {["गेहूं", "सोयाबीन", "धान", "चना", "सरसों", "मक्का"].map((crop) => (
                  <button
                    key={crop}
                    className="crop-price-btn"
                    onClick={() => submit({
                      query: `${crop} का आज का मंडी भाव बताओ और बेचने या रखने की सलाह दो`,
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
                  <div className="loading-step active">📡 डेटा इकट्ठा हो रहा है...</div>
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