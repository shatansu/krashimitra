import { useRef, useState } from "react";
import { inspectImage } from "../utils/api";

const CROP_OPTIONS = [
  { value: "", labelHi: "AI se detect hone do", labelEn: "Let AI detect" },
  { value: "wheat", labelHi: "Gehu", labelEn: "Wheat" },
  { value: "soybean", labelHi: "Soyabean", labelEn: "Soybean" },
  { value: "rice", labelHi: "Dhan", labelEn: "Rice" },
  { value: "gram", labelHi: "Chana", labelEn: "Gram" },
  { value: "mustard", labelHi: "Sarson", labelEn: "Mustard" },
  { value: "maize", labelHi: "Makka", labelEn: "Maize" },
  { value: "tomato", labelHi: "Tamatar", labelEn: "Tomato" },
  { value: "lentil", labelHi: "Masoor", labelEn: "Lentil" },
];

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Photo could not be loaded."));
    };
    img.src = url;
  });
}

function canvasToJpegFile(canvas, originalName) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to prepare image for AI."));
          return;
        }
        const safeName = (originalName || "crop-photo").replace(/\.[^.]+$/, "");
        resolve(new File([blob], `${safeName}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  });
}

async function normalizeImageForAI(file) {
  const img = await loadImage(file);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvasToJpegFile(canvas, file.name);
}

export default function ImageUpload({
  language,
  cropType,
  location,
  onSubmit,
  onCropTypeChange,
  onResetResult,
  loading,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [inspection, setInspection] = useState(null);
  const fileInputRef = useRef(null);

  const DEFAULT_QUERY_HI = "Is fasal me kya bimari ya keet hai? Kya upay karun?";
  const DEFAULT_QUERY_EN = "What disease or pest is affecting this crop? What should I do?";

  async function validateImage(file) {
    if (!file.type.startsWith("image/")) {
      return {
        valid: false,
        reason: language === "hi" ? "Kripya image file upload karein." : "Please upload an image file.",
      };
    }
    if (file.size > 20 * 1024 * 1024) {
      return {
        valid: false,
        reason: language === "hi" ? "Photo 20MB se chhoti honi chahiye." : "Photo must be smaller than 20MB.",
      };
    }

    try {
      const img = await loadImage(file);
      if (img.width < 100 || img.height < 100) {
        return {
          valid: false,
          reason: language === "hi" ? "Photo bahut chhoti hai. Clear photo dijiye." : "Photo is too small. Please upload a clearer photo.",
        };
      }
      return { valid: true };
    } catch {
      return {
        valid: false,
        reason: language === "hi" ? "Photo load nahi ho saki. Dusri photo try karein." : "Photo could not be loaded. Please try another image.",
      };
    }
  }

  function setPreviewFromFile(file) {
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function runInspection(file) {
    onResetResult?.();
    setValidationError(null);
    setInspection(null);
    setValidating(true);

    const basicValidation = await validateImage(file);
    if (!basicValidation.valid) {
      setValidating(false);
      setValidationError(basicValidation.reason);
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    try {
      const aiReadyFile = await normalizeImageForAI(file);
      setSelectedFile(aiReadyFile);
      setPreviewFromFile(aiReadyFile);

      const analysis = await inspectImage({ imageFile: aiReadyFile, language, cropType });
      setInspection(analysis);

      if (analysis.detected_crop && (!cropType || cropType === "")) {
        onCropTypeChange?.(analysis.detected_crop);
      }

      if (!analysis.is_crop_image || !analysis.image_clear) {
        setValidationError(
          language === "hi"
            ? analysis.user_message_hi || analysis.user_message || "Kripya sahi aur clear fasal ki image upload karein."
            : analysis.user_message || "Please upload a correct and clear crop image."
        );
      }
    } catch (error) {
      setSelectedFile(null);
      setPreview(null);
      setValidationError(
        language === "hi"
          ? "Photo AI ke liye prepare nahi ho paayi. Kripya doosri image try karein."
          : (error.message || "Unable to prepare image for AI.")
      );
    } finally {
      setValidating(false);
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await runInspection(file);
  }

  async function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    await runInspection(file);
  }

  function handleSubmit() {
    if (!selectedFile || validationError) {
      return;
    }

    const finalQuery = query.trim() || (language === "hi" ? DEFAULT_QUERY_HI : DEFAULT_QUERY_EN);
    const resolvedCrop = cropType || inspection?.detected_crop || "unknown";
    const queryWithContext = `${finalQuery} (Location: ${location}; Crop: ${resolvedCrop})`;
    onSubmit(selectedFile, queryWithContext);
  }

  const selectedCropValue = cropType || inspection?.detected_crop || "";
  const disableSubmit = !selectedFile || loading || validating || Boolean(validationError);

  return (
    <div className="image-upload-container">
      <h3>{language === "hi" ? "Fasal ki photo bhejein" : "Upload crop photo"}</h3>
      <p className="upload-subtitle">
        {language === "hi"
          ? "AI pehle check karega ki image sach me fasal ki hai ya nahi, phir usi ke hisaab se analysis hoga."
          : "AI will first check whether the image is actually a crop photo, then analyze it."}
      </p>

      <div className="image-warning">
        {language === "hi"
          ? "Sirf asli fasal ya paudhe ki clear photo dijiye. Wrong image se wrong result aayega."
          : "Upload only a real and clear crop or plant photo. Wrong images will produce wrong results."}
      </div>

      <div
        className={`drop-zone ${preview ? "has-preview" : ""} ${validating ? "validating" : ""}`}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        onClick={() => !preview && !validating && fileInputRef.current?.click()}
      >
        {validating ? (
          <div className="drop-placeholder">
            <div className="drop-icon">...</div>
            <p>{language === "hi" ? "AI ke liye photo prepare aur inspect ho rahi hai..." : "Preparing and inspecting photo for AI..."}</p>
          </div>
        ) : preview ? (
          <div className="preview-container">
            <img src={preview} alt="Crop preview" className="crop-preview" />
            <button
              className="remove-image-btn"
              onClick={(event) => {
                event.stopPropagation();
                onResetResult?.();
                setSelectedFile(null);
                setPreview(null);
                setValidationError(null);
                setInspection(null);
              }}
            >
              x
            </button>
            <div className="preview-badge">Photo ready</div>
          </div>
        ) : (
          <div className="drop-placeholder">
            <div className="drop-icon">Photo</div>
            <p>{language === "hi" ? "Fasal ki photo yahan daalein ya click karein" : "Drop crop photo here or click"}</p>
            <p className="drop-hint">JPG, PNG, WEBP, mobile images - max 20MB</p>
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

      {inspection && !validationError && (
        <div className="image-ai-panel">
          <div className="image-ai-row">
            <strong>AI image check</strong>
            <span className="image-ai-chip">{inspection.confidence || "medium"}</span>
          </div>
          <p className="image-ai-message">
            {language === "hi" ? inspection.user_message_hi || inspection.user_message : inspection.user_message}
          </p>

          <label className="image-crop-label">
            {language === "hi" ? "Detected crop / manually change crop" : "Detected crop / change manually"}
            <select
              className="image-crop-select"
              value={selectedCropValue}
              onChange={(event) => onCropTypeChange?.(event.target.value)}
            >
              {CROP_OPTIONS.map((option) => (
                <option key={option.value || "auto"} value={option.value}>
                  {language === "hi" ? option.labelHi : option.labelEn}
                </option>
              ))}
            </select>
          </label>
          <p className="image-crop-help">
            {language === "hi"
              ? "Agar AI ne crop galat detect kiya ho to yahin se sahi crop choose karein."
              : "If AI detected the wrong crop, choose the correct crop here."}
          </p>
        </div>
      )}

      {validationError && <div className="validation-error">{validationError}</div>}

      <div className="quick-questions">
        <p className="quick-label">{language === "hi" ? "Kya janna hai?" : "What to know?"}</p>
        <div className="quick-grid">
          {[
            { hi: "Bimari pehchanein", en: "Identify disease" },
            { hi: "Keet pehchanein", en: "Identify pest" },
            { hi: "Poshan ki kami", en: "Nutrient deficiency" },
            { hi: "Upay batayein", en: "Suggest treatment" },
          ].map((item) => (
            <button
              key={item.en}
              className={`quick-btn ${query === (language === "hi" ? item.hi : item.en) ? "selected" : ""}`}
              onClick={() => setQuery(language === "hi" ? item.hi : item.en)}
            >
              {language === "hi" ? item.hi : item.en}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="query-textarea"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={language === "hi" ? DEFAULT_QUERY_HI : DEFAULT_QUERY_EN}
        rows={2}
      />

      <button className="submit-btn" onClick={handleSubmit} disabled={disableSubmit}>
        {loading
          ? (language === "hi" ? "Photo ki jaanch ho rahi hai..." : "Analyzing photo...")
          : (language === "hi" ? "Photo bhejein aur salah lein ->" : "Analyze and get advice ->")}
      </button>

      <p className="privacy-note">
        {language === "hi" ? "Aapki photo sirf analysis ke liye use hoti hai." : "Your photo is used only for analysis."}
      </p>
    </div>
  );
}
