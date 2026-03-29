import { useState, useRef, useEffect } from "react";
import { SPEECH_LOCALES, t, voiceExamples } from "../utils/i18n";

export default function VoiceInput({ language, onSubmit, loading }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = SPEECH_LOCALES[language] || SPEECH_LOCALES.hi;

      recognition.onresult = (event) => {
        let final = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        if (final) {
          setTranscript((prev) => prev + final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  function startListening() {
    if (!recognitionRef.current) {
      return;
    }
    setTranscript("");
    setInterimTranscript("");
    setIsListening(true);
    recognitionRef.current.start();
  }

  function stopListening() {
    if (!recognitionRef.current) {
      return;
    }
    recognitionRef.current.stop();
    setIsListening(false);
  }

  function handleSubmit() {
    if (transcript.trim()) {
      onSubmit(transcript.trim());
    }
  }

  return (
    <div className="voice-input-container">
      <div className="voice-title">
        <h3>{t(language, "voiceTitle")}</h3>
        <p className="voice-subtitle">{t(language, "voiceSubtitle")}</p>
      </div>

      {speechSupported && (
        <div className="mic-section">
          <button className={`mic-btn ${isListening ? "listening" : ""}`} onClick={isListening ? stopListening : startListening} disabled={loading}>
            <div className={`mic-icon ${isListening ? "pulsing" : ""}`}>{isListening ? "Stop" : "Mic"}</div>
            <span>{isListening ? t(language, "listening") : t(language, "startSpeaking")}</span>
          </button>

          {(isListening || interimTranscript) && <div className="interim-text">{interimTranscript}</div>}
        </div>
      )}

      <textarea className="query-textarea" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder={t(language, "voicePlaceholder")} rows={4} disabled={loading} />

      {!transcript && (
        <div className="example-queries">
          <p className="examples-label">{t(language, "tryAsking")}</p>
          <div className="examples-grid">
            {voiceExamples(language).map((item) => (
              <button key={item} className="example-btn" onClick={() => setTranscript(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="submit-btn" onClick={handleSubmit} disabled={!transcript.trim() || loading}>
        {loading ? t(language, "loadingAnalyze") : t(language, "getAdvisory")}
      </button>
    </div>
  );
}
