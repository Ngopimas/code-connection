import { gameStatus } from "./utils.js";

export class InputHandler {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Prevent all default touch behaviors on the canvas
    this.gameEngine.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.play();
    });

    this.gameEngine.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
    });

    this.gameEngine.canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.stop();
    });

    this.gameEngine.canvas.addEventListener("touchcancel", (e) => {
      e.preventDefault();
    });

    // Mouse events
    document.addEventListener("mousedown", (e) => {
      e.preventDefault();
      // Only trigger play on left mouse button (button 0)
      if (e.button === 0) {
        this.play();
      }
    });

    document.addEventListener("mouseup", (e) => {
      this.stop();
    });

    // Keyboard events
    document.addEventListener("keydown", (e) => {
      if (e.key == " ") {
        e.preventDefault();

        // If the restart button is visible (hero has crashed), restart the game
        if (this.gameEngine.restartButton.style.display === "grid") {
          this.gameEngine.resetGame();
          return;
        }

        // Otherwise, play the game (same behavior as left click)
        if (this.gameEngine.phase == gameStatus.waiting) {
          this.play();
        } else if (this.gameEngine.phase == gameStatus.coding) {
          // If already coding (stretching), release on space up
          this.stop();
        }
      }
    });

    // Add space key up event to release the stick
    document.addEventListener("keyup", (e) => {
      if (e.key == " " && this.gameEngine.phase == gameStatus.coding) {
        this.stop();
      }
    });

    // Prevent double-tap zoom specifically
    document.addEventListener("dblclick", (e) => {
      e.preventDefault();
      return false;
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      this.gameEngine.canvas.width = window.innerWidth;
      this.gameEngine.canvas.height = window.innerHeight;
      // Update background elements when window size changes
      this.gameEngine.renderer.updateBackgroundElements();
      this.gameEngine.renderer.draw();
    });

    // Restart button events
    this.gameEngine.restartButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.gameEngine.resetGame();
      this.gameEngine.restartButton.style.display = "none";
    });

    // Add touch event handlers for the restart button
    this.gameEngine.restartButton.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    this.gameEngine.restartButton.addEventListener("touchend", (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.gameEngine.resetGame();
      this.gameEngine.restartButton.style.display = "none";
    });
  }

  play() {
    if (this.gameEngine.phase == gameStatus.waiting) {
      this.gameEngine.lastTimestamp = undefined;
      this.gameEngine.introductionElement.style.opacity = 0;
      this.gameEngine.phase = gameStatus.coding;
      window.requestAnimationFrame((timestamp) =>
        this.gameEngine.animate(timestamp)
      );
    }
  }

  stop() {
    if (this.gameEngine.phase == gameStatus.coding) {
      this.gameEngine.phase = gameStatus.deploying;
    }
  }
}
