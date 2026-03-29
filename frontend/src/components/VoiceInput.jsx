import { useState, useRef, useEffect } from "react";

const EXAMPLE_QUERIES_HI = [
  "Mere gehu me peele patte aa rahe hain, kya karun?",
  "Soyabean ki fasal me keede lag gaye hain.",
  "Aaj mandi me chana ka bhaav kya hai?",
  "Dhan ki buwai ka sahi samay kab hai?",
  "Mitti ka pH 8.2 hai, kya karun?",
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
        <h3>{language === "hi" ? "Apni samasya batayein" : "Ask your question"}</h3>
        <p className="voice-subtitle">
          {language === "hi" ? "Bolkar ya likhkar poochhein" : "Speak or type your query"}
        </p>
      </div>

      {speechSupported && (
        <div className="mic-section">
          <button
            className={`mic-btn ${isListening ? "listening" : ""}`}
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
          >
            <div className={`mic-icon ${isListening ? "pulsing" : ""}`}>{isListening ? "Stop" : "Mic"}</div>
            <span>
              {isListening
                ? (language === "hi" ? "Sun raha hoon... stop karne ke liye dabayein" : "Listening... tap to stop")
                : (language === "hi" ? "Bolna shuru karein" : "Tap to speak")}
            </span>
          </button>

          {(isListening || interimTranscript) && <div className="interim-text">{interimTranscript}</div>}
        </div>
      )}

      <textarea
        className="query-textarea"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder={language === "hi" ? "Yahan apna sawaal likhein ya bolkar poochhein..." : "Type or speak your query here..."}
        rows={4}
        disabled={loading}
      />

      {!transcript && (
        <div className="example-queries">
          <p className="examples-label">{language === "hi" ? "Udaharan:" : "Try asking:"}</p>
          <div className="examples-grid">
            {EXAMPLE_QUERIES_HI.slice(0, 3).map((q, i) => (
              <button key={i} className="example-btn" onClick={() => setTranscript(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="submit-btn" onClick={handleSubmit} disabled={!transcript.trim() || loading}>
        {loading
          ? (language === "hi" ? "Vishleshan ho raha hai..." : "Analyzing...")
          : (language === "hi" ? "Salah lein ->" : "Get Advisory ->")}
      </button>
    </div>
  );
}
