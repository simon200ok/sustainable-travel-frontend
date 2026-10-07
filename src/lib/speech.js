let britishVoice = null;

function pickVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  britishVoice = voices.find((v) => v.lang === "en-GB") || voices.find((v) => v.lang?.startsWith("en")) || null;
  return britishVoice;
}

if ("speechSynthesis" in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

export const speechSupported = () => "speechSynthesis" in window;

export function speak(text, { interrupt = true } = {}) {
  if (!speechSupported() || !text) return;
  if (interrupt) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = britishVoice || pickVoice();
  utterance.lang = "en-GB";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export function spokenDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} kilometres`;
  if (meters >= 100) return `${Math.round(meters / 50) * 50} metres`;
  return `${Math.max(10, Math.round(meters / 10) * 10)} metres`;
}
