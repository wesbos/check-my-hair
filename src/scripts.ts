import { getFriendlyErrorMessage } from './errorMessages';
import {
  createIcons,
  Camera,
  Circle,
  Square,
  PictureInPicture2,
  Maximize,
  RectangleHorizontal,
  X,
  Eye,
} from 'lucide';

const lucideIcons = { Camera, Circle, Square, PictureInPicture2, Maximize, RectangleHorizontal, X, Eye };

const videoHolder = document.querySelector<HTMLDivElement>('.video');
const text = document.querySelector<HTMLParagraphElement>('.text');
const startbutton = document.querySelector<HTMLButtonElement>('.start-camera');
let accessGeneration = 0;

interface CameraSettings {
  label: string;
  ignored: boolean;
}

const REGISTRY_KEY = 'cameraRegistry';
const cameraRegistry: CameraSettings[] = [];

// Load registry from localStorage
const savedRegistry = localStorage.getItem(REGISTRY_KEY);
if (savedRegistry) {
  try {
    const entries = JSON.parse(savedRegistry) as CameraSettings[];
    cameraRegistry.push(...entries);
  } catch { /* corrupted data, start fresh */ }
}

// Migrate old ignoredCameras format
const legacyIgnored = localStorage.getItem('ignoredCameras');
if (legacyIgnored) {
  try {
    const ids = JSON.parse(legacyIgnored) as string[];
    for (const id of ids) {
      if (!cameraRegistry.some((c) => c.label === id)) {
        cameraRegistry.push({ label: id, ignored: true });
      }
    }
  } catch { /* ignore */ }
  localStorage.removeItem('ignoredCameras');
  saveRegistry();
}

function saveRegistry() {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(cameraRegistry));
}

function ignoreCamera(btn: HTMLElement) {
  const id = btn.dataset.id;
  if (!id) return;
  const entry = cameraRegistry.find((c) => c.label === id);
  if (entry) {
    entry.ignored = true;
  } else {
    cameraRegistry.push({ label: id, ignored: true });
  }
  saveRegistry();
  requestIntialAccess();
}

function handleError(err: Error) {
  console.error(err);
  if (!text) throw new Error('shit');
  text.textContent = getFriendlyErrorMessage(err);
}

const virtualCameraPatterns = [
  /virtual/i,
  /\bOBS\b/,
  /ManyCam/i,
  /Snap Camera/i,
  /CamTwist/i,
  /XSplit/i,
  /mmhmm/i,
  /ChromaCam/i,
  /Streamlabs/i,
  /NDI Video/i,
];

function isVirtualCamera(device: MediaDeviceInfo): boolean {
  const label = device.label;
  if (!label) return false;
  return virtualCameraPatterns.some((pattern) => pattern.test(label));
}

async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const seenDeviceIds = new Set<string>();
  const videoDevices = devices
    .filter((device) => device.kind === 'videoinput')
    .filter((device) => {
      if (seenDeviceIds.has(device.deviceId)) return false;
      seenDeviceIds.add(device.deviceId);
      return true;
    });

  let registryChanged = false;
  for (const device of videoDevices) {
    const key = device.label || device.deviceId;
    if (!key || cameraRegistry.some((c) => c.label === key)) continue;
    cameraRegistry.push({ label: key, ignored: isVirtualCamera(device) });
    registryChanged = true;
  }
  if (registryChanged) {
    saveRegistry();

  }

  const registryOrder = cameraRegistry.map((c) => c.label);
  return videoDevices.sort((a, b) => {
    const aKey = a.label || a.deviceId;
    const bKey = b.label || b.deviceId;
    return registryOrder.indexOf(aKey) - registryOrder.indexOf(bKey);
  });
}

function isCameraIgnored(cam: MediaDeviceInfo): boolean {
  const key = cam.label || cam.deviceId;
  return !!cameraRegistry.find((c) => c.label === key)?.ignored;
}

const RESOLUTION_PRESETS = [
  { label: '4K', width: 3840, height: 2160 },
  { label: 'QHD', width: 2560, height: 1440 },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '720p', width: 1280, height: 720 },
  { label: '480p', width: 640, height: 480 },
  { label: '360p', width: 640, height: 360 },
  { label: '240p', width: 320, height: 240 },
];

function populateResolutionPicker(
  select: HTMLSelectElement,
  track: MediaStreamTrack,
  video: HTMLVideoElement
) {
  const caps = 'getCapabilities' in track ? track.getCapabilities() : null;
  const maxW = caps?.width?.max ?? video.videoWidth;
  const maxH = caps?.height?.max ?? video.videoHeight;

  const available = RESOLUTION_PRESETS.filter(
    (p) => p.width <= maxW && p.height <= maxH
  );

  select.innerHTML = available
    .map(
      (p) =>
        `<option value="${p.width}x${p.height}">${p.label} (${p.width}×${p.height})</option>`
    )
    .join('');

  syncResolutionPicker(select, video);
}

function syncResolutionPicker(select: HTMLSelectElement, video: HTMLVideoElement) {
  const w = video.videoWidth;
  const h = video.videoHeight;
  const exact = RESOLUTION_PRESETS.find((p) => p.width === w && p.height === h);
  if (exact) {
    select.value = `${exact.width}x${exact.height}`;
    return;
  }
  const customId = 'custom';
  let customOpt = select.querySelector<HTMLOptionElement>(`option[value="${customId}"]`);
  if (!customOpt) {
    customOpt = document.createElement('option');
    customOpt.value = customId;
    select.prepend(customOpt);
  }
  customOpt.textContent = `${w}×${h}`;
  select.value = customId;
}

function getCameraMetaTags(track: MediaStreamTrack): string[] {
  const tags: string[] = [];
  const settings = track.getSettings();

  if (settings.facingMode === 'user') tags.push('Front');
  else if (settings.facingMode === 'environment') tags.push('Back');

  if (!('getCapabilities' in track)) return tags;

  const caps = track.getCapabilities();

  if (caps.width?.max && caps.height?.max) {
    const w = caps.width.max;
    const h = caps.height.max;
    if (w >= 3840) tags.push('4K');
    else if (w >= 2560) tags.push('QHD');
    else if (w >= 1920) tags.push('FHD');
    else if (w >= 1280) tags.push('HD');
    tags.push(`${w}×${h} max`);
  }

  if (caps.frameRate?.max) {
    tags.push(`${Math.round(caps.frameRate.max)}fps max`);
  } else if (settings.frameRate) {
    tags.push(`${Math.round(settings.frameRate)}fps`);
  }

  if (caps.facingMode && caps.facingMode.length > 1) {
    tags.push('Switchable');
  }

  const ext = caps as Record<string, unknown>;
  if (ext.zoom) tags.push('Zoom');
  if (ext.torch === true) tags.push('Torch');
  if (Array.isArray(ext.focusMode) && ext.focusMode.includes('continuous')) {
    tags.push('Auto Focus');
  }
  if (Array.isArray(ext.exposureMode) && ext.exposureMode.includes('continuous')) {
    tags.push('Auto Exposure');
  }
  if (Array.isArray(ext.whiteBalanceMode) && ext.whiteBalanceMode.includes('continuous')) {
    tags.push('Auto WB');
  }

  return tags;
}

function createIgnoredCameraCard(label: string, index: number) {
  const markup = /* html */ `
    <div class="camera camera-ignored" draggable="true" data-camera-label="${label}" style="view-transition-name: camera-${index}">
      <div class="ignored-placeholder"></div>
      <div class="controls">
        <p class="camera-label">${label}</p>
        <div class="actions">
          <button class="btn-unignore" data-id="${label}" title="Show camera"><i data-lucide="eye"></i></button>
        </div>
      </div>
    </div>
  `;
  return document.createRange().createContextualFragment(markup);
}

function createVideoElementFromCamera(camera: MediaDeviceInfo, index: number) {
  const cameraKey = camera.label || camera.deviceId;
  const markup = /* html */ `
    <div class="camera" draggable="true" data-camera-label="${cameraKey}" style="view-transition-name: camera-${index}">
      <div class="video-area">
        <video autoplay playsinline muted controls></video>
        <div class="audio-meter" aria-hidden="true">
          <div class="audio-meter-fill"></div>
        </div>
      </div>
      <div class="controls">
        <p class="camera-label">${camera.label}</p>
        <select class="resolution-picker"><option>—</option></select>
        <div class="actions">
          <button class="btn-photo" title="Take photo"><i data-lucide="camera"></i></button>
          <button class="btn-record" title="Record video"><i data-lucide="circle"></i><i data-lucide="square"></i></button>
          <button class="btn-pip" title="Picture in Picture"><i data-lucide="picture-in-picture-2"></i></button>
          <button class="btn-fullscreen" title="Fullscreen"><i data-lucide="maximize"></i></button>
          <button class="btn-widescreen" title="Widescreen"><i data-lucide="rectangle-horizontal"></i></button>
          <button class="ignore" data-id="${cameraKey}" title="Ignore camera"><i data-lucide="x"></i></button>
        </div>
      </div>
      <div class="camera-meta"></div>
    </div>
  `;
  return document.createRange().createContextualFragment(markup);
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
}

function setupAudioMeter(card: HTMLElement, stream: MediaStream) {
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) return;

  const fillEl = card.querySelector<HTMLElement>('.audio-meter-fill');
  const meter = card.querySelector<HTMLElement>('.audio-meter');
  if (!fillEl || !meter) return;
  const fill = fillEl;
  meter.classList.add('active');

  const audioCtx = getAudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.fftSize);
  let smoothed = 0;

  function updateMeter() {
    if (!card.isConnected) return;
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const target = Math.min(100, rms * 300);
    smoothed = target > smoothed ? target : smoothed * 0.92;
    fill.style.height = `${smoothed}%`;
    requestAnimationFrame(updateMeter);
  }

  updateMeter();
}

async function requestIntialAccess() {
  const generation = ++accessGeneration;
  if (!videoHolder) return;
  videoHolder.innerHTML = '';

  try {
    await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  } catch (err) {
    handleError(err as Error);
    return;
  }
  if (generation !== accessGeneration) return;

  let allCameras: MediaDeviceInfo[];
  try {
    allCameras = await getCameras();
  } catch (err) {
    handleError(err as Error);
    return;
  }
  if (generation !== accessGeneration) return;

  const activeCameras = allCameras.filter((c) => !isCameraIgnored(c));

  const allDevices = await navigator.mediaDevices.enumerateDevices();

  const streamResults = await Promise.allSettled(
    activeCameras.map((camera) => {
      const matchingMic = allDevices.find(
        (d) =>
          d.kind === 'audioinput' &&
          d.groupId === camera.groupId &&
          camera.groupId !== ''
      );
      return navigator.mediaDevices.getUserMedia({
        audio: matchingMic
          ? { deviceId: { exact: matchingMic.deviceId } }
          : false,
        video: { deviceId: { exact: camera.deviceId } },
      });
    })
  );
  if (generation !== accessGeneration) return;

  videoHolder.innerHTML = '';
  let activeIdx = 0;

  allCameras.forEach((camera, gridIdx) => {
    const key = camera.label || camera.deviceId;
    const ignored = isCameraIgnored(camera);

    if (ignored) {
      videoHolder.append(createIgnoredCameraCard(key, gridIdx));
      return;
    }

    videoHolder.append(createVideoElementFromCamera(camera, gridIdx));
    const card = videoHolder.lastElementChild as HTMLElement;
    const video = card?.querySelector('video');
    const result = streamResults[activeIdx++];

    if (result?.status === 'fulfilled' && video) {
      const stream = result.value;
      video.srcObject = stream;
      setupAudioMeter(card, stream);
      video.addEventListener('loadedmetadata', () => {
        const track = stream.getVideoTracks()[0];
        const select = card?.querySelector<HTMLSelectElement>('.resolution-picker');
        if (track && select) {
          populateResolutionPicker(select, track, video);
        }
        if (track) {
          const metaEl = card?.querySelector('.camera-meta');
          if (metaEl) {
            metaEl.innerHTML = getCameraMetaTags(track)
              .map((t) => `<span class="meta-tag">${t}</span>`)
              .join('');
          }
        }
      });
      video.addEventListener('resize', () => {
        const select = card?.querySelector<HTMLSelectElement>('.resolution-picker');
        if (select) syncResolutionPicker(select, video);
      });
    } else if (result?.status === 'rejected') {
      if (!card) return;
      card.classList.add('camera-error');
      const errorEl = document.createElement('p');
      errorEl.className = 'camera-error-message';
      errorEl.textContent = getFriendlyErrorMessage(result.reason);
      card.querySelector('video')?.replaceWith(errorEl);
    }
  });

  createIcons({ icons: lucideIcons });
}

function takePhoto(card: HTMLElement) {
  const video = card.querySelector('video');
  if (!video) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const label = card.dataset.cameraLabel || 'camera';
    a.download = `${label}-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

const activeRecorders = new Map<HTMLElement, MediaRecorder>();

function toggleRecording(card: HTMLElement) {
  const existing = activeRecorders.get(card);
  if (existing && existing.state === 'recording') {
    existing.stop();
    return;
  }

  const video = card.querySelector('video');
  if (!video) return;
  const stream = video.srcObject as MediaStream | null;
  if (!stream) return;

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    activeRecorders.delete(card);
    card.classList.remove('recording');

    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const label = card.dataset.cameraLabel || 'camera';
    a.download = `${label}-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  activeRecorders.set(card, recorder);
  card.classList.add('recording');
  recorder.start();
}

function toggleWidescreen(card: HTMLElement) {
  if (!videoHolder) return;
  const isWide = card.classList.contains('widescreen');
  videoHolder
    .querySelectorAll('.widescreen')
    .forEach((el) => el.classList.remove('widescreen'));
  if (isWide) return;

  const doIt = () => {
    card.classList.add('widescreen');
    videoHolder.prepend(card);
    const label = card.dataset.cameraLabel;
    if (label) {
      const idx = cameraRegistry.findIndex((c) => c.label === label);
      if (idx > 0) {
        const [entry] = cameraRegistry.splice(idx, 1);
        cameraRegistry.unshift(entry);
        saveRegistry();
      }
    }
  };

  if ('startViewTransition' in document) {
    document.startViewTransition(doIt);
  } else {
    doIt();
  }
}

startbutton?.addEventListener('click', requestIntialAccess);

videoHolder?.addEventListener('click', (e: MouseEvent) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!btn) return;
  const card = btn.closest<HTMLElement>('.camera');
  if (!card) return;
  const video = card.querySelector('video');

  if (btn.classList.contains('btn-photo')) {
    takePhoto(card);
  } else if (btn.classList.contains('btn-record')) {
    toggleRecording(card);
  } else if (btn.classList.contains('btn-pip') && video) {
    video.requestPictureInPicture();
  } else if (btn.classList.contains('btn-fullscreen')) {
    if (document.fullscreenElement === card) {
      document.exitFullscreen();
    } else {
      card.requestFullscreen();
    }
  } else if (btn.classList.contains('btn-widescreen')) {
    toggleWidescreen(card);
  } else if (btn.classList.contains('ignore')) {
    ignoreCamera(btn);
  } else if (btn.classList.contains('btn-unignore')) {
    const id = btn.dataset.id;
    if (!id) return;
    const entry = cameraRegistry.find((c) => c.label === id);
    if (entry) {
      entry.ignored = false;
      saveRegistry();

      requestIntialAccess();
    }
  }
});

videoHolder?.addEventListener('change', async (e: Event) => {
  const select = e.target as HTMLSelectElement;
  if (!select.classList.contains('resolution-picker')) return;
  if (select.value === 'custom') return;
  const card = select.closest<HTMLElement>('.camera');
  const video = card?.querySelector('video');
  if (!video) return;
  const stream = video.srcObject as MediaStream | null;
  const track = stream?.getVideoTracks()[0];
  if (!track) return;

  const [width, height] = select.value.split('x').map(Number);
  try {
    await track.applyConstraints({ width: { ideal: width }, height: { ideal: height } });
  } catch (err) {
    console.error('Failed to change resolution:', err);
  }
});

// Drag & Drop camera swapping with View Transitions
let draggedCamera: HTMLElement | null = null;

function swapElements(a: HTMLElement, b: HTMLElement) {
  if (!a.parentNode || !b.parentNode) return;
  const placeholder = document.createComment('swap');
  a.parentNode.insertBefore(placeholder, a);
  b.parentNode.insertBefore(a, b);
  placeholder.parentNode!.insertBefore(b, placeholder);
  placeholder.remove();
}

videoHolder?.addEventListener('dragstart', (e: DragEvent) => {
  const camera = (e.target as HTMLElement).closest<HTMLElement>('.camera');
  if (!camera) return;
  draggedCamera = camera;
  camera.classList.add('dragging');
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
  }
});

videoHolder?.addEventListener('dragend', () => {
  if (draggedCamera) draggedCamera.classList.remove('dragging');
  videoHolder.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
  draggedCamera = null;
});

videoHolder?.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  const camera = (e.target as HTMLElement).closest<HTMLElement>('.camera');
  if (camera && camera !== draggedCamera) {
    videoHolder.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    camera.classList.add('drag-over');
  }
});

videoHolder?.addEventListener('dragleave', (e: DragEvent) => {
  const camera = (e.target as HTMLElement).closest<HTMLElement>('.camera');
  if (camera) camera.classList.remove('drag-over');
});

videoHolder?.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  const dropTarget = (e.target as HTMLElement).closest<HTMLElement>('.camera');
  if (!dropTarget || !draggedCamera || dropTarget === draggedCamera) return;
  dropTarget.classList.remove('drag-over');
  const dragged = draggedCamera;

  const labelA = dragged.dataset.cameraLabel;
  const labelB = dropTarget.dataset.cameraLabel;
  if (labelA && labelB) {
    const idxA = cameraRegistry.findIndex((c) => c.label === labelA);
    const idxB = cameraRegistry.findIndex((c) => c.label === labelB);
    if (idxA !== -1 && idxB !== -1) {
      [cameraRegistry[idxA], cameraRegistry[idxB]] = [cameraRegistry[idxB], cameraRegistry[idxA]];
      saveRegistry();
    }
  }

  if ('startViewTransition' in document) {
    document.startViewTransition(() => swapElements(dragged, dropTarget));
  } else {
    swapElements(dragged, dropTarget);
  }
});

requestIntialAccess();
