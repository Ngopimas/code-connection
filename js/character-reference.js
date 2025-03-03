/**
 * Character Reference Guide
 *
 * This file documents all the character forms and animations from a stick hero game.
 * Use this as a reference for implementing similar character designs in future projects.
 *
 * The character has different appearances based on the game state:
 * - waiting: Standing with laptop in left hand
 * - coding: Sitting with laptop open, animated code lines
 * - deploying: Sitting with laptop open, static code lines
 * - running: Moving with laptop tucked under right arm
 * - crashing: Falling with laptop above head
 */

// ===== Character Dimensions =====
const heroWidth = 17;
const heroHeight = 30;

// ===== Blinking Animation Configuration =====
// Core blinking state
let blinkState = "open"; // 'open', 'closing', 'closed', 'opening'
let blinkTimer = 0;
let lastBlinkTime = Date.now();

// Blink timing configuration (can be adjusted based on context)
let blinkDuration = 400; // Duration of a complete blink in ms
let timeBetweenBlinks = 4000; // Time between blinks in ms (4 seconds)

// Consecutive blink behavior
let consecutiveBlinkCount = 0; // Track how many blinks have occurred in sequence
let maxConsecutiveBlinks = 3; // Maximum number of consecutive blinks
let nextBlinkTimeout = null; // Store the timeout ID

// Blink control
let forceBlinkCheck = true; // Force a blink check on next frame
let globalBlinkInterval = null; // Store the global interval ID

// Context detection
let isDocumentationContext = false; // Flag to identify documentation context

// ===== Blink Management Functions =====

/**
 * Set up a global interval to trigger blinks (helps with showcase pages)
 * @returns {number} The interval ID
 */
function setupGlobalBlinkInterval() {
  // Clear any existing interval
  if (globalBlinkInterval) {
    clearInterval(globalBlinkInterval);
  }

  // Check if we're in a documentation context by examining the page URL
  isDocumentationContext =
    window.location.pathname.includes("showcase") ||
    !window.location.pathname.includes("index.html");

  // Set different timing for documentation pages
  if (isDocumentationContext) {
    timeBetweenBlinks = 3000; // More frequent blinks in documentation (3 seconds)
    blinkDuration = 600; // Slower blinks for more visibility
  }

  // Set up a more frequent interval for documentation pages
  const checkInterval = isDocumentationContext ? 200 : 500;

  // Set up a new interval
  globalBlinkInterval = setInterval(() => {
    // Only trigger blinks when in open state and enough time has passed
    if (
      blinkState === "open" &&
      !nextBlinkTimeout &&
      Date.now() - lastBlinkTime > timeBetweenBlinks
    ) {
      // Start a new blink
      blinkState = "closing";
      blinkTimer = 0;
      consecutiveBlinkCount = 1;
      forceBlinkCheck = false;
      lastBlinkTime = Date.now(); // Update last blink time

      // Reset force check after a delay
      setTimeout(() => {
        forceBlinkCheck = true;
      }, timeBetweenBlinks);
    }
  }, checkInterval);

  return globalBlinkInterval;
}

/**
 * Updates the blinking state based on time
 */
function updateBlinkState() {
  const currentTime = Date.now();

  // Check if it's time to start a new blink sequence
  if (
    blinkState === "open" &&
    currentTime - lastBlinkTime > timeBetweenBlinks &&
    !nextBlinkTimeout
  ) {
    // Start a new blink
    blinkState = "closing";
    blinkTimer = 0;
    consecutiveBlinkCount = 1;
    return;
  }

  // Update ongoing blink animation
  if (blinkState !== "open") {
    // Use a fixed time step for more consistent animation
    const timeStep = 16; // 16ms is approximately 60fps
    blinkTimer += timeStep;

    // Use adjusted timings for documentation context
    const closingThreshold = isDocumentationContext
      ? blinkDuration / 3
      : blinkDuration / 4;
    const closedDuration = isDocumentationContext
      ? blinkDuration / 4
      : blinkDuration / 6;
    const openingThreshold = isDocumentationContext
      ? blinkDuration / 3
      : blinkDuration / 4;

    if (blinkState === "closing" && blinkTimer >= closingThreshold) {
      // Eyes closed
      blinkState = "closed";
      blinkTimer = 0;
    } else if (blinkState === "closed" && blinkTimer >= closedDuration) {
      // Start opening eyes
      blinkState = "opening";
      blinkTimer = 0;
    } else if (blinkState === "opening" && blinkTimer >= openingThreshold) {
      // Eyes fully open
      blinkState = "open";
      blinkTimer = 0;
      lastBlinkTime = currentTime; // Reset the last blink time when eyes fully open

      // Check if we should do another blink in the sequence
      if (consecutiveBlinkCount < maxConsecutiveBlinks && !nextBlinkTimeout) {
        // Determine if we should do another blink based on probability
        // Higher probability in documentation context
        const blinkProbability = isDocumentationContext
          ? 0.8 // 80% chance in documentation
          : consecutiveBlinkCount === 1
          ? 0.7
          : consecutiveBlinkCount === 2
          ? 0.4
          : 0;

        if (Math.random() < blinkProbability) {
          // Schedule the next blink after a short delay
          // Longer delay in documentation context for more visibility
          const delay = isDocumentationContext ? 250 : 150;
          nextBlinkTimeout = setTimeout(() => {
            blinkState = "closing";
            blinkTimer = 0;
            consecutiveBlinkCount++;
            nextBlinkTimeout = null;
          }, delay);
        } else {
          // End the sequence
          consecutiveBlinkCount = 0;
        }
      } else {
        // Max consecutive blinks reached, end the sequence
        consecutiveBlinkCount = 0;
      }
    }
  }
}

/**
 * Helper function to trigger a blink manually
 */
function triggerBlink() {
  blinkState = "closing";
  blinkTimer = 0;
  consecutiveBlinkCount = 1;
  lastBlinkTime = Date.now();
}

// ===== Initialize Blink System =====
window.addEventListener("DOMContentLoaded", () => {
  if (!globalBlinkInterval) {
    globalBlinkInterval = setupGlobalBlinkInterval();

    // Force an initial blink after a short delay to show the animation is working
    setTimeout(() => {
      triggerBlink();
    }, 1000);
  }
});

// Add a more frequent blink timer update
setInterval(() => {
  if (blinkState !== "open") {
    updateBlinkState();
  }
}, 16); // Update every ~16ms for smooth animation

// Make sure the interval is maintained even if the tab loses focus
window.addEventListener("focus", () => {
  if (!globalBlinkInterval) {
    globalBlinkInterval = setupGlobalBlinkInterval();
  }
});

// ===== Character Drawing Functions =====

/**
 * Main character drawing function
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} phase - Current game phase/state
 * @param {number} heroX - X position of hero
 * @param {number} heroY - Y position of hero
 * @param {number} canvasHeight - Height of the canvas
 * @param {number} platformHeight - Height of the platforms
 */
function drawCharacter(ctx, phase, heroX, heroY, canvasHeight, platformHeight) {
  ctx.save();
  ctx.fillStyle = "black";
  ctx.translate(
    heroX - heroWidth / 2,
    heroY + canvasHeight - platformHeight - heroHeight / 2
  );

  // Update blink timer if in waiting phase
  if (phase === "waiting") {
    // Make sure the global blink interval is active
    if (!globalBlinkInterval) {
      globalBlinkInterval = setupGlobalBlinkInterval();
    }

    // Force a blink check periodically to ensure animation works in all contexts
    if (forceBlinkCheck) {
      const now = Date.now();
      if (now - lastBlinkTime > timeBetweenBlinks) {
        blinkState = "closing";
        blinkTimer = 0;
        consecutiveBlinkCount = 1;
        lastBlinkTime = now;
        forceBlinkCheck = false;

        // Reset force check after a delay
        setTimeout(() => {
          forceBlinkCheck = true;
        }, timeBetweenBlinks);
      }
    }

    // Always update blink state when in waiting phase
    updateBlinkState();
  } else {
    // Reset blink state when not in waiting phase
    blinkState = "open";
    consecutiveBlinkCount = 0;
    if (nextBlinkTimeout) {
      clearTimeout(nextBlinkTimeout);
      nextBlinkTimeout = null;
    }
  }

  // Draw the base character (common to all states)
  // Don't draw legs in running state as we'll draw animated legs instead
  drawCharacterBase(ctx, phase !== "running" && phase !== "migrating", phase);

  // Draw state-specific elements
  switch (phase) {
    case "waiting":
      drawWaitingState(ctx);
      break;
    case "coding":
      drawCodingState(ctx, true); // true for animated code
      break;
    case "deploying":
      drawCodingState(ctx, false); // false for static code
      break;
    case "running":
    case "migrating": // Use the same animation for migrating as for running
      drawRunningState(ctx);
      break;
    case "crashing":
      drawCrashingState(ctx);
      break;
  }

  ctx.restore();
}

/**
 * Draws the base character (body, legs, eyes, glasses)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {boolean} drawLegs - Whether to draw the default legs (default: true)
 * @param {string} phase - Current game phase/state
 */
function drawCharacterBase(ctx, drawLegs = true, phase = "") {
  // Body
  drawRoundedRect(
    ctx,
    -heroWidth / 2,
    -heroHeight / 2,
    heroWidth,
    heroHeight - 4,
    5
  );

  // Legs (only if drawLegs is true)
  if (drawLegs) {
    const legDistance = 5;
    ctx.beginPath();
    ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
  }

  // Eyes/Glasses
  drawEyes(ctx, phase);

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
}

/**
 * Draws the character's eyes with blinking animation when in waiting phase
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} phase - Current game phase/state
 */
function drawEyes(ctx, phase) {
  ctx.fillStyle = "white";

  // Default eye size
  let eyeHeight = 3;
  let eyeWidth = 3;

  // Apply blinking animation only in waiting phase
  if (phase === "waiting") {
    // Calculate eye height based on blink state
    if (blinkState === "closing") {
      // Gradually close eyes - exaggerated cartoon effect
      const progress =
        blinkTimer /
        (isDocumentationContext ? blinkDuration / 3 : blinkDuration / 4);
      eyeHeight = 3 * (1 - progress);
      // More pronounced effect in documentation
      const widthMultiplier = isDocumentationContext ? 0.7 : 0.5;
      // Slightly widen eyes as they close for cartoon effect
      eyeWidth = 3 + progress * widthMultiplier;
    } else if (blinkState === "closed") {
      // Eyes almost closed for cartoon effect
      eyeHeight = isDocumentationContext ? 0.2 : 0.3; // More closed in documentation
      eyeWidth = isDocumentationContext ? 3.7 : 3.5; // Wider when closed in documentation
    } else if (blinkState === "opening") {
      // Gradually open eyes - exaggerated cartoon effect
      const progress =
        blinkTimer /
        (isDocumentationContext ? blinkDuration / 3 : blinkDuration / 4);
      const minHeight = isDocumentationContext ? 0.2 : 0.3;
      eyeHeight = minHeight + (3 - minHeight) * progress;
      // Return to normal width
      const maxWidth = isDocumentationContext ? 3.7 : 3.5;
      const widthMultiplier = isDocumentationContext ? 0.7 : 0.5;
      eyeWidth = maxWidth - progress * widthMultiplier;
    }
  }

  // Draw right eye
  ctx.beginPath();
  if (eyeHeight < 3) {
    // Draw as ellipse when blinking
    ctx.ellipse(3, -7, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  } else {
    // Draw as circle when fully open
    ctx.arc(3, -7, 3, 0, Math.PI * 2, false);
  }
  ctx.fill();

  // Draw left eye
  ctx.beginPath();
  if (eyeHeight < 3) {
    // Draw as ellipse when blinking
    ctx.ellipse(-3, -7, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  } else {
    // Draw as circle when fully open
    ctx.arc(-3, -7, 3, 0, Math.PI * 2, false);
  }
  ctx.fill();
}

/**
 * Draws the character in waiting state (holding laptop in left hand)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function drawWaitingState(ctx) {
  // Left hand holding laptop
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(-8, 5, 2.5, 0, Math.PI * 2, false); // left hand
  ctx.fill();

  // Folded laptop
  const laptopWidth = 10;
  const laptopHeight = 7;

  // Laptop base (bottom part)
  ctx.fillStyle = "#4A5568"; // Dark gray
  ctx.fillRect(-13, 5, laptopWidth, laptopHeight / 2);

  // Laptop screen (top part) - slightly offset to show it's folded but not fully closed
  ctx.fillStyle = "#2D3748"; // Darker gray
  ctx.fillRect(-13, 5 - laptopHeight / 2, laptopWidth, laptopHeight / 2);

  // Screen inner part
  ctx.fillStyle = "#1A202C"; // Almost black
  ctx.fillRect(
    -12,
    5 - laptopHeight / 2 + 1,
    laptopWidth - 2,
    laptopHeight / 2 - 2
  );

  // Laptop logo
  ctx.fillStyle = "#63B3ED"; // Light blue
  ctx.beginPath();
  ctx.arc(-8, 5 - laptopHeight / 4, 1, 0, Math.PI * 2, false);
  ctx.fill();
}

/**
 * Draws the character in coding/deploying state (using laptop)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {boolean} animated - Whether to animate the code lines
 */
function drawCodingState(ctx, animated) {
  ctx.fillStyle = "#666";
  ctx.fillRect(-8, -3, 16, 2); // laptop base
  ctx.fillStyle = "#333";
  ctx.fillRect(-7, -15, 14, 12); // laptop screen
  ctx.fillStyle = "#6495ED"; // cornflower blue for screen
  ctx.fillRect(-6, -14, 12, 10);
  ctx.fillStyle = "#FFF";

  if (animated) {
    // Animated code lines for coding state
    const time = Date.now() / 200;
    const lineLength1 = 5 + Math.sin(time) * 3;
    const lineLength2 = 7 + Math.cos(time * 1.1) * 2;
    const lineLength3 = 4 + Math.sin(time * 0.7) * 4;

    ctx.fillRect(-5, -13, lineLength1, 1);
    ctx.fillRect(-5, -11, lineLength2, 1);
    ctx.fillRect(-5, -9, lineLength3, 1);
    ctx.fillRect(-5, -7, 5, 1);
  } else {
    // Static code lines for deploying state
    ctx.fillRect(-5, -13, 8, 1);
    ctx.fillRect(-5, -11, 6, 1);
    ctx.fillRect(-5, -9, 9, 1);
    ctx.fillRect(-5, -7, 5, 1);
  }
}

/**
 * Draws the character in running state (laptop tucked under arm)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function drawRunningState(ctx) {
  // Running animation timing
  const runningTime = Date.now() / 150;
  const legCycle = Math.sin(runningTime);
  const bobAmount = legCycle * 0.5;

  // Animate the body with a slight bob
  ctx.save();
  ctx.translate(0, Math.abs(bobAmount) * 0.8); // Body bobs up and down slightly

  // Override the default legs with animated running legs
  const legDistance = 5;
  const legLift = 3; // How high the legs lift when running

  // Clear the area where the default legs would be (in case this is called after drawCharacterBase)
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.rect(-legDistance - 4, 8, 8, 8); // Left leg area
  ctx.rect(legDistance - 4, 8, 8, 8); // Right leg area
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // Draw animated legs
  ctx.fillStyle = "black";

  // Left leg - moves opposite to right leg
  ctx.beginPath();
  const leftLegY = 11.5 - legCycle * legLift;
  ctx.arc(-legDistance, leftLegY, 3, 0, Math.PI * 2, false);
  ctx.fill();

  // Right leg
  ctx.beginPath();
  const rightLegY = 11.5 + legCycle * legLift;
  ctx.arc(legDistance, rightLegY, 3, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.restore(); // Restore from body bob transformation

  // Folded laptop tucked under right arm
  const laptopWidth = 10;
  const laptopHeight = 6;

  // Laptop (closed/folded)
  ctx.fillStyle = "#4A5568"; // Dark gray
  ctx.fillRect(4, -2, laptopWidth, laptopHeight);

  // Laptop edge details
  ctx.fillStyle = "#2D3748"; // Darker gray
  ctx.fillRect(4, -2, laptopWidth, 1); // Top edge
  ctx.fillRect(4, -2, 1, laptopHeight); // Left edge

  // Laptop logo
  ctx.fillStyle = "#63B3ED"; // Light blue
  ctx.beginPath();
  ctx.arc(9, 1, 1, 0, Math.PI * 2, false);
  ctx.fill();

  // Right arm holding laptop (drawn behind the laptop)
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(7, -4, 2, 0, Math.PI * 2, false); // right arm/shoulder
  ctx.fill();

  // Arm coming across body to hold laptop (drawn in front)
  ctx.beginPath();
  ctx.arc(4 + bobAmount, 1, 2, 0, Math.PI * 2, false); // hand holding laptop
  ctx.fill();
}

/**
 * Draws the character in crashing state (laptop above head)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function drawCrashingState(ctx) {
  // Laptop positioned above head
  ctx.save();
  ctx.translate(0, -16);

  // Laptop base
  ctx.fillStyle = "#666";
  ctx.fillRect(-8, -3, 16, 2);

  // Laptop screen
  ctx.fillStyle = "#333";
  ctx.fillRect(-7, -15, 14, 12);

  // Screen inner part
  ctx.fillStyle = "#CD5C5C"; // red error screen - Indian Red, a more muted red that fits the theme
  ctx.fillRect(-6, -14, 12, 10);

  // Draw a bomb icon
  // Bomb body (circle)
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(-1, -8, 3, 0, Math.PI * 2);
  ctx.fill();

  // Bomb fuse
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.quadraticCurveTo(2, -12, 3, -10);
  ctx.stroke();

  // Bomb highlight
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.arc(-2, -9, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Add some motion lines to show it's falling/crashing
  ctx.strokeStyle = "#CBD5E0";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-12, -5);
  ctx.lineTo(-10, -7);
  ctx.moveTo(-14, -3);
  ctx.lineTo(-12, -5);
  ctx.moveTo(12, -5);
  ctx.lineTo(10, -7);
  ctx.moveTo(14, -3);
  ctx.lineTo(12, -5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper function to draw a rounded rectangle
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width of rectangle
 * @param {number} height - Height of rectangle
 * @param {number} radius - Corner radius
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// ===== Module Export =====
// Export the module for use in both browser and Node.js environments
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.CharacterReference = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  // Just return a value to define the module export
  return {
    drawCharacter: drawCharacter,
    drawCharacterBase: drawCharacterBase,
    drawWaitingState: drawWaitingState,
    drawCodingState: drawCodingState,
    drawRunningState: drawRunningState,
    drawCrashingState: drawCrashingState,
    drawRoundedRect: drawRoundedRect,
    updateBlinkState: updateBlinkState,
    heroWidth: heroWidth,
    heroHeight: heroHeight,
    // Expose blinking state variables
    getBlinkState: function () {
      return {
        blinkState: blinkState,
        blinkTimer: blinkTimer,
        lastBlinkTime: lastBlinkTime,
        consecutiveBlinkCount: consecutiveBlinkCount,
      };
    },
    // Allow manual triggering of blinks for testing
    triggerBlink: triggerBlink,
    // Add a way to explicitly set documentation mode
    setDocumentationMode: function (isDoc) {
      isDocumentationContext = !!isDoc;
      // Adjust timing parameters
      if (isDocumentationContext) {
        timeBetweenBlinks = 3000;
        blinkDuration = 600;
      } else {
        timeBetweenBlinks = 4000;
        blinkDuration = 400;
      }
    },
    isDocumentationContext: function () {
      return isDocumentationContext;
    },
  };
});

/**
 * Example usage:
 *
 * In HTML:
 * <script src="character-reference.js"></script>
 * <script>
 *   // Use global CharacterReference object
 *   CharacterReference.drawCharacter(ctx, phase, 100, 0, 375, 100);
 * </script>
 *
 * In ES6 module:
 * import { drawCharacter } from './character-reference.js';
 * drawCharacter(ctx, phase, 100, 0, 375, 100);
 */

// ===== Color palette reference =====
const colors = {
  black: "black",
  white: "white",
  darkGray: "#4A5568",
  darkerGray: "#2D3748",
  almostBlack: "#1A202C",
  lightBlue: "#63B3ED",
  cornflowerBlue: "#6495ED",
  lightGray: "#CBD5E0",
};
