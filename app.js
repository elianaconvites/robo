// ===== DETECÇÃO DE CONEXÃO LENTA =====
class BandwidthDetector {
  constructor() {
    this.isSlowConnection = false;
    this.checkBandwidth();
  }

  checkBandwidth() {
    if (navigator.connection) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      this.isSlowConnection = effectiveType === '2g' || effectiveType === '3g' || connection.saveData;
      
      if (this.isSlowConnection) {
        document.getElementById('bandwidth-warning').style.display = 'block';
      }

      connection.addEventListener('change', () => {
        this.isSlowConnection = connection.effectiveType === '2g' || connection.effectiveType === '3g' || connection.saveData;
        document.getElementById('bandwidth-warning').style.display = this.isSlowConnection ? 'block' : 'none';
      });
    }
  }

  getOptimizedSettings() {
    if (this.isSlowConnection) {
      return {
        videoWidth: 540,
        videoHeight: 960,
        fps: 15,
        bitrate: 300000
      };
    }
    return {
      videoWidth: 1080,
      videoHeight: 1920,
      fps: 24,
      bitrate: 1000000
    };
  }

  getPhotoCompression() {
    return this.isSlowConnection ? 0.7 : 0.9;
  }
}

// ===== GERENCIADOR DE MODO NOTURNO =====
class ThemeManager {
  constructor() {
    this.isDarkMode = this.getSystemPreference();
    this.init();
  }

  getSystemPreference() {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  init() {
    this.applyTheme();
    this.setupToggle();
    this.watchSystemChanges();
  }

  applyTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    if (this.isDarkMode) {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      themeToggle.textContent = '🌙';
    } else {
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
      themeToggle.textContent = '☀️';
    }

    localStorage.setItem('darkMode', this.isDarkMode);
  }

  setupToggle() {
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.isDarkMode = !this.isDarkMode;
      this.applyTheme();
    });
  }

  watchSystemChanges() {
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
          this.isDarkMode = e.matches;
          this.applyTheme();
        }
      });
    }
  }
}

// ===== MOSTRAR ERRO =====
function showError(title, message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.innerHTML = `<h3>${title}</h3><p>${message}</p>`;
  errorDiv.style.display = 'block';
  console.error(`${title}: ${message}`);
}

// ===== APLICATIVO PRINCIPAL =====
const bandwidthDetector = new BandwidthDetector();
const themeManager = new ThemeManager();

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const switchCameraBtn = document.getElementById('switch-camera');
const photoPreview = document.getElementById('photo-preview');
const previewContainer = document.getElementById('preview-container');
const saveBtn = document.getElementById('save-btn');
const retryBtn = document.getElementById('retry-btn');
const instructions = document.getElementById('instructions');

const startRecordBtn = document.getElementById('start-recording');
const stopRecordBtn = document.getElementById('stop-recording');
const recordingIndicator = document.getElementById('recording-indicator');
const recordingCanvas = document.getElementById('recordingCanvas');

const videoPreviewContainer = document.getElementById('video-preview-container');
const videoPreviewEl = document.getElementById('video-preview');
const saveVideoBtn = document.getElementById('save-video-btn');
const videoInstructions = document.getElementById('video-instructions');

const loadingMessage = document.getElementById('loading-message');

let usingFrontCamera = true;
let stream;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordStartTime = 0;
let recordTimerInterval = null;
let recordedMimeType = 'video/webm';
let lastVideoUrl = null;
let frameInterval = null;
let isChangingCamera = false;

const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const API_URL = "https://video-converter-api-production-bb8e.up.railway.app/convert";
const SECURITY_KEY = "EC-MOLDURA-2025-V1";

// Dimensões do modelo Heitor (640px de largura)
const MOLDURA_WIDTH = 640;

// ===== FUNÇÕES AUXILIARES =====
function showLoading() {
  loadingMessage.style.display = 'block';
}

function hideLoading() {
  loadingMessage.style.display = 'none';
}

function setButtonsDisabledDuringProcess(disabled) {
  switchCameraBtn.disabled = disabled;
  captureBtn.disabled = disabled;
  startRecordBtn.disabled = disabled;
  stopRecordBtn.disabled = disabled;
}

function stopAllRecording() {
  isRecording = false;
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  if (frameInterval) {
    cancelAnimationFrame(frameInterval);
    frameInterval = null;
  }
  stopRecordingTimer();
}

// ===== CÂMERA =====
async function startCamera() {
  console.log('Iniciando câmera...');
  
  // Parar gravação se estiver ativa
  if (isRecording) {
    stopAllRecording();
  }

  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  
  const constraints = {
    video: {
      facingMode: usingFrontCamera ? 'user' : 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: true
  };

  try {
    console.log('Solicitando acesso à câmera...');
    
    // Timeout de 10 segundos para evitar travamento
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao acessar câmera')), 10000)
    );
    
    stream = await Promise.race([
      navigator.mediaDevices.getUserMedia(constraints),
      timeoutPromise
    ]);
    
    console.log('✅ Câmera iniciada com sucesso!');
    console.log('Usando câmera:', usingFrontCamera ? 'Frontal' : 'Traseira');
    
    video.srcObject = stream;
    video.style.transform = usingFrontCamera ? 'scaleX(-1)' : 'scaleX(1)';
    overlay.style.transform = 'scaleX(1)';
    video.style.background = 'transparent';
    
    // Esconder mensagem de erro
    document.getElementById('error-message').style.display = 'none';
    isChangingCamera = false;
    
  } catch (err) {
    console.error('❌ Erro ao acessar câmera:', err);
    
    let errorMsg = '';
    
    if (err.name === 'NotAllowedError') {
      errorMsg = '⚠️ PERMISSÃO NEGADA\n\nVocê negou acesso à câmera. Verifique as permissões do navegador e recarregue a página.';
    } else if (err.name === 'NotFoundError') {
      errorMsg = '⚠️ CÂMERA NÃO ENCONTRADA\n\nNenhuma câmera traseira foi detectada. Usando câmera frontal.';
      // Voltar para câmera frontal se traseira não existir
      if (!usingFrontCamera) {
        usingFrontCamera = true;
        console.log('Revertendo para câmera frontal...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await startCamera();
        return;
      }
    } else if (err.name === 'NotReadableError') {
      errorMsg = '⚠️ CÂMERA OCUPADA\n\nOutra aplicação está usando a câmera. Feche outros apps e recarregue.';
    } else if (err.name === 'OverconstrainedError') {
      errorMsg = '⚠️ CÂMERA INDISPONÍVEL\n\nO navegador não conseguiu acessar uma câmera com as configurações. Tentando novamente...';
      // Tentar novamente com restrições menores
      if (!usingFrontCamera) {
        usingFrontCamera = true;
        console.log('Revertendo para câmera frontal...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await startCamera();
        return;
      }
    } else if (err.message === 'Timeout ao acessar câmera') {
      errorMsg = '⚠️ TIMEOUT\n\nA câmera demorou muito para responder. Tentando novamente...';
      if (!usingFrontCamera) {
        usingFrontCamera = true;
        console.log('Timeout na câmera traseira. Voltando para frontal...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await startCamera();
        return;
      }
    } else {
      errorMsg = `⚠️ ERRO NA CÂMERA\n\n${err.message || 'Erro desconhecido ao acessar a câmera.'}`;
    }
    
    showError('Erro ao acessar câmera', errorMsg);
    isChangingCamera = false;
  }
}

switchCameraBtn.onclick = async () => {
  if (isChangingCamera) {
    console.log('Já está trocando de câmera...');
    return;
  }

  if (!stream) {
    showError('Erro', 'Câmera não está ativa. Recarregue a página.');
    return;
  }

  isChangingCamera = true;
  setButtonsDisabledDuringProcess(true);
  showLoading();
  
  usingFrontCamera = !usingFrontCamera;
  console.log('Trocando câmera para:', usingFrontCamera ? 'Frontal' : 'Traseira');
  
  await startCamera();
  
  hideLoading();
  setButtonsDisabledDuringProcess(false);
};

// ===== FOTO =====
captureBtn.onclick = () => {
  if (!stream) {
    showError('Erro', 'Câmera não iniciada. Verifique as permissões e recarregue.');
    return;
  }

  try {
    const track = stream.getVideoTracks()[0];
    if (!track) {
      showError('Erro', 'Nenhuma câmera disponível.');
      return;
    }

    const settings = track.getSettings();
    const width = settings.width;
    const height = settings.height;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (usingFrontCamera) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(overlay, 0, 0, width, height);

    const quality = bandwidthDetector.getPhotoCompression();
    const dataUrl = canvas.toDataURL('image/png');

    photoPreview.src = dataUrl;
    previewContainer.style.display = 'flex';
    console.log('✅ Foto capturada com sucesso!');
  } catch (err) {
    console.error('Erro ao tirar foto:', err);
    showError('Erro', 'Erro ao tirar foto: ' + err.message);
  }
};

saveBtn.onclick = () => {
  const link = document.createElement('a');
  link.download = 'foto-moldura.png';
  link.href = photoPreview.src;
  link.click();

  if (isiOS) {
    instructions.style.display = 'block';
  }
};

retryBtn.onclick = () => {
  previewContainer.style.display = 'none';
  instructions.style.display = 'none';
};

// ===== VÍDEO =====
function startRecordingTimer() {
  recordStartTime = Date.now();
  recordingIndicator.style.display = 'block';
  recordingIndicator.textContent = '🔴 REC 00:00';

  recordTimerInterval = setInterval(() => {
    const elapsedMs = Date.now() - recordStartTime;
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    recordingIndicator.textContent = `🔴 REC ${minutes}:${seconds}`;
  }, 500);
}

function stopRecordingTimer() {
  if (recordTimerInterval) {
    clearInterval(recordTimerInterval);
    recordTimerInterval = null;
  }
  recordingIndicator.style.display = 'none';
}

function startVideoRecording() {
  if (!stream) {
    showError('Erro', 'Câmera não iniciada.');
    return;
  }

  try {
    const track = stream.getVideoTracks()[0];
    if (!track) {
      showError('Erro', 'Nenhuma câmera disponível.');
      return;
    }

    const settings = track.getSettings();
    const camWidth = settings.width || 1920;
    const camHeight = settings.height || 1080;

    // Resolução reduzida (640 de largura) para estabilidade em Android, como modelo Heitor
    const targetWidth = 640;
    const ratio = targetWidth / camWidth;
    const targetHeight = Math.round(camHeight * ratio);

    const width = targetWidth;
    const height = targetHeight;

    console.log('Dimensões do vídeo (modelo Heitor):', width, 'x', height);
    console.log('Dimensões da câmera:', camWidth, 'x', camHeight);

    recordingCanvas.width = width;
    recordingCanvas.height = height;
    
    const rctx = recordingCanvas.getContext('2d', { willReadFrequently: false });

    isRecording = true;
    recordedChunks = [];
    videoPreviewContainer.style.display = 'none';
    videoInstructions.style.display = 'none';

    const fps = 24;
    const frameDelay = 1000 / fps;
    let lastFrameTime = Date.now();

    function drawFrame() {
      const now = Date.now();
      
      if (now - lastFrameTime < frameDelay) {
        frameInterval = requestAnimationFrame(drawFrame);
        return;
      }

      lastFrameTime = now;

      if (!isRecording) {
        frameInterval = null;
        return;
      }

      try {
        // Limpar canvas
        rctx.clearRect(0, 0, width, height);

        // Desenhar vídeo
        if (usingFrontCamera) {
          rctx.save();
          rctx.translate(width, 0);
          rctx.scale(-1, 1);
          rctx.drawImage(video, 0, 0, width, height);
          rctx.restore();
        } else {
          rctx.drawImage(video, 0, 0, width, height);
        }

        // Desenhar moldura
        rctx.drawImage(overlay, 0, 0, width, height);
      } catch (err) {
        console.warn('Erro ao desenhar frame:', err);
      }

      frameInterval = requestAnimationFrame(drawFrame);
    }

    frameInterval = requestAnimationFrame(drawFrame);

    const videoStream = recordingCanvas.captureStream(fps);
    const combinedStream = new MediaStream();

    videoStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      combinedStream.addTrack(audioTracks[0]);
    }

    let options = {};
    recordedMimeType = 'video/webm';

    try {
      if (isiOS) {
        options.mimeType = 'video/mp4';
        recordedMimeType = 'video/mp4';
      } else {
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
            options.mimeType = 'video/webm;codecs=vp9,opus';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
            options.mimeType = 'video/webm;codecs=vp8,opus';
          }
        }
      }

      mediaRecorder = new MediaRecorder(combinedStream, options);
    } catch (e) {
      console.error('Erro ao iniciar MediaRecorder:', e);
      showError('Erro', 'Este navegador não suporta gravação de vídeo com som.');
      isRecording = false;
      stopRecordingTimer();
      if (frameInterval) cancelAnimationFrame(frameInterval);
      frameInterval = null;
      startRecordBtn.style.display = 'inline-block';
      stopRecordBtn.style.display = 'none';
      return;
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      isRecording = false;
      stopRecordingTimer();
      
      if (frameInterval) {
        cancelAnimationFrame(frameInterval);
        frameInterval = null;
      }

      const blob = new Blob(recordedChunks, { type: recordedMimeType });

      if (!blob || blob.size === 0) {
        showError('Erro', 'Nenhum dado de vídeo foi gravado.');
        startRecordBtn.style.display = 'inline-block';
        stopRecordBtn.style.display = 'none';
        recordedChunks = [];
        return;
      }

      showLoading();
      setButtonsDisabledDuringProcess(true);

      try {
        const formData = new FormData();
        formData.append('video', blob, 'video.webm');
        const device = isiOS ? 'ios' : 'android';
        
        // Enviar com dimensões 640px (modelo Heitor)
        const resposta = await fetch(`${API_URL}?device=${device}&key=${SECURITY_KEY}&width=${MOLDURA_WIDTH}`, {
          method: 'POST',
          body: formData
        });

        if (!resposta.ok) {
          console.error('Erro na conversão no servidor');
          showError('Erro', 'Ocorreu um erro ao converter o vídeo. Tente novamente.');
        } else {
          const mp4Blob = await resposta.blob();
          const url = URL.createObjectURL(mp4Blob);
          lastVideoUrl = url;

          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'video-moldura.mp4';
          document.body.appendChild(a);
          a.click();

          setTimeout(() => {
            document.body.removeChild(a);
          }, 1000);

          if (isiOS) {
            videoPreviewContainer.style.display = 'flex';
            videoPreviewEl.style.display = 'none';
            saveVideoBtn.style.display = 'none';
            videoInstructions.style.display = 'block';
          } else {
            videoPreviewContainer.style.display = 'none';
          }

          URL.revokeObjectURL(url);
          console.log('✅ Vídeo salvo com sucesso! (Modelo Heitor - 640px)');
        }
      } catch (err) {
        console.error('Erro ao enviar vídeo:', err);
        showError('Erro', 'Erro ao enviar o vídeo para o servidor: ' + err.message);
      } finally {
        hideLoading();
        setButtonsDisabledDuringProcess(false);
        startRecordBtn.style.display = 'inline-block';
        stopRecordBtn.style.display = 'none';
        recordedChunks = [];
      }
    };

    startRecordingTimer();
    mediaRecorder.start(100);

    startRecordBtn.style.display = 'none';
    stopRecordBtn.style.display = 'inline-block';
    console.log('✅ Gravação iniciada! (Modelo Heitor - 640px)');
  } catch (err) {
    console.error('Erro ao iniciar gravação:', err);
    showError('Erro', 'Erro ao iniciar gravação de vídeo: ' + err.message);
  }
}

startRecordBtn.onclick = () => {
  if (isRecording) return;
  startVideoRecording();
};

stopRecordBtn.onclick = () => {
  stopAllRecording();
  startRecordBtn.style.display = 'inline-block';
  stopRecordBtn.style.display = 'none';
};

saveVideoBtn.onclick = () => {
  if (!lastVideoUrl) return;

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = lastVideoUrl;
  const ext = recordedMimeType.includes('mp4') ? 'mp4' : 'webm';
  a.download = 'video-moldura.' + ext;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
  }, 1000);

  if (isiOS) {
    videoInstructions.style.display = 'block';
  }
};

// Iniciar
console.log('🤖 Robô iniciando...');
console.log('Sistema:', {
  browser: navigator.userAgent,
  iOS: isiOS,
  connection: navigator.connection?.effectiveType
});
console.log('Modelo: Heitor (640px)');
startCamera();
console.log('🤖 Robô iniciado!');