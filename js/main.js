let correct = false;
let riddleKey = null; // global key once solved
let cardSwipeEnabled = true;

// SHA-256 hash (in hex)
const correctAnswerHash = "10f3525281a9d1d581d7a8de31af7f64938691f1f50790aeb5de064f02dbfbb8";

document.addEventListener("DOMContentLoaded", () => {
  const popupModal = document.getElementById("popup-modal");
  const cardWrapper = document.getElementById("card-wrapper");
  const submitBtn = document.getElementById("submit-answer");
  const answerInput = document.getElementById("riddle-answer");
  const feedback = document.getElementById("feedback");
  // Create the first and only instance
  const player = AudioPlayer.getInstance(
    "#bg-music",
    "#next-song-btn",
    "#song-select",
    "Media/Audio/Music/songs.json",
    "Media/Audio/Music",
    ["Mele Kalikimaka.mp3", "Mr Grinch.mp3", "Rudolph.mp3", 
      "It Feels Like Christmas.mp3", "Alvin and the Chipmunks.mp3"],  // these songs will always be last
    ["LIGHTS ON.mp3", "Snowman.mp3"]
    );

  // Hide main card initially
  cardWrapper.style.display = "none";

  let wrongAttempts = 0;

  // Focus input automatically
  answerInput.focus();

  const container = document.getElementById("presents-container");
  if (!container) {
    console.error("Missing container!");
    return;
  }

  submitBtn.addEventListener("click", async () => {
    const userAnswer = answerInput.value.trim().toLowerCase();

    // Hash the user answer and compare to stored hash
    const userAnswerHash = await hashAnswer(userAnswer);

    if (userAnswerHash === correctAnswerHash) {
      riddleKey = await deriveDecryptionKey(userAnswer);

      // Correct - hide popup, show card
      popupModal.style.display = "none";

      cardWrapper.style.display = "flex";

      startFireplace();
      startSnowTimers();
      createPresents();
      correct = true;

      const player = AudioPlayer.getInstance();
      player.audio.volume = 0;
      player.audio.play();
      player.audio.pause();
      player.audio.volume = 1;
    } else {
      // Incorrect
      wrongAttempts++;
      if (wrongAttempts === 1) {
        feedback.textContent = "You can do better than that. Try again for a hint.";
      } else if (wrongAttempts === 2) {
        feedback.textContent = "Hint: Her aroma is always in the air!";
      } else {
        feedback.textContent = "Hint: Her smell in the morning.";
      }
      answerInput.value = "";
      answerInput.focus();
    }
  });

  // Optional: Allow pressing Enter to submit
  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitBtn.click();
    }
  });
});

const card = document.getElementById("card");
const bgMusic = document.getElementById("bg-music");
let cardOpen = false;
let cardOpened = false;

// Card flip on swipe or drag
let startX = 0;

function handleStart(e) {
  startX = e.touches ? e.touches[0].clientX : e.clientX;
}


function handleMove(e) {

  if (!cardSwipeEnabled) return;

  const currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const diffX = currentX - startX;
    if (!correct){
    return;
  }

  if (!cardOpen && diffX < -50) {
    card.classList.add("open");
    cardOpen = true;
    const container = document.getElementById("audio-controls-container");
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-card-inside-bg');
    container.style.background = color;
    delayedStopFireplace();

    if (!cardOpened) {
      cardOpened = true;
      document.getElementById("audio-controls-container").style.display = "block";
      document.getElementById("snowSliderContainer").style.display = "block";
      document.getElementById("snowSlider").value = getSliderValueFromInterval(getSnowInterval());
      AudioPlayer.getInstance().play();
      updateSnowInterval(1);
      document.getElementById("snowSlider").value = getSliderValueFromInterval(getSnowInterval());
    }
  } else if (cardOpen && diffX > 50) {
    card.classList.remove("open");
    cardOpen = false;
    const container = document.getElementById("audio-controls-container");
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-card-face-bg');
    container.style.background = color;
    startFireplace();
  }
}

document.addEventListener("mousedown", handleStart);
document.addEventListener("mousemove", handleMove);
document.addEventListener("touchstart", handleStart);
document.addEventListener("touchmove", handleMove);

const snowSlider = document.getElementById("snowSlider");

// Prevent touch from reaching card logic
snowSlider.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
snowSlider.addEventListener("touchmove", (e) => e.stopPropagation(), { passive: true });
snowSlider.addEventListener("touchend", (e) => e.stopPropagation(), { passive: true });

// Same for mouse (desktop)
snowSlider.addEventListener("mousedown", (e) => e.stopPropagation());
snowSlider.addEventListener("mousemove", (e) => e.stopPropagation());
snowSlider.addEventListener("mouseup", (e) => e.stopPropagation());

document.getElementById("snowSlider").addEventListener("input", function () {
  const sliderValue = parseInt(this.value);
  setSnowInterval(getIntervalFromSliderValue(sliderValue));
  startSnowTimers();
});