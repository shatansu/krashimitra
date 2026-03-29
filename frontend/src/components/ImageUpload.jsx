import { useRef, useState } from "react";
import { inspectImage } from "../utils/api";
import { cropOptions, questionOptions, t } from "../utils/i18n";

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

  const defaultQuery = questionOptions(language)[0];

  async function validateImage(file) {
    if (!file.type.startsWith("image/")) {
      return { valid: false, reason: t(language, "imageTypeError") };
    }
    if (file.size > 20 * 1024 * 1024) {
      return { valid: false, reason: t(language, "imageSizeError") };
    }

    try {
      const img = await loadImage(file);
      if (img.width < 100 || img.height < 100) {
        return { valid: false, reason: t(language, "imageSmallError") };
      }
      return { valid: true };
    } catch {
      return { valid: false, reason: t(language, "imageLoadError") };
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

      if (analysis.detected_crop && !cropType) {
        onCropTypeChange?.(analysis.detected_crop);
      }

      if (!analysis.is_crop_image || !analysis.image_clear) {
        setValidationError(
          analysis.user_message_local || analysis.user_message_hi || analysis.user_message || t(language, "imagePrepareError")
        );
      }
    } catch {
      setSelectedFile(null);
      setPreview(null);
      setValidationError(t(language, "imagePrepareError"));
    } finally {
      setValidating(false);
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      await runInspection(file);
    }
  }

  async function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await runInspection(file);
    }
  }

  function handleSubmit() {
    if (!selectedFile || validationError) {
      return;
    }

    const finalQuery = query.trim() || defaultQuery;
    const resolvedCrop = cropType || inspection?.detected_crop || "unknown";
    const queryWithContext = `${finalQuery} (Location: ${location}; Crop: ${resolvedCrop})`;
    onSubmit(selectedFile, queryWithContext);
  }

  const selectedCropValue = cropType || inspection?.detected_crop || "";
  const disableSubmit = !selectedFile || loading || validating || Boolean(validationError);

  return (
    <div className="image-upload-container">
      <h3>{t(language, "imageTitle")}</h3>
      <p className="upload-subtitle">{t(language, "imageSubtitle")}</p>

      <div className="image-warning">{t(language, "imageWarning")}</div>

      <div
        className={`drop-zone ${preview ? "has-preview" : ""} ${validating ? "validating" : ""}`}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        onClick={() => !preview && !validating && fileInputRef.current?.click()}
      >
        {validating ? (
          <div className="drop-placeholder">
            <div className="drop-icon">...</div>
            <p>{t(language, "imagePreparing")}</p>
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
            <div className="preview-badge">{t(language, "imageReady")}</div>
          </div>
        ) : (
          <div className="drop-placeholder">
            <div className="drop-icon">Photo</div>
            <p>{t(language, "imageDrop")}</p>
            <p className="drop-hint">{t(language, "imageHint")}</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} capture="environment" />
      </div>

      {inspection && !validationError && (
        <div className="image-ai-panel">
          <div className="image-ai-row">
            <strong>{t(language, "imageAiCheck")}</strong>
            <span className="image-ai-chip">{inspection.confidence || "medium"}</span>
          </div>
          <p className="image-ai-message">{inspection.user_message_local || inspection.user_message_hi || inspection.user_message}</p>

          <label className="image-crop-label">
            {t(language, "imageDetectedCrop")}
            <select className="image-crop-select" value={selectedCropValue} onChange={(event) => onCropTypeChange?.(event.target.value)}>
              {cropOptions(language).map((option) => (
                <option key={option.value || "auto"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="image-crop-help">{t(language, "imageWrongCrop")}</p>
        </div>
      )}

      {validationError && <div className="validation-error">{validationError}</div>}

      <div className="quick-questions">
        <p className="quick-label">{t(language, "imageWhatKnow")}</p>
        <div className="quick-grid">
          {questionOptions(language).map((item) => (
            <button key={item} className={`quick-btn ${query === item ? "selected" : ""}`} onClick={() => setQuery(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <textarea className="query-textarea" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={defaultQuery} rows={2} />

      <button className="submit-btn" onClick={handleSubmit} disabled={disableSubmit}>
        {loading ? t(language, "imageAnalyzing") : t(language, "imageSubmit")}
      </button>

      <p className="privacy-note">{t(language, "privacy")}</p>
    </div>
  );
}
