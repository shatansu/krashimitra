import { useState, useRef, useEffect } from "react";

const EXAMPLE_QUERIES_HI = [
  "मेरे गेहूं में पीले पत्ते आ रहे हैं, क्या करूँ?",
  "सोयाबीन की फसल में कीड़े लग गए हैं",
  "आज मंडी में चना का भाव क्या है?",
  "धान की बुवाई का सही समय कब है?",
  "मेरी मिट्टी का pH 8.2 है, क्या करूँ?",
];

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
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

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
        if (final) setTranscript((prev) => prev + final);
        setInterimTranscript(interim);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setInterimTranscript("");
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onSubmit(transcript.trim());
    }
  };

  return (
    <div className="voice-input-container">
      <div className="voice-title">
        <h3>{language === "hi" ? "अपनी समस्या बताएं" : "Ask your question"}</h3>
        <p className="voice-subtitle">
          {language === "hi"
            ? "बोलकर या लिखकर पूछें"
            : "Speak or type your query"}
        </p>
      </div>

      {/* Mic button */}
      {speechSupported && (
        <div className="mic-section">
          <button
            className={`mic-btn ${isListening ? "listening" : ""}`}
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
          >
            <div className={`mic-icon ${isListening ? "pulsing" : ""}`}>
              {isListening ? "⏹" : "🎤"}
            </div>
            <span>
              {isListening
                ? (language === "hi" ? "सुन रहा हूँ... (रोकने के लिए दबाएं)" : "Listening... (tap to stop)")
                : (language === "hi" ? "बोलना शुरू करें" : "Tap to speak")}
            </span>
          </button>

          {(isListening || interimTranscript) && (
            <div className="interim-text">{interimTranscript}</div>
          )}
        </div>
      )}

      {/* Text area */}
      <textarea
        className="query-textarea"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder={
          language === "hi"
            ? "यहाँ अपना सवाल लिखें या बोलकर पूछें..."
            : "Type or speak your query here..."
        }
        rows={4}
        disabled={loading}
      />

      {/* Example queries */}
      {!transcript && (
        <div className="example-queries">
          <p className="examples-label">
            {language === "hi" ? "उदाहरण:" : "Try asking:"}
          </p>
          <div className="examples-grid">
            {EXAMPLE_QUERIES_HI.slice(0, 3).map((q, i) => (
              <button
                key={i}
                className="example-btn"
                onClick={() => setTranscript(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={!transcript.trim() || loading}
      >
        {loading
          ? (language === "hi" ? "विश्लेषण हो रहा है..." : "Analyzing...")
          : (language === "hi" ? "सलाह लें →" : "Get Advisory →")}
      </button>
    </div>
  );
}