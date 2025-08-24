function startFireplace() {
  const crackle = document.getElementById("fireplaceAudio");
  const video = document.querySelector(".fireplace-video");

  if (video) {
    video.currentTime = 0;
    video.play().catch(err => console.warn("Video play blocked", err));
  }

  if (crackle) {
    crackle.currentTime = 0;
    crackle.loop = true;
    crackle.play().catch(err => console.warn("Crackle play blocked", err));
  }
}

function stopFireplace() {
  const crackle = document.getElementById("fireplaceAudio");
  const video = document.querySelector(".fireplace-video");

  if (crackle) {
    crackle.pause();
    crackle.currentTime = 0;
  }
  if (video) {
    video.pause();
    video.currentTime = 0;
  }
}

function delayedStopFireplace(delay = 500) {
  setTimeout(() => {
    stopFireplace();
  }, delay);
}