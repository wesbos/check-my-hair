import { getFriendlyErrorMessage } from './errorMessages';

const video1: HTMLVideoElement = document.querySelector('video.video1');
const video2: HTMLVideoElement = document.querySelector('video.video2');
const videoHolder: HTMLDivElement = document.querySelector('.video');
const text: HTMLParagraphElement = document.querySelector('.text');
const startbutton: HTMLButtonElement = document.querySelector('.start-camera');

function handleError(err: MediaStreamError) {
  text.textContent = getFriendlyErrorMessage(err);
}

async function getWebCam() {
  const stream = await navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {
        width: {
          ideal: 3840,
        },
        height: {
          ideal: 2160,
        },
      },
    })
    .catch(handleError);
  console.log('returning stream');
  await getDevices();
  return stream;
}

async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter((device) => device.kind === 'videoinput');
  // .filter((device) => !device.label.includes('Camo'));
  // camera 2
  return cameras;
}

function createVideoElementFromCamera(camera: MediaDeviceInfo) {
  const markup = `
    <div class="camera">
      <video autoplay></video>
      <p>${camera.label}</p>
    </div>
  `;
  const fragment = document.createRange().createContextualFragment(markup);
  return fragment;
}

async function requestIntialAccess() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  console.log('initial stream');
  const cameras = await getCameras();
  console.table(cameras);
  // See how many streams we are allowed access to
  const streamPromises = cameras.map(function (camera) {
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { deviceId: { exact: camera.deviceId } },
    });
  });
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

async function go(): Promise<void> {
  const stream = await getWebCam();
  if (video1 && stream) video1.srcObject = stream;
}

startbutton.addEventListener('click', requestIntialAccess);
