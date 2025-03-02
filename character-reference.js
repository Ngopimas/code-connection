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

// Constants for character dimensions
const heroWidth = 17;
const heroHeight = 30;

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

  // Draw the base character (common to all states)
  // Don't draw legs in running state as we'll draw animated legs instead
  drawCharacterBase(ctx, phase !== "running" && phase !== "migrating");

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
 */
function drawCharacterBase(ctx, drawLegs = true) {
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
  // Laptop base
  const laptopWidth = 14;
  const laptopHeight = 2;
  ctx.fillStyle = "#4A5568"; // Dark gray
  ctx.fillRect(-laptopWidth / 2, -22, laptopWidth, laptopHeight);

  // Laptop screen (open and above head)
  ctx.fillStyle = "#2D3748"; // Darker gray
  ctx.fillRect(-laptopWidth / 2, -22 - 10, laptopWidth, 10);

  // Screen inner part
  ctx.fillStyle = "#1A202C"; // Almost black
  ctx.fillRect(-laptopWidth / 2 + 1, -22 - 9, laptopWidth - 2, 8);

  // Laptop logo
  ctx.fillStyle = "#63B3ED"; // Light blue
  ctx.beginPath();
  ctx.arc(0, -22 - 5, 1, 0, Math.PI * 2, false);
  ctx.fill();

  // Add some motion lines to show it's falling
  ctx.strokeStyle = "#CBD5E0";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-laptopWidth / 2 - 3, -22);
  ctx.lineTo(-laptopWidth / 2 - 1, -24);
  ctx.moveTo(-laptopWidth / 2 - 5, -20);
  ctx.lineTo(-laptopWidth / 2 - 3, -22);
  ctx.moveTo(laptopWidth / 2 + 3, -22);
  ctx.lineTo(laptopWidth / 2 + 1, -24);
  ctx.moveTo(laptopWidth / 2 + 5, -20);
  ctx.lineTo(laptopWidth / 2 + 3, -22);
  ctx.stroke();
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
    heroWidth: heroWidth,
    heroHeight: heroHeight,
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

// Color palette reference
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
