const config = window.CLAP_AUTOMATION_CONFIG;

const startButton = document.querySelector("#startButton");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");
const meterBar = document.querySelector("#meterBar");
const clapCount = document.querySelector("#clapCount");
const thresholdValue = document.querySelector("#thresholdValue");

let audioContext;
let analyser;
let dataArray;
let listening = false;
let recentClaps = [];
let lastClapAt = 0;
let cooldownUntil = 0;
let totalClaps = 0;

thresholdValue.textContent = config.clapThreshold.toFixed(2);

function setStatus(text, mode) {
  statusText.textContent = text;
  statusDot.className = `dot ${mode}`;
}

function calculatePeak() {
  analyser.getByteTimeDomainData(dataArray);

  let peak = 0;
  for (const sample of dataArray) {
    const normalized = Math.abs(sample - 128) / 128;
    if (normalized > peak) {
      peak = normalized;
    }
  }

  return peak;
}

function registerClap(now) {
  if (now - lastClapAt < config.minGapBetweenClapsMs) {
    return;
  }

  lastClapAt = now;
  totalClaps += 1;
  clapCount.textContent = String(totalClaps);

  recentClaps = [...recentClaps, now].filter(
    (timestamp) => now - timestamp <= config.doubleClapWindowMs
  );

  if (recentClaps.length >= 2 && now > cooldownUntil) {
    cooldownUntil = now + config.cooldownMs;
    recentClaps = [];
    setStatus("Doble aplauso detectado. Abriendo YouTube...", "success");
    window.location.href = config.youtubeUrl;
  }
}

function listen() {
  if (!listening) {
    return;
  }

  const peak = calculatePeak();
  meterBar.style.transform = `scaleX(${Math.min(peak * 1.8, 1)})`;

  const now = performance.now();
  if (peak >= config.clapThreshold && now > cooldownUntil) {
    registerClap(now);
    setStatus("Aplauso detectado", "active");
  } else if (now > cooldownUntil) {
    setStatus("Escuchando", "active");
  }

  requestAnimationFrame(listen);
}

async function startListening() {
  try {
    startButton.disabled = true;
    setStatus("Solicitando permiso de microfono...", "idle");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.fftSize);

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    listening = true;
    setStatus("Escuchando", "active");
    listen();
  } catch (error) {
    startButton.disabled = false;
    setStatus("No se pudo activar el microfono", "error");
    console.error(error);
  }
}

startButton.addEventListener("click", startListening);
