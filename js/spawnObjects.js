let snowInterval = 300; // default 0.4s in ms
let timerA;
const snowflakes = [];
const maxSnowflakes = 100; // cap for performance

function setSnowInterval(interval){
  snowInterval = interval;
}

function getSnowInterval(){
  return snowInterval;
}

// Start/Restart based on current settings
function startSnowTimers() {
  clearInterval(timerA);

  if (!isFinite(snowInterval)) return; // Don't spawn anything if interval is Infinity

  timerA = setInterval(spawnSnow, snowInterval);
}

function updateSnowInterval(newSeconds) {
  snowInterval = newSeconds * 1000;
  startSnowTimers(); // reapply with new timing
}

function getSliderValueFromInterval(interval) {
  const minLog = Math.log(100);
  const maxLog = Math.log(10000);
  const logInterval = Math.log(interval);
  const scale = (logInterval - minLog) / (maxLog - minLog);
  return 100 - Math.round(scale * 100); // reverse
}

function getIntervalFromSliderValue(value) {
  if (value === 0) return Infinity;

  const minInterval = 100;    // fastest
  const maxInterval = 10000;  // slowest
  const minLog = Math.log(minInterval);
  const maxLog = Math.log(maxInterval);

  const scale = (100 - value) / 100; // reverse slider
  const logInterval = minLog + scale * (maxLog - minLog);

  return Math.exp(logInterval);
}

function spawnSnow() {
  spawnFallingEmoji(["❄️"]);
}

function spawnFallingEmoji(
  emojiArray,
  {
    minFontSize = 10,
    maxFontSize = 35,
    minFallSpeed = 0.5,
    maxFallSpeed = 1.5,
    minSway = -4,
    maxSway = 4,
    opacity = 0.85,
    zIndex = 5
  } = {}
) {
  if (snowflakes.length >= maxSnowflakes) return; // cap snowflakes

  const emoji = document.createElement("div");
  emoji.textContent = emojiArray[Math.floor(Math.random() * emojiArray.length)];
  emoji.style.position = "fixed";
  emoji.style.top = "0";
  emoji.style.left = "0";
  emoji.style.fontSize = `${Math.random() * (maxFontSize - minFontSize) + minFontSize}px`;
  emoji.style.opacity = opacity;
  emoji.style.pointerEvents = 'none';
  emoji.style.zIndex = zIndex;
  emoji.style.transform = `translate3d(${Math.random() * window.innerWidth}px, -50px, 0)`;

  const fallSpeed = Math.random() * (maxFallSpeed - minFallSpeed) + minFallSpeed;
  const swayAmount = Math.random() * (maxSway - minSway) + minSway;
  const startX = parseFloat(emoji.style.transform.split(',')[0].replace('translate3d(', ''));

  snowflakes.push({ emoji, y: -50, x: startX, fallSpeed, swayAmount });
  document.body.appendChild(emoji);

  // Start the animation loop if not already running
  if (!animateSnow.started) {
    requestAnimationFrame(animateSnow);
    animateSnow.started = true;
  }
}

function animateSnow() {
  for (let i = snowflakes.length - 1; i >= 0; i--) {
    const flake = snowflakes[i];
    flake.y += flake.fallSpeed;
    const sway = Math.sin(flake.y / 20) * flake.swayAmount * 5;
    flake.emoji.style.transform = `translate3d(${flake.x + sway}px, ${flake.y}px, 0)`;

    if (flake.y > window.innerHeight + 50) {
      flake.emoji.remove();
      snowflakes.splice(i, 1);
    }
  }

  requestAnimationFrame(animateSnow);
}