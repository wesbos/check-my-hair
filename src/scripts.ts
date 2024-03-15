import { getFriendlyErrorMessage } from './errorMessages';
import { setHandler } from './handlers';

const videoHolder = document.querySelector<HTMLDivElement>('.video');
const text = document.querySelector<HTMLParagraphElement>('.text');
const startbutton = document.querySelector<HTMLButtonElement>('.start-camera');
const existingIgnore = localStorage.getItem('ignoredCameras');
const ignoreList =
  document.querySelector<HTMLUListElement>('.ignoredCameras ul');
const ignoredCameras = new Proxy<Set<string>>(
  new Set<string>(),
  setHandler(() => {
    renderIgnoreList();
    requestIntialAccess();
  })
);

function renderIgnoreList() {
  if (!ignoreList) return;
  const html = Array.from(ignoredCameras)
    .map((id) => `<li>${id} <button data-remove-ignore="${id}">×</button></li>`)
    .join('');
  ignoreList.innerHTML = html;
}

if (existingIgnore) {
  const cameraIds = JSON.parse(existingIgnore) as string[];
  if (Array.isArray(cameraIds)) {
    console.log('Restoring ignored cameras', cameraIds);
    cameraIds.forEach((id: string) => ignoredCameras.add(id));
  }
}

function ignoreCamera(e: Event) {
  const { id } = (e.target as HTMLButtonElement).dataset;
  if (!id) return;
  ignoredCameras.add(id);
  // mirror to local storage
  localStorage.setItem('ignoredCameras', JSON.stringify([...ignoredCameras]));
  console.log('ignored', ignoredCameras);
}

function handleError(err: Error) {
  if (!text) throw new Error('shit');
  text.textContent = getFriendlyErrorMessage(err);
}

async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices
    .filter((device) => device.kind === 'videoinput')
    .filter((device) => !ignoredCameras.has(device.deviceId))
    .filter((device) => !ignoredCameras.has(device.label));
  return cameras;
}

function createVideoElementFromCamera(camera: MediaDeviceInfo) {
  const markup = /* html */ `
    <div class="camera">
      <video autoplay playsinline muted controls></video>
      <div class="controls">
        <p>${camera.label}</p>
        <button class="ignore" data-id="${
          camera.label || camera.deviceId
        }">× Ignore</button>
      </div>
    </div>
  `;
  const fragment = document.createRange().createContextualFragment(markup);
  fragment
    .querySelector('button.ignore')
    ?.addEventListener('click', ignoreCamera);
  return fragment;
}

async function requestIntialAccess() {
  // Check elements exist
  if (!videoHolder) return;
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

ignoreList?.addEventListener('click', (e: MouseEvent) => {
  if (!(e.target instanceof HTMLButtonElement)) return;
  const { removeIgnore } = e.target.dataset;
  if (!removeIgnore) return;
  ignoredCameras.delete(removeIgnore);
});

requestIntialAccess();
