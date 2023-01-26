import { getFriendlyErrorMessage } from './errorMessages';

const videoHolder = document.querySelector<HTMLDivElement>('.video');
const text = document.querySelector<HTMLParagraphElement>('.text');
const startbutton = document.querySelector<HTMLButtonElement>('.start-camera');

function handleError(err: Error) {
  if (!text) throw new Error('shit');
  text.textContent = getFriendlyErrorMessage(err);
}

async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices
    .filter((device) => device.kind === 'videoinput')
    .filter((device) => !device.label.includes('Camo'));
  // camera 2
  return cameras;
}

function createVideoElementFromCamera(camera: MediaDeviceInfo) {
  const markup = `
    <div class="camera">
      <video autoplay playsinline muted></video>
      <p>${camera.label}</p>
    </div>
  `;
  const fragment = document.createRange().createContextualFragment(markup);
  return fragment;
}

async function requestIntialAccess() {
  // Check elements exist
  if (!videoHolder) return;
  // Initialize settings
  const mirrorCheckbox = document.getElementById('mirror') as HTMLInputElement;
  mirrorCheckbox.addEventListener('input', () => {
    localStorage.setItem(
      'settings',
      JSON.stringify({ mirror: mirrorCheckbox.checked })
    );
  });
  const settings = localStorage.getItem('settings');
  if (settings) {
    const { mirror } = JSON.parse(settings);
    mirrorCheckbox.checked = !!mirror;
  }
  // clear out old cameras
  videoHolder.innerHTML = '';
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  console.log('initial stream');
  const cameras = await getCameras();
  // See how many streams we are allowed access to
  const streamPromises = cameras.map((camera) =>
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { deviceId: { exact: camera.deviceId } },
    })
  );
  // wait for access to ALL the streams
  const streams = await Promise.all(streamPromises).catch(console.error);
  console.log({ streams });

  // Create video elements for each
  const videoFragment: DocumentFragment[] = cameras.map(
    createVideoElementFromCamera
  );
  // dump them into the DOM
  videoFragment.forEach((el) => videoHolder.append(el));

  // Assign the src media of each camera to the video elements
  const videoElements = videoHolder.querySelectorAll('video');
  videoElements.forEach((el, i) => {
    el.srcObject = streams[i];
  });
}

type Mode = 'picture-in-picture' | 'inline';
interface SafariHTMLVideoElement extends HTMLVideoElement {
  webkitSupportsPresentationMode: boolean;
  webkitPresentationMode: Mode;
  webkitSetPresentationMode: (mode: Mode) => void;
}

startbutton?.addEventListener('click', requestIntialAccess);
videoHolder?.addEventListener('click', (e: MouseEvent) => {
  if (e.target instanceof HTMLVideoElement) {
    const video = e.target;
    if ('requestPictureInPicture' in e.target) {
      video.requestPictureInPicture();
    }
    // Safari? tHis doesnt work
    if ('webkitSupportsPresentationMode' in video) {
      (video as SafariHTMLVideoElement).webkitSetPresentationMode(
        (video as SafariHTMLVideoElement).webkitPresentationMode ===
          'picture-in-picture'
          ? 'inline'
          : 'picture-in-picture'
      );
    }
  }
});
requestIntialAccess();
