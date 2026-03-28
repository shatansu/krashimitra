import { useState, useRef } from "react";

export default function ImageUpload({ language, cropType, location, onSubmit, loading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState("");
  const fileInputRef = useRef(null);

  const DEFAULT_QUERY_HI = "इस फसल में क्या बीमारी या कीट है? क्या उपाय करूँ?";
  const DEFAULT_QUERY_EN = "What disease or pest is affecting this crop? What should I do?";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    const finalQuery = query.trim() || (language === "hi" ? DEFAULT_QUERY_HI : DEFAULT_QUERY_EN);
    onSubmit(selectedFile, finalQuery);
  };

  return (
    <div className="image-upload-container">
      <h3>{language === "hi" ? "फसल की फ़ोटो भेजें" : "Upload crop photo"}</h3>
      <p className="upload-subtitle">
        {language === "hi"
          ? "बीमारी, कीट या पोषण की कमी पहचानने के लिए"
          : "For disease, pest or nutrient deficiency detection"}
      </p>

      {/* Drop zone */}
      <div
        className={`drop-zone ${preview ? "has-preview" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !preview && fileInputRef.current.click()}
      >
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="Crop preview" className="crop-preview" />
            <button
              className="remove-image-btn"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreview(null); }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="drop-placeholder">
            <div className="drop-icon">📷</div>
            <p>{language === "hi" ? "फ़ोटो यहाँ डालें या क्लिक करें" : "Drop photo here or click to select"}</p>
            <p className="drop-hint">JPG, PNG — max 10MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          capture="environment"
        />
      </div>

      {/* Quick question buttons */}
      <div className="quick-questions">
        <p className="quick-label">{language === "hi" ? "क्या जानना है?" : "What do you want to know?"}</p>
        <div className="quick-grid">
          {[
            { hi: "बीमारी पहचानें", en: "Identify disease" },
            { hi: "कीट पहचानें", en: "Identify pest" },
            { hi: "पोषण की कमी", en: "Nutrient deficiency" },
            { hi: "उपाय बताएं", en: "Suggest treatment" },
          ].map((q, i) => (
            <button
              key={i}
              className={`quick-btn ${query === (language === "hi" ? q.hi : q.en) ? "selected" : ""}`}
              onClick={() => setQuery(language === "hi" ? q.hi : q.en)}
            >
              {language === "hi" ? q.hi : q.en}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="query-textarea"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={language === "hi" ? DEFAULT_QUERY_HI : DEFAULT_QUERY_EN}
        rows={2}
      />

      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={!selectedFile || loading}
      >
        {loading
          ? (language === "hi" ? "फ़ोटो की जांच हो रही है..." : "Analyzing photo...")
          : (language === "hi" ? "फ़ोटो भेजें और सलाह लें →" : "Analyze & get advice →")}
      </button>

      {!selectedFile && (
        <p className="privacy-note">
          {language === "hi"
            ? "🔒 आपकी फ़ोटो सुरक्षित है — केवल विश्लेषण के लिए उपयोग होती है"
            : "🔒 Your photo is private — used only for analysis"}
        </p>
      )}
    </div>
  );
}