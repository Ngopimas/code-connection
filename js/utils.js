// Toggle a debug button and info on screen
export const DEBUG_MODE = false;

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

// A sinus function that accepts degrees instead of radians
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game status constants for the game phase
export const gameStatus = {
  waiting: "waiting",
  coding: "coding", // was stretching
  deploying: "deploying", // was turning
  running: "running", // was walking
  migrating: "migrating", // was transitioning
  crashing: "crashing", // was falling
};

// Configuration
export const config = {
  canvasWidth: 375,
  canvasHeight: 375,
  platformHeight: 100,
  heroDistanceFromEdge: 10, // While waiting
  paddingX: 100, // The waiting position of the hero in from the original canvas size
  perfectAreaSize: 10,

  // Cleanup configuration
  keepPastPlatforms: 6, // Number of past platforms to keep (besides the current one)
  keepPastSticks: 5, // Number of past sticks to keep (besides the current one)

  // The background moves slower than the hero
  backgroundSpeedMultiplier: 0.2,

  hill1BaseHeight: 100,
  hill1Amplitude: 10,
  hill1Stretch: 1,
  hill2BaseHeight: 70,
  hill2Amplitude: 20,
  hill2Stretch: 0.5,

  codingSpeed: 4, // Milliseconds it takes to draw a pixel (was stretchingSpeed)
  deployingSpeed: 4, // Milliseconds it takes to turn a degree (was turningSpeed)
  runningSpeed: 4, // was walkingSpeed
  migratingSpeed: 2, // was transitioningSpeed
  crashingSpeed: 2, // was fallingSpeed
};

// Helper function to get hill Y position
export function getHillY(
  windowX,
  baseHeight,
  amplitude,
  stretch,
  sceneOffset,
  backgroundSpeedMultiplier
) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
      amplitude +
    sineBaseY
  );
}

// Helper function to get server Y position
export function getServerY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}

// Function to show notification
export function showNotification(message, bgColor) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.position = "absolute";
  notification.style.top = "50px";
  notification.style.left = "50%";
  notification.style.transform = "translateX(-50%)";
  notification.style.backgroundColor = bgColor || "#68D391";
  notification.style.color = "#1A202C";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "4px";
  notification.style.fontFamily =
    '"JetBrains Mono", "Fira Code", Consolas, monospace';
  notification.style.zIndex = "1000";
  notification.style.opacity = "0";
  notification.style.transition = "opacity 0.3s ease";

  document.body.appendChild(notification);

  // Fade in
  setTimeout(() => {
    notification.style.opacity = "1";
  }, 10);

  // Remove after 2 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 2000);
}
