import { getFriendlyErrorMessage } from './errorMessages';

const video = document.querySelector('video');
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
  return stream;
}

async function go(): Promise<void> {
  const stream = await getWebCam();
  if (video && stream) video.srcObject = stream;
}

startbutton.addEventListener('click', go);
