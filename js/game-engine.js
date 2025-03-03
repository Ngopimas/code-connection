import { gameStatus, config, DEBUG_MODE } from "./utils.js";
import {
  Platform,
  Stick,
  Server,
  CollectedGem,
  MissedGem,
  createPlatform,
  createServer,
  checkStickHitsPlatform,
} from "./game-objects.js";
import { Renderer } from "./renderer.js";
import { DebugManager } from "./debug.js";
import { InputHandler } from "./input-handler.js";

export class GameEngine {
  constructor() {
    // Get DOM elements
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.introductionElement = document.getElementById("introduction");
    this.perfectElement = document.getElementById("perfect");
    this.restartButton = document.getElementById("restart");
    this.recordeElement = document.getElementById("record");
    this.bestElement = document.getElementById("best-score");
    this.scoreElement = document.getElementById("score");

    // Set canvas dimensions
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Initialize game state with basic properties
    this.initializeGameStateBasics();

    // Create renderer first
    this.renderer = new Renderer(this.ctx, this);

    // Now complete the game state initialization
    this.completeGameStateInitialization();

    // Create debug manager
    this.debugManager = new DebugManager(this);

    // Create input handler
    this.inputHandler = new InputHandler(this);

    // Start the game loop
    window.requestAnimationFrame((timestamp) => this.animate(timestamp));
  }

  // Initialize basic game state properties
  initializeGameStateBasics() {
    // Game status
    this.phase = gameStatus.waiting;
    this.lastTimestamp = undefined;

    // Game data
    this.heroX = 0;
    this.heroY = 0;
    this.sceneOffset = 0;

    this.platforms = [];
    this.sticks = [];
    this.servers = [];
    this.bonusGemRotation = 0;
    this.missedGems = [];
    this.collectedGems = [];

    // Game score
    this.record = +localStorage.getItem("record") || 0;
    this.score = 0;

    // Game bonuses tracking
    this.consecutivePerfect = 0;
    this.debugMode = false;

    // Configuration
    this.DEBUG_MODE = DEBUG_MODE;
    this.perfectAreaSize = config.perfectAreaSize;
  }

  // Complete the game state initialization
  completeGameStateInitialization() {
    // Reset the game to set up initial platforms, sticks, etc.
    this.resetGame();
  }

  // Reset game
  resetGame() {
    // Reset game progress
    this.phase = gameStatus.waiting;
    this.lastTimestamp = undefined;
    this.sceneOffset = 0;
    this.score = 0;
    this.consecutivePerfect = 0;

    this.introductionElement.style.opacity = 1;
    this.perfectElement.style.opacity = 0;
    this.restartButton.style.display = "none";
    this.recordeElement.innerText = this.record;
    this.scoreElement.innerText = this.score;

    // The first platform is always the same
    // x + w has to match paddingX
    this.platforms = [new Platform(50, 50, 0)];
    Array.from({ length: 12 }, () =>
      this.platforms.push(createPlatform(this.platforms, this.debugMode))
    );

    this.sticks = [new Stick(this.platforms[0].x + this.platforms[0].w)];

    this.servers = [];
    // Calculate number of servers based on screen width to fill more of the desktop
    const screenWidthFactor = Math.ceil(window.innerWidth / config.canvasWidth);
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
      this.servers.push(new Server(x));
    }

    this.heroX =
      this.platforms[0].x + this.platforms[0].w - config.heroDistanceFromEdge;
    this.heroY = 0;

    this.missedGems = [];
    this.collectedGems = [];

    // Draw the initial state only if renderer exists
    if (this.renderer) {
      this.renderer.draw();
    }
  }

  // The main game loop
  animate(timestamp) {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      window.requestAnimationFrame((timestamp) => this.animate(timestamp));
      return;
    }

    // Animate the bonus gem rotation
    this.bonusGemRotation = (this.bonusGemRotation + 1) % 360;

    // Check if we need more servers and add them if necessary
    this.checkAndAddMoreServers();

    // Update missed gems animations
    this.updateMissedGems(timestamp - this.lastTimestamp);

    // Update collected gems animations
    this.updateCollectedGems(timestamp - this.lastTimestamp);

    switch (this.phase) {
      case gameStatus.waiting:
        this.renderer.draw();
        break;
      case gameStatus.coding: {
        this.sticks[this.sticks.length - 1].length +=
          (timestamp - this.lastTimestamp) / config.codingSpeed;
        break;
      }
      case gameStatus.deploying: {
        this.sticks[this.sticks.length - 1].rotation +=
          (timestamp - this.lastTimestamp) / config.deployingSpeed;

        if (this.sticks[this.sticks.length - 1].rotation > 90) {
          this.sticks[this.sticks.length - 1].rotation = 90;

          const [nextPlatform, perfectHit] = checkStickHitsPlatform(
            this.sticks[this.sticks.length - 1],
            this.platforms,
            this.debugMode ? this.perfectAreaSize * 2 : this.perfectAreaSize
          );

          if (nextPlatform) {
            // Increase score
            let pointsEarned = perfectHit ? 2 : 1;

            // Bonus for consecutive perfect hits
            if (perfectHit) {
              // Add a collected gem animation
              this.collectedGems.push(
                new CollectedGem(
                  nextPlatform.x + nextPlatform.w / 2,
                  config.canvasHeight -
                    config.platformHeight -
                    this.perfectAreaSize / 2,
                  this.perfectAreaSize,
                  this.debugMode
                )
              );

              this.consecutivePerfect++;
              if (this.consecutivePerfect > 1) {
                pointsEarned *= 1 + this.consecutivePerfect * 0.5; // Bonus multiplier increases with consecutive hits
                this.perfectElement.innerHTML = `CLEAN CODE STREAK!<br>x${this.consecutivePerfect} BONUS (${pointsEarned}pts)`;
              } else {
                this.perfectElement.innerHTML = "CLEAN CODE! x2 POINTS";
              }
              this.perfectElement.style.opacity = 1;
              setTimeout(() => (this.perfectElement.style.opacity = 0), 1500);
            } else {
              this.consecutivePerfect = 0;
            }

            this.score += pointsEarned;
            this.scoreElement.innerText = this.score;

            if (this.score > this.record) {
              localStorage.setItem("record", this.score);
              this.record = this.score;
              this.recordeElement.innerText = this.score;
            }

            this.platforms.push(createPlatform(this.platforms, this.debugMode));
            this.servers.push(createServer(this.servers));
          }

          this.phase = gameStatus.running;
        }
        break;
      }
      case gameStatus.running: {
        this.heroX += (timestamp - this.lastTimestamp) / config.runningSpeed;

        const [nextPlatform] = checkStickHitsPlatform(
          this.sticks[this.sticks.length - 1],
          this.platforms,
          this.debugMode ? this.perfectAreaSize * 2 : this.perfectAreaSize
        );

        if (nextPlatform) {
          // If hero will reach another platform then limit it's position at it's edge
          const maxHeroX =
            nextPlatform.x + nextPlatform.w - config.heroDistanceFromEdge;
          if (this.heroX > maxHeroX) {
            this.heroX = maxHeroX;
            this.phase = gameStatus.migrating;
          }
        } else {
          // If hero won't reach another platform then limit it's position at the end of the pole
          const maxHeroX =
            this.sticks[this.sticks.length - 1].x +
            this.sticks[this.sticks.length - 1].length +
            CharacterReference.heroWidth;
          if (this.heroX > maxHeroX) {
            this.heroX = maxHeroX;
            this.phase = gameStatus.crashing;
          }
        }
        break;
      }
      case gameStatus.migrating: {
        this.sceneOffset +=
          (timestamp - this.lastTimestamp) / config.migratingSpeed;

        const [nextPlatform] = checkStickHitsPlatform(
          this.sticks[this.sticks.length - 1],
          this.platforms,
          this.debugMode ? this.perfectAreaSize * 2 : this.perfectAreaSize
        );

        if (
          this.sceneOffset >
          nextPlatform.x + nextPlatform.w - config.paddingX
        ) {
          // Check if we missed the perfect hit on the current platform
          const perfectHitX = nextPlatform.x + nextPlatform.w / 2;
          const stickFarX =
            this.sticks[this.sticks.length - 1].x +
            this.sticks[this.sticks.length - 1].length;

          // If the stick didn't hit the perfect area, add a missed gem
          if (Math.abs(stickFarX - perfectHitX) > this.perfectAreaSize / 2) {
            this.missedGems.push(
              new MissedGem(
                perfectHitX,
                config.canvasHeight -
                  config.platformHeight -
                  this.perfectAreaSize / 2,
                this.perfectAreaSize,
                this.debugMode
              )
            );
          }

          // Add the next step
          this.sticks.push(new Stick(nextPlatform.x + nextPlatform.w));

          // Clean up old platforms and sticks
          this.cleanupOldObjects();

          this.phase = gameStatus.waiting;
        }
        break;
      }
      case gameStatus.crashing: {
        if (this.sticks[this.sticks.length - 1].rotation < 180)
          this.sticks[this.sticks.length - 1].rotation +=
            (timestamp - this.lastTimestamp) / config.deployingSpeed;

        this.heroY += (timestamp - this.lastTimestamp) / config.crashingSpeed;
        const maxHeroY =
          config.platformHeight +
          100 +
          (window.innerHeight - config.canvasHeight) / 2;
        if (this.heroY > maxHeroY) {
          this.restartButton.style.display = "grid";
          this.restartButton.innerHTML = this.debugMode
            ? "DEBUG COMPLETE<br>RESTART"
            : "DEBUG & RESTART";
          return;
        }
        break;
      }
      default:
        throw Error("Wrong phase");
    }

    this.renderer.draw();
    this.lastTimestamp = timestamp;
    window.requestAnimationFrame((timestamp) => this.animate(timestamp));
  }

  // Function to update missed gems animations
  updateMissedGems(deltaTime) {
    for (let i = this.missedGems.length - 1; i >= 0; i--) {
      // If the gem's update method returns true, it means the animation is complete
      if (this.missedGems[i].update(deltaTime)) {
        this.missedGems.splice(i, 1);
      }
    }
  }

  // Function to update collected gems animations
  updateCollectedGems(deltaTime) {
    for (let i = this.collectedGems.length - 1; i >= 0; i--) {
      // If the gem's update method returns true, it means the animation is complete
      if (this.collectedGems[i].update(deltaTime)) {
        this.collectedGems.splice(i, 1);
      }
    }
  }

  // Function to check if we need more servers and add them if necessary
  checkAndAddMoreServers() {
    // Calculate the visible area based on current sceneOffset
    const visibleAreaEnd =
      -this.sceneOffset + window.innerWidth / config.hill1Stretch;

    // Find the furthest server
    const lastServer =
      this.servers.length > 0 ? this.servers[this.servers.length - 1] : null;
    const furthestServerX = lastServer ? lastServer.x : 0;

    // If the furthest server is getting close to the visible area, add more servers
    if (!lastServer || furthestServerX < visibleAreaEnd + 500) {
      // Add fewer servers to ensure we have a reasonable amount ahead
      const serversToAdd = 5; // Reduced from 10
      for (let i = 0; i < serversToAdd; i++) {
        this.servers.push(createServer(this.servers));
      }
    }

    // Clean up servers that are far behind us to save memory
    const visibleAreaStart = -this.sceneOffset - 300;
    this.servers = this.servers.filter((server) => server.x > visibleAreaStart);

    // Clean up platforms that are far behind us to save memory
    // Keep at least the first 3 platforms to ensure game stability
    if (this.platforms.length > 3) {
      this.platforms = [
        ...this.platforms.slice(0, 3),
        ...this.platforms
          .slice(3)
          .filter((platform) => platform.x > visibleAreaStart),
      ];
    }

    // Clean up sticks that are far behind us to save memory
    // Always keep the last stick (current one) and at least 3 sticks for stability
    if (this.sticks.length > 3) {
      const lastStickIndex = this.sticks.length - 1;
      this.sticks = [
        ...this.sticks.slice(0, 3),
        ...this.sticks
          .slice(3, lastStickIndex)
          .filter((stick) => stick.x > visibleAreaStart),
        this.sticks[lastStickIndex], // Always keep the current stick
      ];
    }
  }

  // Add this new method to clean up old platforms and sticks
  cleanupOldObjects() {
    // Keep only the specified number of past platforms (plus the current one)
    // We always keep at least the first platform (index 0) and the platforms the hero needs to traverse
    const activeIndex = this.platforms.findIndex(
      (platform) => platform.x > this.sceneOffset + config.paddingX
    );

    if (activeIndex > 0) {
      // Calculate how many platforms to keep before the active one
      const keepCount = Math.min(activeIndex, config.keepPastPlatforms);
      const startIndex = Math.max(1, activeIndex - keepCount);

      // Remove platforms that are too far behind
      if (startIndex > 1) {
        this.platforms.splice(1, startIndex - 1);
      }
    }

    // Keep only the specified number of past sticks (plus the current one)
    // The current stick is always the last one in the array
    if (this.sticks.length > config.keepPastSticks + 1) {
      const removeCount = this.sticks.length - (config.keepPastSticks + 1);
      this.sticks.splice(0, removeCount);
    }
  }
}
