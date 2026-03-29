import { useState, useRef } from "react";

const VALID_CROP_KEYWORDS = [
  "plant", "crop", "leaf", "leaves", "stem", "root", "flower", "fruit",
  "disease", "pest", "farm", "field", "soil", "green", "yellow", "brown",
  "wheat", "rice", "soybean", "tomato", "corn", "maize", "grass", "garden",
  "agriculture", "botanical", "vegetation", "tree", "branch"
];

export default function ImageUpload({ language, cropType, location, onSubmit, loading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const DEFAULT_QUERY_HI = "इस फसल में क्या बीमारी या कीट है? क्या उपाय करूँ?";
  const DEFAULT_QUERY_EN = "What disease or pest is affecting this crop? What should I do?";

  const validateImage = async (file) => {
    // Basic validation: size and type
    if (!file.type.startsWith("image/")) {
      return { valid: false, reason: "यह image file नहीं है। JPG या PNG photo डालें।" };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, reason: "Photo बहुत बड़ी है। 10MB से छोटी photo डालें।" };
    }

    // Resolution check via canvas
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { width, height } = img;
        if (width < 100 || height < 100) {
          resolve({ valid: false, reason: "Photo बहुत छोटी है। कम से कम 100x100px होनी चाहिए।" });
          return;
        }
        // Reasonable size = likely a real photo
        resolve({ valid: true });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, reason: "Photo load नहीं हो सकी। दूसरी photo try करें।" });
      };
      img.src = url;
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setValidationError(null);
    setValidating(true);

    const result = await validateImage(file);
    setValidating(false);

    if (!result.valid) {
      setValidationError(result.reason);
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setValidationError(null);
    setValidating(true);

    const result = await validateImage(file);
    setValidating(false);

    if (!result.valid) {
      setValidationError(result.reason);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    const finalQuery = query.trim() || (language === "hi" ? DEFAULT_QUERY_HI : DEFAULT_QUERY_EN);
    // Append location to query so backend uses correct area
    const queryWithLocation = `${finalQuery} (Location: ${location})`;
    onSubmit(selectedFile, queryWithLocation);
  };

  return (
    <div className="image-upload-container">
      <h3>{language === "hi" ? "फसल की फ़ोटो भेजें" : "Upload crop photo"}</h3>
      <p className="upload-subtitle">
        {language === "hi"
          ? "सिर्फ फसल या पौधे की फ़ोटो डालें — बीमारी, कीट या पोषण की कमी पहचानने के लिए"
          : "Upload only crop or plant photos — for disease, pest or deficiency detection"}
      </p>

      {/* Important warning */}
      <div className="image-warning">
        ⚠️ {language === "hi"
          ? "केवल फसल/पौधे की असली फ़ोटो डालें। दूसरी photos से गलत result आएगा।"
          : "Only upload real crop/plant photos. Other images will give wrong results."}
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone ${preview ? "has-preview" : ""} ${validating ? "validating" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !preview && !validating && fileInputRef.current.click()}
      >
        {validating ? (
          <div className="drop-placeholder">
            <div className="drop-icon">⏳</div>
            <p>{language === "hi" ? "Photo check हो रही है..." : "Validating photo..."}</p>
          </div>
        ) : preview ? (
          <div className="preview-container">
            <img src={preview} alt="Crop preview" className="crop-preview" />
            <button
              className="remove-image-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                setPreview(null);
                setValidationError(null);
              }}
            >✕</button>
            <div className="preview-badge">
              ✓ {language === "hi" ? "Photo ready" : "Photo ready"}
            </div>
          </div>
        ) : (
          <div className="drop-placeholder">
            <div className="drop-icon">📷</div>
            <p>{language === "hi" ? "फसल की फ़ोटो यहाँ डालें या क्लिक करें" : "Drop crop photo here or click"}</p>
            <p className="drop-hint">JPG, PNG — max 10MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: "none" }}
          capture="environment"
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="validation-error">
          ❌ {validationError}
        </div>
      )}

      {/* Quick question buttons */}
      <div className="quick-questions">
        <p className="quick-label">{language === "hi" ? "क्या जानना है?" : "What to know?"}</p>
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
        disabled={!selectedFile || loading || validating || !!validationError}
      >
        {loading
          ? (language === "hi" ? "फ़ोटो की जांच हो रही है..." : "Analyzing photo...")
          : (language === "hi" ? "फ़ोटो भेजें और सलाह लें →" : "Analyze & get advice →")}
      </button>

      <p className="privacy-note">
        🔒 {language === "hi"
          ? "आपकी फ़ोटो सुरक्षित है — केवल विश्लेषण के लिए उपयोग होती है"
          : "Your photo is private — used only for analysis"}
      </p>
    </div>
  );
}