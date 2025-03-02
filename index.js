/**
 * From Hunor Marton Borbely:
 * https://codepen.io/HunorMarton/pen/xxOMQKg
 * If you want to know how this game was originally made, check out his video:
 * https://youtu.be/eue3UdFvwPo
 */

// Toggle a debug button and info on screen
const DEBUG_MODE = false;

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

// A sinus function that acceps degrees instead of radians
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game status constants for the game phase
const gameStatus = {
  waiting: "waiting",
  coding: "coding", // was stretching
  deploying: "deploying", // was turning
  running: "running", // was walking
  migrating: "migrating", // was transitioning
  crashing: "crashing", // was falling
};

// Game data
let phase = gameStatus.waiting; // waiting | coding | deploying | running | migrating | crashing
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];
let servers = [];
let bonusGemRotation = 0; // Track rotation angle for bonus gem animation
let missedGems = []; // Track gems that were missed
let collectedGems = []; // Track gems that were collected

// Pre-generated background elements to prevent flickering
let binaryPattern = [];
let hillNodes = [];
let circuitLines = [];

let record = +localStorage.getItem("record") || 0;
let score = 0;

// Game bonuses tracking
let consecutivePerfect = 0;
let debugMode = false; // Initially false, can only be toggled if DEBUG_MODE is true

// Configuration
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10; // While waiting
const paddingX = 100; // The waiting position of the hero in from the original canvas size
const perfectAreaSize = 10;

// The background moves slower than the hero
const backgroundSpeedMultiplier = 0.2;

const hill1BaseHeight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;

const codingSpeed = 4; // Milliseconds it takes to draw a pixel (was stretchingSpeed)
const deployingSpeed = 4; // Milliseconds it takes to turn a degree (was turningSpeed)
const runningSpeed = 4; // was walkingSpeed
const migratingSpeed = 2; // was transitioningSpeed
const crashingSpeed = 2; // was fallingSpeed

// Constants for hero dimensions - using the shared reference
// const heroWidth = CharacterReference.heroWidth;
// const heroHeight = CharacterReference.heroHeight;
// Using CharacterReference.heroWidth and CharacterReference.heroHeight directly instead

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;

// Prevent all default touch behaviors on the canvas
canvas.addEventListener("touchstart", function (e) {
  e.preventDefault();
});
canvas.addEventListener("touchmove", function (e) {
  e.preventDefault();
});
canvas.addEventListener("touchend", function (e) {
  e.preventDefault();
});
canvas.addEventListener("touchcancel", function (e) {
  e.preventDefault();
});

const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const recordeElement = document.getElementById("record");
const bestElement = document.getElementById("best-score");
const scoreElement = document.getElementById("score");

// Initialize layout
resetGame();

// Debug mode button creation
if (DEBUG_MODE) {
  const debugButton = document.createElement("button");
  debugButton.id = "debug-mode";
  debugButton.textContent = "Enable Debug Mode";
  debugButton.style.position = "absolute";
  debugButton.style.top = "90px";
  debugButton.style.left = "30px";
  debugButton.style.padding = "8px 12px";
  debugButton.style.backgroundColor = "#4A5568";
  debugButton.style.color = "#E2E8F0";
  debugButton.style.border = "none";
  debugButton.style.borderRadius = "4px";
  debugButton.style.fontFamily =
    '"JetBrains Mono", "Fira Code", Consolas, monospace';
  debugButton.style.fontSize = "14px";
  debugButton.style.cursor = "pointer";
  debugButton.style.transition = "all 0.3s ease";
  document.querySelector(".container").appendChild(debugButton);

  // Prevent mousedown from triggering play
  debugButton.addEventListener("mousedown", function (e) {
    e.stopPropagation();
  });

  // Prevent touchstart from triggering play
  debugButton.addEventListener("touchstart", function (e) {
    e.stopPropagation();
    e.preventDefault();
  });

  // Handle touchend on debug button
  debugButton.addEventListener("touchend", function (e) {
    e.stopPropagation();
    e.preventDefault();
    // Manually toggle debug mode on touchend
    debugMode = !debugMode;

    if (debugMode) {
      debugButton.textContent = "Disable Debug Mode";
      debugButton.style.backgroundColor = "#68D391"; // Green when active

      // Show debug info on screen
      const debugInfo = document.createElement("div");
      debugInfo.id = "debug-info";
      debugInfo.style.position = "absolute";
      debugInfo.style.bottom = "10px";
      debugInfo.style.right = "10px";
      debugInfo.style.backgroundColor = "rgba(26, 32, 44, 0.8)";
      debugInfo.style.padding = "10px";
      debugInfo.style.borderRadius = "4px";
      debugInfo.style.fontFamily =
        '"JetBrains Mono", "Fira Code", Consolas, monospace';
      debugInfo.style.fontSize = "12px";
      debugInfo.style.color = "#E2E8F0";
      debugInfo.style.maxWidth = "200px";
      debugInfo.style.zIndex = "1000";
      debugInfo.style.borderLeft = "3px solid #68D391";
      document.querySelector(".container").appendChild(debugInfo);

      updateDebugInfo();
    } else {
      debugButton.textContent = "Enable Debug Mode";
      debugButton.style.backgroundColor = "#4A5568"; // Grey when inactive

      // Remove debug info
      const debugInfo = document.getElementById("debug-info");
      if (debugInfo) {
        debugInfo.remove();
      }
    }
  });

  // Toggle debug mode
  debugButton.addEventListener("click", function (e) {
    e.stopPropagation();
    e.preventDefault();
    debugMode = !debugMode;

    if (debugMode) {
      debugButton.textContent = "Disable Debug Mode";
      debugButton.style.backgroundColor = "#68D391"; // Green when active

      // Show debug info on screen
      const debugInfo = document.createElement("div");
      debugInfo.id = "debug-info";
      debugInfo.style.position = "absolute";
      debugInfo.style.bottom = "10px";
      debugInfo.style.right = "10px";
      debugInfo.style.backgroundColor = "rgba(26, 32, 44, 0.8)";
      debugInfo.style.padding = "10px";
      debugInfo.style.borderRadius = "4px";
      debugInfo.style.fontFamily =
        '"JetBrains Mono", "Fira Code", Consolas, monospace';
      debugInfo.style.fontSize = "12px";
      debugInfo.style.color = "#E2E8F0";
      debugInfo.style.maxWidth = "200px";
      debugInfo.style.zIndex = "1000";
      debugInfo.style.borderLeft = "3px solid #68D391";
      document.querySelector(".container").appendChild(debugInfo);

      updateDebugInfo();
    } else {
      debugButton.textContent = "Enable Debug Mode";
      debugButton.style.backgroundColor = "#4A5568"; // Grey when inactive

      // Remove debug info
      const debugInfo = document.getElementById("debug-info");
      if (debugInfo) {
        debugInfo.remove();
      }
    }
  });
}

// Function to update debug info
function updateDebugInfo() {
  if (DEBUG_MODE && debugMode) {
    const debugInfo = document.getElementById("debug-info");
    if (debugInfo) {
      const nextPlatform = platforms.find(
        (platform) => platform.x > sticks.last().x
      );

      const distanceToNext = nextPlatform
        ? (nextPlatform.x - sticks.last().x).toFixed(1)
        : "N/A";

      const perfectHitDistance = nextPlatform
        ? (nextPlatform.x + nextPlatform.w / 2).toFixed(1)
        : "N/A";

      debugInfo.innerHTML = `
        <div>Game Phase: ${phase}</div>
        <div>Stick Length: ${sticks.last().length.toFixed(1)}</div>
        <div>Distance to Next: ${distanceToNext}</div>
        <div>Perfect Hit at: ${perfectHitDistance}</div>
      `;

      requestAnimationFrame(updateDebugInfo);
    }
  }
}

// Resets game variables and layouts but does not start the game (game starts on keypress)
function resetGame() {
  // Reset game progress
  phase = gameStatus.waiting;
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;
  consecutivePerfect = 0;

  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  recordeElement.innerText = record;
  scoreElement.innerText = score;

  // The first platform is always the same
  // x + w has to match paddingX
  platforms = [{ x: 50, w: 50 }];
  Array.from({ length: 6 }, () => generatePlatform());

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  servers = [];
  // Calculate number of servers based on screen width to fill more of the desktop
  const screenWidthFactor = Math.ceil(window.innerWidth / canvasWidth);
  // Reduce the number of servers - use a smaller multiplier and lower minimum
  const numberOfServers = Math.max(10, screenWidthFactor * 8); // Reduced from 20 and 15

  // Generate servers with a wider distribution
  // First, calculate the total width we want to cover
  const totalWidth = window.innerWidth * 1.5; // Cover 1.5x the screen width
  const averageGap = totalWidth / numberOfServers;

  // Generate servers with more consistent spacing
  for (let i = 0; i < numberOfServers; i++) {
    // Add more randomness to the spacing to make it less dense
    const x = i * averageGap + Math.random() * averageGap * 0.7;

    // Updated colors for servers/computers
    const serverColors = ["#4A5568", "#2D3748", "#1A202C"];
    const color = serverColors[Math.floor(Math.random() * serverColors.length)];

    // Pre-generate indicator lights
    const rackLines = 5;
    const indicatorLights = [];

    for (let j = 0; j < rackLines; j++) {
      if (Math.random() > 0.5) {
        const lightColor = Math.random() > 0.5 ? "#68D391" : "#F56565";
        indicatorLights.push({ rack: j, color: lightColor });
      }
    }

    servers.push({ x, color, indicatorLights });
  }

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  // Pre-generate background elements to prevent flickering
  generateBackgroundElements();

  draw();
}

// Generate stable background elements
function generateBackgroundElements() {
  // Pre-generate binary pattern
  binaryPattern = [];
  for (let x = 0; x < Math.ceil(window.innerWidth / 20) + 1; x++) {
    binaryPattern[x] = [];
    for (let y = 0; y < Math.ceil(window.innerHeight / 15) + 1; y++) {
      binaryPattern[x][y] = Math.random() > 0.5 ? "1" : "0";
    }
  }

  // Pre-generate hill nodes
  hillNodes = [];
  for (let i = 0; i < window.innerWidth; i += 80) {
    if (Math.random() > 0.7) {
      hillNodes.push(i);
    }
  }

  // Pre-generate circuit lines
  circuitLines = [];
  const segments = 5;
  const width = window.innerWidth / segments;

  for (let i = 0; i < segments; i++) {
    const x1 = i * width;
    const x2 = (i + 1) * width;
    const randomOffset1 = 10 + Math.random() * 20;
    const randomOffset2 = 10 + Math.random() * 20;

    circuitLines.push({
      x1,
      x2,
      randomOffset1,
      randomOffset2,
    });
  }
}

// Smoothly update background elements when window size changes
function updateBackgroundElements() {
  // Get current dimensions
  const currentPatternWidth = binaryPattern.length;
  const currentPatternHeight = binaryPattern[0] ? binaryPattern[0].length : 0;

  // Calculate new dimensions
  const newPatternWidth = Math.ceil(window.innerWidth / 20) + 1;
  const newPatternHeight = Math.ceil(window.innerHeight / 15) + 1;

  // Update binary pattern - preserve existing values and only add new ones
  for (let x = 0; x < newPatternWidth; x++) {
    if (!binaryPattern[x]) {
      binaryPattern[x] = [];
    }

    for (let y = 0; y < newPatternHeight; y++) {
      if (binaryPattern[x][y] === undefined) {
        binaryPattern[x][y] = Math.random() > 0.5 ? "1" : "0";
      }
    }
  }

  // Only add new hill nodes if window width increased
  if (window.innerWidth > hillNodes[hillNodes.length - 1] + 80) {
    for (
      let i = hillNodes[hillNodes.length - 1] + 80;
      i < window.innerWidth;
      i += 80
    ) {
      if (Math.random() > 0.7) {
        hillNodes.push(i);
      }
    }
  }

  // Update circuit lines to match new window width
  const segments = 5;
  const width = window.innerWidth / segments;

  // Preserve existing circuit lines but adjust their positions
  for (let i = 0; i < segments; i++) {
    if (circuitLines[i]) {
      circuitLines[i].x1 = i * width;
      circuitLines[i].x2 = (i + 1) * width;
    } else {
      const randomOffset1 = 10 + Math.random() * 20;
      const randomOffset2 = 10 + Math.random() * 20;

      circuitLines.push({
        x1: i * width,
        x2: (i + 1) * width,
        randomOffset1,
        randomOffset2,
      });
    }
  }
}

function generateServer() {
  const minimumGap = 50; // Increased from 30
  const maximumGap = 200; // Increased from 150

  // X coordinate of the right edge of the furthest server
  const lastServer = servers[servers.length - 1];
  let furthestX = lastServer ? lastServer.x : 0;

  // Adjust gap based on number of servers to ensure better distribution
  // If we have many servers, make the gap smaller to fit them better
  const serverCount = servers.length;
  const adjustedMinGap = serverCount > 20 ? 40 : minimumGap; // Increased from 20
  const adjustedMaxGap = serverCount > 20 ? 150 : maximumGap; // Increased from 100

  const x =
    furthestX +
    adjustedMinGap +
    Math.floor(Math.random() * (adjustedMaxGap - adjustedMinGap));

  // Updated colors for servers/computers
  const serverColors = ["#4A5568", "#2D3748", "#1A202C"];
  const color = serverColors[Math.floor(Math.random() * serverColors.length)];

  // Pre-generate indicator lights for this server
  const rackLines = 5;
  const indicatorLights = [];

  for (let i = 0; i < rackLines; i++) {
    // Determine if this rack has an indicator light
    if (Math.random() > 0.5) {
      // Determine if it's green or red
      const lightColor = Math.random() > 0.5 ? "#68D391" : "#F56565";
      indicatorLights.push({ rack: i, color: lightColor });
    }
  }

  servers.push({ x, color, indicatorLights });
}

// Modified generatePlatform function to respect debug mode
function generatePlatform() {
  const minimumGap = DEBUG_MODE && debugMode ? 30 : 40; // Smaller gap in debug mode
  const maximumGap = DEBUG_MODE && debugMode ? 100 : 200; // Smaller maximum gap in debug mode
  const minimumWidth = 20;
  const maximumWidth = 100;

  // X coordinate of the right edge of the furthest platform
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
}

resetGame();

// If space was pressed restart the game
document.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();

    // If the restart button is visible (hero has crashed), restart the game
    if (restartButton.style.display === "grid") {
      resetGame();
      return;
    }

    // Otherwise, play the game (same behavior as left click)
    if (phase == gameStatus.waiting) {
      play();
    } else if (phase == gameStatus.coding) {
      // If already coding (stretching), release on space up
      stop();
    }
  }
});

// Add space key up event to release the stick
document.addEventListener("keyup", function (event) {
  if (event.key == " " && phase == gameStatus.coding) {
    stop();
  }
});

document.addEventListener("mousedown", function (event) {
  event.preventDefault();
  // Only trigger play on left mouse button (button 0)
  if (event.button === 0) {
    play();
  }
});

document.addEventListener("mouseup", function (event) {
  stop();
});

document.addEventListener("touchstart", function (event) {
  event.preventDefault();
  play();
});

document.addEventListener("touchend", function (event) {
  event.preventDefault();
  stop();
});

// Prevent double-tap zoom specifically
document.addEventListener("dblclick", function (event) {
  event.preventDefault();
  return false;
});

// Handle window resize
window.addEventListener("resize", function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Update background elements when window size changes
  updateBackgroundElements();
  draw();
});

window.requestAnimationFrame(animate);

function play() {
  if (phase == gameStatus.waiting) {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = gameStatus.coding;
    window.requestAnimationFrame(animate);
  }
}

function stop() {
  if (phase == gameStatus.coding) {
    phase = gameStatus.deploying;
  }
}

// The main game loop
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  // Animate the bonus gem rotation
  bonusGemRotation = (bonusGemRotation + 1) % 360;

  // Check if we need more servers and add them if necessary
  checkAndAddMoreServers();

  // Update missed gems animations
  updateMissedGems(timestamp - lastTimestamp);

  // Update collected gems animations
  updateCollectedGems(timestamp - lastTimestamp);

  switch (phase) {
    case gameStatus.waiting:
      draw();
      break;
    case gameStatus.coding: {
      sticks.last().length += (timestamp - lastTimestamp) / codingSpeed;
      break;
    }
    case gameStatus.deploying: {
      sticks.last().rotation += (timestamp - lastTimestamp) / deployingSpeed;

      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;

        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          // Increase score
          let pointsEarned = perfectHit ? 2 : 1;

          // Bonus for consecutive perfect hits
          if (perfectHit) {
            // Add a collected gem animation
            collectedGems.push({
              x: nextPlatform.x + nextPlatform.w / 2,
              y: canvasHeight - platformHeight - perfectAreaSize / 2,
              size: perfectAreaSize,
              opacity: 1,
              scale: 1,
              rotation: bonusGemRotation,
              timeLeft: 1000, // Animation duration in ms
              isDebugMode: DEBUG_MODE && debugMode,
            });

            consecutivePerfect++;
            if (consecutivePerfect > 1) {
              pointsEarned *= 1 + consecutivePerfect * 0.5; // Bonus multiplier increases with consecutive hits
              perfectElement.innerHTML = `CLEAN CODE STREAK!<br>x${consecutivePerfect} BONUS (${pointsEarned}pts)`;
            } else {
              perfectElement.innerHTML = "CLEAN CODE! x2 POINTS";
            }
            perfectElement.style.opacity = 1;
            setTimeout(() => (perfectElement.style.opacity = 0), 1500);
          } else {
            consecutivePerfect = 0;
          }

          score += pointsEarned;
          scoreElement.innerText = score;

          if (score > record) {
            localStorage.setItem("record", score);
            record = score;
            recordeElement.innerText = score;
          }

          generatePlatform();
          generateServer();
        }

        phase = gameStatus.running;
      }
      break;
    }
    case gameStatus.running: {
      heroX += (timestamp - lastTimestamp) / runningSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        // If hero will reach another platform then limit it's position at it's edge
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = gameStatus.migrating;
        }
      } else {
        // If hero won't reach another platform then limit it's position at the end of the pole
        const maxHeroX =
          sticks.last().x + sticks.last().length + CharacterReference.heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = gameStatus.crashing;
        }
      }
      break;
    }
    case gameStatus.migrating: {
      sceneOffset += (timestamp - lastTimestamp) / migratingSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        // Check if we missed the perfect hit on the current platform
        const perfectHitX = nextPlatform.x + nextPlatform.w / 2;
        const stickFarX = sticks.last().x + sticks.last().length;

        // If the stick didn't hit the perfect area, add a missed gem
        if (Math.abs(stickFarX - perfectHitX) > perfectAreaSize / 2) {
          missedGems.push({
            x: perfectHitX,
            y: canvasHeight - platformHeight - perfectAreaSize / 2,
            size: perfectAreaSize,
            opacity: 0.7, // Start with lower opacity
            scale: 1,
            timeLeft: 800, // Shorter animation for misses
            isDebugMode: DEBUG_MODE && debugMode,
          });
        }

        // Add the next step
        sticks.push({
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0,
        });
        phase = gameStatus.waiting;
      }
      break;
    }
    case gameStatus.crashing: {
      if (sticks.last().rotation < 180)
        sticks.last().rotation += (timestamp - lastTimestamp) / deployingSpeed;

      heroY += (timestamp - lastTimestamp) / crashingSpeed;
      const maxHeroY =
        platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (heroY > maxHeroY) {
        restartButton.style.display = "grid";
        restartButton.innerHTML =
          DEBUG_MODE && debugMode
            ? "DEBUG COMPLETE<br>RESTART"
            : "DEBUG & RESTART";
        return;
      }
      break;
    }
    default:
      throw Error("Wrong phase");
  }

  draw();
  lastTimestamp = timestamp;
  window.requestAnimationFrame(animate);
}

// Function to update missed gems animations
function updateMissedGems(deltaTime) {
  for (let i = missedGems.length - 1; i >= 0; i--) {
    const gem = missedGems[i];

    // Update time left
    gem.timeLeft -= deltaTime;

    // Calculate animation progress (0 to 1)
    const progress = 1 - gem.timeLeft / 800;

    // Update gem properties based on animation progress - more subtle
    gem.opacity = 0.7 - progress * 0.7; // Fade from 0.7 to 0
    gem.scale = 1 - progress * 0.3; // Slightly shrink

    // Remove gem if animation is complete
    if (gem.timeLeft <= 0) {
      missedGems.splice(i, 1);
    }
  }
}

// Function to update collected gems animations
function updateCollectedGems(deltaTime) {
  for (let i = collectedGems.length - 1; i >= 0; i--) {
    const gem = collectedGems[i];

    // Update time left
    gem.timeLeft -= deltaTime;

    // Calculate animation progress (0 to 1)
    const progress = 1 - gem.timeLeft / 1000;

    // Update gem properties based on animation progress - more dramatic
    gem.opacity = 1 - progress;
    gem.scale = 1 + progress * 0.8; // Grow larger
    gem.rotation += deltaTime / 10; // Rotate faster
    gem.y -= deltaTime * 0.05; // Float upward

    // Remove gem if animation is complete
    if (gem.timeLeft <= 0) {
      collectedGems.splice(i, 1);
    }
  }
}

// Returns the platform the stick hit (if it didn't hit any stick then return undefined)
function thePlatformTheStickHits() {
  if (sticks.last().rotation != 90)
    throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  // If the stick hits the perfect area
  if (
    platformTheStickHits &&
    platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
      stickFarX &&
    stickFarX <
      platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
  )
    return [platformTheStickHits, true];

  return [platformTheStickHits, false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  drawBackground();

  // Center main canvas area to the middle of the screen
  ctx.translate(
    (window.innerWidth - canvasWidth) / 2 - sceneOffset,
    (window.innerHeight - canvasHeight) / 2
  );

  // Draw scene
  drawPlatforms();
  drawHero();
  drawSticks();
  drawMissedGems(); // Draw missed gems
  drawCollectedGems(); // Draw collected gems

  // Restore transformation
  ctx.restore();
}

// Function to draw missed gems
function drawMissedGems() {
  missedGems.forEach((gem) => {
    drawMissedGem(gem);
  });
}

// Function to draw a missed gem - very subtle animation
function drawMissedGem(gem) {
  ctx.save();
  ctx.translate(gem.x, gem.y);

  // Apply scale animation
  ctx.scale(gem.scale, gem.scale);

  // Set opacity
  ctx.globalAlpha = gem.opacity;

  // Draw the gem shape (hexagon)
  const gemSize = gem.size * 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const gemX = Math.cos(angle) * (gemSize / 2);
    const gemY = Math.sin(angle) * (gemSize / 2);

    if (i === 0) {
      ctx.moveTo(gemX, gemY);
    } else {
      ctx.lineTo(gemX, gemY);
    }
  }
  ctx.closePath();

  // Create gradient fill with slightly desaturated colors
  const gemGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, gemSize / 2);

  if (gem.isDebugMode) {
    // Desaturated red in debug mode
    gemGradient.addColorStop(0, "#E2A8A8");
    gemGradient.addColorStop(0.5, "#C76F6F");
    gemGradient.addColorStop(1, "#9B2C2C");
  } else {
    // Desaturated teal
    gemGradient.addColorStop(0, "#A0CEC4");
    gemGradient.addColorStop(0.5, "#319795");
    gemGradient.addColorStop(1, "#1D4044");
  }

  ctx.fillStyle = gemGradient;
  ctx.fill();

  // Add code symbol inside the gem
  ctx.fillStyle = gem.isDebugMode ? "#FFFFFF" : "#E6FFFA";
  ctx.font = `${gemSize * 0.4}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("</>", 0, 0);

  ctx.restore();
}

// Function to draw collected gems
function drawCollectedGems() {
  collectedGems.forEach((gem) => {
    drawCollectedGem(gem);
  });
}

// Function to draw a collected gem - more dramatic animation
function drawCollectedGem(gem) {
  ctx.save();
  ctx.translate(gem.x, gem.y);

  // Apply scale and rotation animations
  ctx.scale(gem.scale, gem.scale);
  ctx.rotate((Math.PI / 180) * gem.rotation);

  // Set opacity
  ctx.globalAlpha = gem.opacity;

  // Create glow effect
  ctx.shadowColor = gem.isDebugMode
    ? "rgba(252, 129, 129, 0.8)"
    : "rgba(56, 178, 172, 0.8)";
  ctx.shadowBlur = 15;

  // Draw the gem shape (hexagon)
  const gemSize = gem.size * 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const gemX = Math.cos(angle) * (gemSize / 2);
    const gemY = Math.sin(angle) * (gemSize / 2);

    if (i === 0) {
      ctx.moveTo(gemX, gemY);
    } else {
      ctx.lineTo(gemX, gemY);
    }
  }
  ctx.closePath();

  // Create gradient fill with brighter colors
  const gemGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, gemSize / 2);

  if (gem.isDebugMode) {
    // Bright red in debug mode
    gemGradient.addColorStop(0, "#FED7D7");
    gemGradient.addColorStop(0.5, "#FC8181");
    gemGradient.addColorStop(1, "#E53E3E");
  } else {
    // Bright teal
    gemGradient.addColorStop(0, "#D6FFFE");
    gemGradient.addColorStop(0.5, "#4FD1C5");
    gemGradient.addColorStop(1, "#285E61");
  }

  ctx.fillStyle = gemGradient;
  ctx.fill();

  // Add code symbol inside the gem
  ctx.fillStyle = gem.isDebugMode ? "#FFFFFF" : "#E6FFFA";
  ctx.font = `${gemSize * 0.4}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("</>", 0, 0);

  // Add shine effect
  ctx.beginPath();
  ctx.moveTo(-gemSize / 4, -gemSize / 4);
  ctx.lineTo(-gemSize / 8, -gemSize / 8);
  ctx.lineTo(-gemSize / 16, -gemSize / 4);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fill();

  ctx.restore();
}

restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});

// Add touch event handlers for the restart button
restartButton.addEventListener("touchstart", function (event) {
  event.stopPropagation();
  event.preventDefault();
});

restartButton.addEventListener("touchend", function (event) {
  event.stopPropagation();
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    // Create a gradient for the platform base
    const platformGradient = ctx.createLinearGradient(
      x,
      canvasHeight - platformHeight,
      x,
      canvasHeight
    );
    platformGradient.addColorStop(0, "#1A365D"); // Dark blue at top
    platformGradient.addColorStop(0.4, "#2B4F76"); // Medium blue
    platformGradient.addColorStop(1, "#1E3A5F"); // Slightly darker blue at bottom

    // Draw platform with gradient
    ctx.fillStyle = platformGradient;
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );

    // Add a subtle top edge highlight
    ctx.fillStyle = "rgba(99, 179, 237, 0.15)"; // Very subtle blue highlight
    ctx.fillRect(x, canvasHeight - platformHeight, w, 1);

    // Add code-like decoration to platforms
    const blockHeight = 20;
    const numBlocks = Math.floor(w / 30);

    for (let i = 0; i < numBlocks; i++) {
      const blockWidth = Math.min(25, w / numBlocks - 5);
      const blockX = x + i * (w / numBlocks) + 2.5;

      // Code block background with subtle gradient
      const codeBlockGradient = ctx.createLinearGradient(
        blockX,
        canvasHeight - platformHeight + 10,
        blockX,
        canvasHeight - platformHeight + 10 + blockHeight
      );
      codeBlockGradient.addColorStop(0, "#1A202C"); // Darker shade for code block
      codeBlockGradient.addColorStop(1, "#0D1117"); // Even darker at bottom

      ctx.fillStyle = codeBlockGradient;
      ctx.fillRect(
        blockX,
        canvasHeight - platformHeight + 10,
        blockWidth,
        blockHeight
      );

      // Add subtle border to code blocks
      ctx.strokeStyle = "rgba(99, 179, 237, 0.3)"; // Light blue border
      ctx.lineWidth = 0.5;
      ctx.strokeRect(
        blockX,
        canvasHeight - platformHeight + 10,
        blockWidth,
        blockHeight
      );

      // Code line (simplified)
      ctx.fillStyle = "#81E6D9"; // Teal color for code
      ctx.fillRect(
        blockX + 3,
        canvasHeight - platformHeight + 13,
        blockWidth * 0.7,
        2
      );

      ctx.fillStyle = "#F687B3"; // Pink color for code
      ctx.fillRect(
        blockX + 3,
        canvasHeight - platformHeight + 17,
        blockWidth * 0.5,
        2
      );

      // Function brackets
      if (i === 0) {
        ctx.fillStyle = "#F6E05E"; // Yellow for brackets
        ctx.font = "15px monospace";
        ctx.fillText("{", blockX - 2, canvasHeight - platformHeight + 24);
      }
      if (i === numBlocks - 1) {
        ctx.fillStyle = "#F6E05E"; // Yellow for brackets
        ctx.font = "15px monospace";
        ctx.fillText(
          "}",
          blockX + blockWidth - 5,
          canvasHeight - platformHeight + 24
        );
      }
    }

    // Draw perfect area only if hero did not yet reach the platform
    if (sticks.last().x < x) {
      // In debug mode, make the perfect area larger and more visible
      const perfectSize =
        DEBUG_MODE && debugMode ? perfectAreaSize * 2 : perfectAreaSize;

      // Draw the code gem bonus object
      drawCodeGem(
        x + w / 2,
        canvasHeight - platformHeight - perfectSize / 2,
        perfectSize,
        DEBUG_MODE && debugMode
      );

      // In debug mode, add a vertical guide line
      if (DEBUG_MODE && debugMode) {
        ctx.strokeStyle = "rgba(252, 129, 129, 0.5)"; // Semi-transparent red
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.beginPath();
        ctx.moveTo(x + w / 2, 0);
        ctx.lineTo(x + w / 2, canvasHeight);
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid line
      }
    }
  });
}

// Function to draw the code gem bonus object
function drawCodeGem(x, y, size, isDebugMode) {
  const gemSize = size * 1.5; // Make the gem slightly larger than the perfect area

  ctx.save();
  ctx.translate(x, y);

  // Apply floating animation
  const floatOffset = Math.sin(Date.now() / 300) * 3;
  ctx.translate(0, floatOffset);

  // Apply rotation animation
  ctx.rotate((Math.PI / 180) * bonusGemRotation);

  // Create glow effect
  ctx.shadowColor = isDebugMode
    ? "rgba(252, 129, 129, 0.8)"
    : "rgba(56, 178, 172, 0.8)";
  ctx.shadowBlur = 15;

  // Draw the gem shape (hexagon)
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const gemX = Math.cos(angle) * (gemSize / 2);
    const gemY = Math.sin(angle) * (gemSize / 2);

    if (i === 0) {
      ctx.moveTo(gemX, gemY);
    } else {
      ctx.lineTo(gemX, gemY);
    }
  }
  ctx.closePath();

  // Create gradient fill
  const gemGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, gemSize / 2);

  if (isDebugMode) {
    // Red gem in debug mode
    gemGradient.addColorStop(0, "#FEB2B2");
    gemGradient.addColorStop(0.5, "#FC8181");
    gemGradient.addColorStop(1, "#C53030");
  } else {
    // Teal/blue gem in regular mode
    gemGradient.addColorStop(0, "#B2F5EA");
    gemGradient.addColorStop(0.5, "#38B2AC");
    gemGradient.addColorStop(1, "#234E52");
  }

  ctx.fillStyle = gemGradient;
  ctx.fill();

  // Add code symbol inside the gem
  ctx.fillStyle = isDebugMode ? "#FFFFFF" : "#E6FFFA";
  ctx.font = `${gemSize * 0.4}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("</>", 0, 0);

  // Add shine effect
  ctx.beginPath();
  ctx.moveTo(-gemSize / 4, -gemSize / 4);
  ctx.lineTo(-gemSize / 8, -gemSize / 8);
  ctx.lineTo(-gemSize / 16, -gemSize / 4);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fill();

  ctx.restore();
}

function drawHero() {
  // Map the game phase to the character reference phase
  let characterPhase = phase;

  // Use the shared character reference implementation
  CharacterReference.drawCharacter(
    ctx,
    characterPhase,
    heroX,
    heroY,
    canvasHeight,
    platformHeight
  );
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();

    // Move the anchor point to the start of the stick and rotate
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    // Draw stick as a connection/pipe
    const stickWidth = 3;

    // Gradient for stick
    const gradient = ctx.createLinearGradient(0, 0, 0, -stick.length);
    gradient.addColorStop(0, "#4299E1"); // Blue
    gradient.addColorStop(1, "#63B3ED"); // Lighter blue

    // Main stick
    ctx.fillStyle = gradient;
    ctx.fillRect(-stickWidth / 2, 0, stickWidth, -stick.length);

    // Connection nodes
    const numNodes = Math.floor(stick.length / 15);
    for (let i = 1; i <= numNodes; i++) {
      ctx.beginPath();
      ctx.fillStyle = "#CBD5E0"; // Light grey for nodes
      ctx.arc(0, -i * 15, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Restore transformations
    ctx.restore();
  });
}

function drawBackground() {
  // Draw tech-themed sky
  var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#1A365D"); // Dark blue
  gradient.addColorStop(1, "#2D3748"); // Dark blue-grey
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Add binary pattern to background using pre-generated pattern
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.font = "10px monospace";

  // Use pre-generated binary pattern
  const patternWidth = Math.ceil(window.innerWidth / 20);
  const patternHeight = Math.ceil(window.innerHeight / 15);

  for (let x = 0; x < patternWidth; x++) {
    for (let y = 0; y < patternHeight; y++) {
      if (binaryPattern[x] && binaryPattern[x][y]) {
        ctx.fillText(binaryPattern[x][y], x * 20, y * 15);
      }
    }
  }

  // Draw circuit-like hills
  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#2B6CB0"); // Medium blue
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#2C5282"); // Darker blue

  // Draw servers/computers towers
  servers.forEach((server) => drawServer(server.x, server.color));
}

// A hill is a shape under a stretched out sinus wave
function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));

  // Add circuit patterns on the hills
  for (let i = 0; i < window.innerWidth; i++) {
    ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));

    // Add pre-generated circuit nodes at intervals
    if (hillNodes.includes(i)) {
      const y = getHillY(i, baseHeight, amplitude, stretch);
      ctx.lineTo(i, y - 5);
      ctx.lineTo(i + 10, y - 5);
      ctx.lineTo(i + 10, y);
    }
  }

  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();

  // Add circuit lines using pre-generated positions
  ctx.strokeStyle = "rgba(79, 209, 197, 0.3)"; // Light teal with transparency
  ctx.lineWidth = 1;
  ctx.beginPath();

  circuitLines.forEach((line) => {
    const x1 = line.x1;
    const x2 = line.x2;
    const y1 =
      getHillY(x1, baseHeight, amplitude, stretch) + line.randomOffset1;
    const y2 =
      getHillY(x2, baseHeight, amplitude, stretch) + line.randomOffset2;

    // Horizontal line
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (x2 - x1) * 0.4, y1);

    // Vertical connector
    ctx.moveTo(x1 + (x2 - x1) * 0.4, y1);
    ctx.lineTo(x1 + (x2 - x1) * 0.4, y2);

    // Horizontal again
    ctx.moveTo(x1 + (x2 - x1) * 0.4, y2);
    ctx.lineTo(x2, y2);
  });

  ctx.stroke();
}

function drawServer(x, color) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
    getServerY(x, hill1BaseHeight, hill1Amplitude)
  );

  // Draw server/computer tower
  const towerWidth = 14;
  const towerHeight = 24;

  // Tower body
  ctx.fillStyle = color;
  ctx.fillRect(-towerWidth / 2, -towerHeight, towerWidth, towerHeight);

  // Server case outline
  ctx.strokeStyle = "#A0AEC0";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-towerWidth / 2, -towerHeight, towerWidth, towerHeight);

  // Server rack lines
  const rackLines = 5;
  const rackHeight = towerHeight / rackLines;

  for (let i = 0; i < rackLines; i++) {
    // Server slot
    ctx.fillStyle = "#1A202C"; // Darker shade for server slots
    ctx.fillRect(
      -towerWidth / 2 + 1,
      -towerHeight + i * rackHeight + 1,
      towerWidth - 2,
      rackHeight - 2
    );

    // Add rack mount points
    ctx.fillStyle = "#718096";
    ctx.fillRect(
      -towerWidth / 2 + 2,
      -towerHeight + i * rackHeight + rackHeight / 2 - 1,
      2,
      2
    );
    ctx.fillRect(
      towerWidth / 2 - 4,
      -towerHeight + i * rackHeight + rackHeight / 2 - 1,
      2,
      2
    );
  }

  // Find the server object that matches this x coordinate
  const server = servers.find(
    (s) =>
      Math.abs(
        (-sceneOffset * backgroundSpeedMultiplier + s.x) * hill1Stretch -
          (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch
      ) < 0.1
  );

  // Draw pre-generated indicator lights
  if (server && server.indicatorLights) {
    server.indicatorLights.forEach((light) => {
      ctx.fillStyle = light.color;
      ctx.fillRect(
        -towerWidth / 2 + towerWidth - 4,
        -towerHeight + light.rack * rackHeight + rackHeight / 2 - 1,
        2,
        2
      );
    });
  }

  ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
      amplitude +
    sineBaseY
  );
}

function getServerY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}

// Function to check if we need more servers and add them if necessary
function checkAndAddMoreServers() {
  // Calculate the visible area based on current sceneOffset
  const visibleAreaEnd = -sceneOffset + window.innerWidth / hill1Stretch;

  // Find the furthest server
  const lastServer = servers.length > 0 ? servers[servers.length - 1] : null;
  const furthestServerX = lastServer ? lastServer.x : 0;

  // If the furthest server is getting close to the visible area, add more servers
  if (!lastServer || furthestServerX < visibleAreaEnd + 500) {
    // Add fewer servers to ensure we have a reasonable amount ahead
    const serversToAdd = 5; // Reduced from 10
    for (let i = 0; i < serversToAdd; i++) {
      generateServer();
    }
  }

  // Clean up servers that are far behind us to save memory
  const visibleAreaStart = -sceneOffset - 300;
  servers = servers.filter((server) => server.x > visibleAreaStart);
}
