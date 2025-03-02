import { config } from "./utils.js";

// Platform class
export class Platform {
  constructor(x, w, id) {
    this.x = x;
    this.w = w;
    this.id = id;
  }
}

// Stick class
export class Stick {
  constructor(x, length = 0, rotation = 0) {
    this.x = x;
    this.length = length;
    this.rotation = rotation;
  }
}

// Server class
export class Server {
  constructor(x) {
    this.x = x;

    // Updated colors for servers/computers
    const serverColors = ["#4A5568", "#2D3748", "#1A202C"];
    this.color = serverColors[Math.floor(Math.random() * serverColors.length)];

    // Pre-generate indicator lights
    this.indicatorLights = [];
    const rackLines = 5;

    for (let j = 0; j < rackLines; j++) {
      if (Math.random() > 0.5) {
        const lightColor = Math.random() > 0.5 ? "#68D391" : "#F56565";
        this.indicatorLights.push({ rack: j, color: lightColor });
      }
    }
  }
}

// Gem class (base class for both collected and missed gems)
export class Gem {
  constructor(x, y, size, isDebugMode) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.opacity = 1;
    this.scale = 1;
    this.rotation = 0;
    this.isDebugMode = isDebugMode;
  }
}

// Collected gem class
export class CollectedGem extends Gem {
  constructor(x, y, size, isDebugMode) {
    super(x, y, size, isDebugMode);
    this.timeLeft = 1000; // Animation duration in ms
  }

  update(deltaTime) {
    // Update time left
    this.timeLeft -= deltaTime;

    // Calculate animation progress (0 to 1)
    const progress = 1 - this.timeLeft / 1000;

    // Update gem properties based on animation progress - more dramatic
    this.opacity = 1 - progress;
    this.scale = 1 + progress * 0.8; // Grow larger
    this.rotation += deltaTime / 10; // Rotate faster
    this.y -= deltaTime * 0.05; // Float upward

    // Return true if animation is complete
    return this.timeLeft <= 0;
  }
}

// Missed gem class
export class MissedGem extends Gem {
  constructor(x, y, size, isDebugMode) {
    super(x, y, size, isDebugMode);
    this.opacity = 0.7; // Start with lower opacity
    this.timeLeft = 800; // Shorter animation for misses
  }

  update(deltaTime) {
    // Update time left
    this.timeLeft -= deltaTime;

    // Calculate animation progress (0 to 1)
    const progress = 1 - this.timeLeft / 800;

    // Update gem properties based on animation progress - more subtle
    this.opacity = 0.7 - progress * 0.7; // Fade from 0.7 to 0
    this.scale = 1 - progress * 0.3; // Slightly shrink

    // Return true if animation is complete
    return this.timeLeft <= 0;
  }
}

// Factory functions to create game objects
export function createPlatform(platforms, debugMode = false) {
  const minimumGap = debugMode ? 30 : 40; // Smaller gap in debug mode
  const maximumGap = debugMode ? 100 : 200; // Smaller maximum gap in debug mode
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

  return new Platform(x, w, platforms.length);
}

export function createServer(servers) {
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

  return new Server(x);
}

// Function to check if a stick hits a platform and if it's a perfect hit
export function checkStickHitsPlatform(stick, platforms, perfectAreaSize) {
  if (stick.rotation != 90) {
    throw Error(`Stick is ${stick.rotation}°`);
  }

  const stickFarX = stick.x + stick.length;

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
  ) {
    return [platformTheStickHits, true];
  }

  return [platformTheStickHits, false];
}
