/**
 * From Hunor Marton Borbely:
 * https://codepen.io/HunorMarton/pen/xxOMQKg
 * If you want to know how this game was originally made, check out his video:
 * https://youtu.be/eue3UdFvwPo
 */

// Toggle a debug button and info on screen
const DEBUG_MODE = true;

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
let trees = [];

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

const heroWidth = 17; // 24
const heroHeight = 30; // 40

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
  });

  // Toggle debug mode
  debugButton.addEventListener("click", function (e) {
    e.stopPropagation(); // Prevent event from bubbling up to document
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

  trees = [];
  Array.from({ length: 10 }, () => generateTree());

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  draw();
}

function generateTree() {
  const minimumGap = 30;
  const maximumGap = 150;

  // X coordinate of the right edge of the furthest tree
  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));

  const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
  const color = treeColors[Math.floor(Math.random() * 3)];

  trees.push({ x, color });
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
    resetGame();
    return;
  }
});

document.addEventListener("mousedown", function (event) {
  event.preventDefault();
  play();
});

document.addEventListener("mouseup", function (event) {
  stop();
});

document.addEventListener("touchstart", function (event) {
  event.preventDefault();
  play();
});

document.addEventListener("touchend", function (event) {
  event.preventDefault(); // Add preventDefault to touchend as well
  stop();
});

// Prevent double-tap zoom specifically
document.addEventListener("dblclick", function (event) {
  event.preventDefault();
  return false;
});

window.addEventListener("resize", function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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

  switch (phase) {
    case gameStatus.waiting:
      return; // Stop the loop
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
          generateTree();
          generateTree();
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
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
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
  window.requestAnimationFrame(animate);

  lastTimestamp = timestamp;
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

  // Restore transformation
  ctx.restore();
}

restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    // Draw platform
    ctx.fillStyle = "#2D3748"; // Dark blue-grey color like VS Code dark theme
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );

    // Add code-like decoration to platforms
    const blockHeight = 20;
    const numBlocks = Math.floor(w / 30);

    for (let i = 0; i < numBlocks; i++) {
      const blockWidth = Math.min(25, w / numBlocks - 5);
      const blockX = x + i * (w / numBlocks) + 2.5;

      // Code block background
      ctx.fillStyle = "#1A202C"; // Darker shade for code block
      ctx.fillRect(
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

      ctx.fillStyle = DEBUG_MODE && debugMode ? "#FC8181" : "#38B2AC"; // Red in debug mode, teal in regular mode
      ctx.fillRect(
        x + w / 2 - perfectSize / 2,
        canvasHeight - platformHeight,
        perfectSize,
        perfectSize
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

function drawHero() {
  ctx.save();
  ctx.fillStyle = "black";
  ctx.translate(
    heroX - heroWidth / 2,
    heroY + canvasHeight - platformHeight - heroHeight / 2
  );

  // Body
  drawRoundedRect(
    -heroWidth / 2,
    -heroHeight / 2,
    heroWidth,
    heroHeight - 4,
    5
  );

  // Legs
  const legDistance = 5;
  ctx.beginPath();
  ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();

  // Eyes/Glasses
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(3, -7, 3, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-3, -7, 3, 0, Math.PI * 2, false);
  ctx.fill();

  // Glasses frame
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(3, -7, 3.5, 0, Math.PI * 2, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-3, -7, 3.5, 0, Math.PI * 2, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(-3, -7);
  ctx.moveTo(0, -7);
  ctx.lineTo(3, -7);
  ctx.stroke();

  // Laptop - show it when coding or deploying
  if (phase === gameStatus.coding || phase === gameStatus.deploying) {
    ctx.fillStyle = "#666";
    ctx.fillRect(-8, -3, 16, 2); // laptop base
    ctx.fillStyle = "#333";
    ctx.fillRect(-7, -15, 14, 12); // laptop screen
    ctx.fillStyle = "#6495ED"; // cornflower blue for screen
    ctx.fillRect(-6, -14, 12, 10);
    ctx.fillStyle = "#FFF";

    // Animated code lines on screen when coding
    if (phase === gameStatus.coding) {
      // More active coding animation
      const time = Date.now() / 200;
      const lineLength1 = 5 + Math.sin(time) * 3;
      const lineLength2 = 7 + Math.cos(time * 1.1) * 2;
      const lineLength3 = 4 + Math.sin(time * 0.7) * 4;

      ctx.fillRect(-5, -13, lineLength1, 1);
      ctx.fillRect(-5, -11, lineLength2, 1);
      ctx.fillRect(-5, -9, lineLength3, 1);
      ctx.fillRect(-5, -7, 5, 1);
    } else {
      // Static code lines when deploying
      ctx.fillRect(-5, -13, 8, 1);
      ctx.fillRect(-5, -11, 6, 1);
      ctx.fillRect(-5, -9, 9, 1);
      ctx.fillRect(-5, -7, 5, 1);
    }
  }

  // Headphones/Gaming headset
  ctx.fillStyle = "#444";
  ctx.fillRect(-8, -19, 16, 3); // headband
  ctx.beginPath();
  ctx.arc(-8, -17, 2, 0, Math.PI * 2, false); // left earpiece
  ctx.arc(8, -17, 2, 0, Math.PI * 2, false); // right earpiece
  ctx.fill();

  ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.fill();
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

  // Add binary pattern to background
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.font = "10px monospace";

  // Binary pattern - create a grid of 0s and 1s
  for (let x = 0; x < window.innerWidth; x += 20) {
    for (let y = 0; y < window.innerHeight; y += 15) {
      const digit = Math.random() > 0.5 ? "1" : "0";
      ctx.fillText(digit, x, y);
    }
  }

  // Draw circuit-like hills
  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#2B6CB0"); // Medium blue
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#2C5282"); // Darker blue

  // Draw trees (replaced with server/computer towers)
  trees.forEach((tree) => drawTree(tree.x, tree.color));
}

// A hill is a shape under a stretched out sinus wave
function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));

  // Add circuit patterns on the hills
  for (let i = 0; i < window.innerWidth; i++) {
    ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));

    // Add random circuit nodes at intervals
    if (i % 80 === 0 && Math.random() > 0.7) {
      const y = getHillY(i, baseHeight, amplitude, stretch);
      ctx.lineTo(i, y - 5);
      ctx.lineTo(i + 10, y - 5);
      ctx.lineTo(i + 10, y);
    }
  }

  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();

  // Add circuit lines
  ctx.strokeStyle = "rgba(79, 209, 197, 0.3)"; // Light teal with transparency
  ctx.lineWidth = 1;
  ctx.beginPath();

  const segments = 5;
  const width = window.innerWidth / segments;

  for (let i = 0; i < segments; i++) {
    const x1 = i * width;
    const x2 = (i + 1) * width;
    const y1 =
      getHillY(x1, baseHeight, amplitude, stretch) + 10 + Math.random() * 20;
    const y2 =
      getHillY(x2, baseHeight, amplitude, stretch) + 10 + Math.random() * 20;

    // Horizontal line
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + width * 0.4, y1);

    // Vertical connector
    ctx.moveTo(x1 + width * 0.4, y1);
    ctx.lineTo(x1 + width * 0.4, y2);

    // Horizontal again
    ctx.moveTo(x1 + width * 0.4, y2);
    ctx.lineTo(x2, y2);
  }

  ctx.stroke();
}

function drawTree(x, color) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
    getTreeY(x, hill1BaseHeight, hill1Amplitude)
  );

  // Draw server/computer tower instead of tree
  const towerWidth = 12;
  const towerHeight = 20;

  // Tower body
  ctx.fillStyle = "#4A5568"; // Dark grey for tower
  ctx.fillRect(-towerWidth / 2, -towerHeight, towerWidth, towerHeight);

  // Server rack lines
  const rackLines = 5;
  const rackHeight = towerHeight / rackLines;

  for (let i = 0; i < rackLines; i++) {
    // Server slot
    ctx.fillStyle = "#2D3748"; // Darker shade for server slots
    ctx.fillRect(
      -towerWidth / 2 + 1,
      -towerHeight + i * rackHeight + 1,
      towerWidth - 2,
      rackHeight - 2
    );

    // Indicator lights
    if (Math.random() > 0.5) {
      ctx.fillStyle = Math.random() > 0.5 ? "#68D391" : "#F56565"; // Green or red lights
      ctx.fillRect(
        towerWidth / 2 - 3,
        -towerHeight + i * rackHeight + rackHeight / 2,
        2,
        2
      );
    }
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

function getTreeY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}
