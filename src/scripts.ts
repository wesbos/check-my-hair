import { getFriendlyErrorMessage } from "./errorMessages";

const videoHolder: HTMLDivElement = document.querySelector(".video");
const text: HTMLParagraphElement = document.querySelector(".text");
const startbutton: HTMLButtonElement = document.querySelector(".start-camera");
let requesting = false;
function handleError(err: MediaStreamError) {
  text.textContent = getFriendlyErrorMessage(err);
}

async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices
    .filter((device) => device.kind === "videoinput")
    .filter((device) => !device.label.includes("Camo"));
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
  // prevent spamming start camera, wait for request to finish
  if (requesting) return;
  // clear out old cameras
  requesting = true;
  videoHolder.innerHTML = "";

  const cameras = await getCameras();

  // See how many streams we are allowed access to
  const streamPromises = cameras.map(function (camera) {
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { deviceId: { exact: camera.deviceId } },
    });
  });

  // Still show cameras even if one isn't working.
  const streams: PromiseSettledResult<MediaStream>[] = await Promise.allSettled(
    streamPromises
  );
  const workingStreams: MediaStream[] = streams.reduce((acc, current) => {
    if (current.status === "fulfilled") {
      acc = [...acc, current.value];
    }
    return acc;
  }, []);

  // Create video elements for each
  const videoFragment: DocumentFragment[] = cameras.map(
    createVideoElementFromCamera
  );
  // dump them into the DOM
  videoFragment.forEach((el) => videoHolder.append(el));

  // Assign the src media of each camera to the video elements
  const videoElements = videoHolder.querySelectorAll("video");
  videoElements.forEach((el, i) => {
    if (workingStreams) {
      el.srcObject = workingStreams[i];
    }
  });
  requesting = false;
}

startbutton.addEventListener("click", requestIntialAccess);

requestIntialAccess();
