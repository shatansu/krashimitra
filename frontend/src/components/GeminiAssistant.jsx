import { useEffect, useMemo, useRef, useState } from "react";
import { supportChat } from "../utils/api";
import { SPEECH_LOCALES } from "../utils/i18n";

const UI = {
  en: {
    open: "Gemini Help",
    title: "Gemini Help",
    subtitle: "Ask doubts, get more details, and listen to the answer.",
    placeholder: "Ask anything about crop problems, weather, mandi, or treatment...",
    send: "Send",
    listening: "Listening...",
    thinking: "Thinking...",
    speak: "Speak answer",
    stop: "Stop voice",
    welcome: "Ask any farming question here. I can explain in text and voice.",
    voiceUnsupported: "Voice input is not supported in this browser.",
    soundUnsupported: "Voice playback is not supported in this browser.",
    error: "Unable to get a response right now. Please try again.",
    clear: "Clear chat",
    mic: "Mic",
  },
  hi: {
    open: "जेमिनी सहायता",
    title: "जेमिनी सहायता",
    subtitle: "सवाल पूछें, ज्यादा जानकारी लें, और आवाज में जवाब सुनें।",
    placeholder: "फसल, बीमारी, मौसम, मंडी या उपाय से जुड़ा कोई भी सवाल पूछें...",
    send: "भेजें",
    listening: "सुन रहा हूँ...",
    thinking: "सोच रहा हूँ...",
    speak: "जवाब सुनें",
    stop: "आवाज रोकें",
    welcome: "यहां खेती से जुड़ा कोई भी सवाल पूछें। मैं टेक्स्ट और आवाज दोनों में समझा सकता हूँ।",
    voiceUnsupported: "इस ब्राउज़र में voice input उपलब्ध नहीं है।",
    soundUnsupported: "इस ब्राउज़र में voice playback उपलब्ध नहीं है।",
    error: "अभी जवाब नहीं मिल पाया। कृपया फिर कोशिश करें।",
    clear: "चैट साफ करें",
    mic: "माइक",
  },
};

function copyFor(language) {
  return UI[language] || UI.hi;
}

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

export default function GeminiAssistant({ language, location, cropType }) {
  const copy = useMemo(() => copyFor(language), [language]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [createMessage("assistant", copyFor("hi").welcome)]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState("");
  const recognitionRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.role === "assistant") {
        return [createMessage("assistant", copy.welcome)];
      }
      return prev;
    });
  }, [copy]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = SPEECH_LOCALES[language] || SPEECH_LOCALES.hi;

      recognition.onresult = (event) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          text += event.results[i][0].transcript;
        }
        setInput(text.trim());
      };

      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
      recognitionRef.current = null;
    }
  }, [language]);

  useEffect(() => {
    setTtsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  function startListening() {
    if (!recognitionRef.current) {
      return;
    }
    setListening(true);
    recognitionRef.current.lang = SPEECH_LOCALES[language] || SPEECH_LOCALES.hi;
    recognitionRef.current.start();
  }

  function stopListening() {
    if (!recognitionRef.current) {
      return;
    }
    recognitionRef.current.stop();
    setListening(false);
  }

  function speakMessage(message) {
    if (!ttsSupported || !message?.content) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = SPEECH_LOCALES[language] || SPEECH_LOCALES.hi;
    utterance.rate = 1;
    utterance.onend = () => setSpeakingId("");
    utterance.onerror = () => setSpeakingId("");
    setSpeakingId(message.id);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (!ttsSupported) {
      return;
    }
    window.speechSynthesis.cancel();
    setSpeakingId("");
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) {
      return;
    }

    const userMessage = createMessage("user", text);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await supportChat({
        messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
        language,
        location,
        cropType,
      });

      const assistantMessage = createMessage("assistant", response.reply);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [...prev, createMessage("assistant", copy.error)]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    stopSpeaking();
    setMessages([createMessage("assistant", copy.welcome)]);
    setInput("");
  }

  return (
    <>
      <button type="button" className="gemini-fab" onClick={() => setOpen((prev) => !prev)} title={copy.open}>
        <span className="gemini-fab-icon">G</span>
        <span className="gemini-fab-label">{copy.open}</span>
      </button>

      {open && (
        <div className="gemini-panel">
          <div className="gemini-panel-header">
            <div>
              <h3>{copy.title}</h3>
              <p>{copy.subtitle}</p>
            </div>
            <button type="button" className="gemini-clear-btn" onClick={clearChat}>
              {copy.clear}
            </button>
          </div>

          <div className="gemini-messages" ref={listRef}>
            {messages.map((message) => (
              <div key={message.id} className={`gemini-message gemini-message-${message.role}`}>
                <div className="gemini-message-content">{message.content}</div>
                {message.role === "assistant" && (
                  <button
                    type="button"
                    className="gemini-speak-btn"
                    onClick={() => (speakingId === message.id ? stopSpeaking() : speakMessage(message))}
                    disabled={!ttsSupported}
                    title={ttsSupported ? copy.speak : copy.soundUnsupported}
                  >
                    {speakingId === message.id ? copy.stop : copy.speak}
                  </button>
                )}
              </div>
            ))}

            {loading && <div className="gemini-message gemini-message-assistant">{copy.thinking}</div>}
          </div>

          <div className="gemini-input-wrap">
            <textarea
              className="gemini-textarea"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={copy.placeholder}
              rows={3}
            />

            <div className="gemini-actions">
              <button
                type="button"
                className="gemini-voice-btn"
                onClick={listening ? stopListening : startListening}
                disabled={!speechSupported}
                title={speechSupported ? copy.listening : copy.voiceUnsupported}
              >
                {listening ? copy.listening : copy.mic}
              </button>
              <button type="button" className="gemini-send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
                {copy.send}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
