import { showNotification, config, DEBUG_MODE } from "./utils.js";

export class DebugManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.debugInfoElement = null;
    this.debugHintElement = null;
    this.debugButtonElement = null;
    this.debugControlsElement = null;

    // Track triple tap for debug mode easter egg
    this.tapCount = 0;
    this.lastTapTime = 0;
    this.tapTimeout = null;

    // Add the debug hint element
    this.addDebugModeHint();

    // If DEBUG_MODE is true, add the debug button
    if (DEBUG_MODE) {
      this.addDebugButton();
    }
  }

  // Add a subtle hint for the debug mode easter egg
  addDebugModeHint() {
    const hint = document.createElement("div");
    hint.id = "debug-hint";
    hint.style.position = "absolute";
    hint.style.top = "5px";
    hint.style.right = "5px";
    hint.style.width = "20px"; // Smaller size
    hint.style.height = "20px"; // Smaller size
    hint.style.borderRadius = "50%";
    hint.style.backgroundColor = "rgba(255, 255, 255, 0.05)"; // Much more transparent
    hint.style.border = "1px solid rgba(255, 255, 255, 0.1)"; // More subtle border
    hint.style.cursor = "default"; // Default cursor to not draw attention
    hint.style.zIndex = "999";
    hint.style.transition = "all 0.3s ease";

    // Remove the pulsing animation and question mark
    hint.innerHTML = "";

    document.body.appendChild(hint);
    this.debugHintElement = hint;

    // Track clicks/taps on the hint element itself
    let hintTapCount = 0;
    let hintLastTapTime = 0;
    let hintTapTimeout = null;

    // Function to handle tap/click on the hint
    const handleHintTap = (e) => {
      e.stopPropagation();
      e.preventDefault();

      const currentTime = new Date().getTime();

      // Reset tap count if it's been too long since the last tap
      if (currentTime - hintLastTapTime > 500) {
        hintTapCount = 0;
      }

      // Clear any existing timeout
      if (hintTapTimeout) {
        clearTimeout(hintTapTimeout);
      }

      hintTapCount++;
      hintLastTapTime = currentTime;

      // Subtle visual feedback for each tap - just a slight opacity change
      hint.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
      setTimeout(() => {
        hint.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
      }, 100);

      // Set a timeout to reset the tap count if the next tap doesn't come soon
      hintTapTimeout = setTimeout(() => {
        hintTapCount = 0;
      }, 500);

      // If we've reached 3 taps, toggle debug mode
      if (hintTapCount >= 3) {
        this.toggleDebugMode();
        hintTapCount = 0; // Reset tap count after activation
      }
    };

    // Make the hint slightly more visible when hovered, but still subtle
    hint.addEventListener("mouseover", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      hint.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    });

    hint.addEventListener("mouseout", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      hint.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
    });

    // Add click/tap handlers directly to the hint element
    hint.addEventListener("mousedown", handleHintTap);
    hint.addEventListener("touchstart", handleHintTap);
    hint.addEventListener("touchend", function (e) {
      e.stopPropagation();
      e.preventDefault();
    });
  }

  // Add debug button
  addDebugButton() {
    // Create the debug button
    const debugButton = document.createElement("button");
    debugButton.id = "debug-button";
    debugButton.textContent = "Debug";
    debugButton.style.position = "absolute";
    debugButton.style.top = "10px";
    debugButton.style.right = "10px";
    debugButton.style.backgroundColor = "#2D3748";
    debugButton.style.color = "#E2E8F0";
    debugButton.style.border = "none";
    debugButton.style.borderRadius = "4px";
    debugButton.style.padding = "5px 10px";
    debugButton.style.fontFamily =
      '"JetBrains Mono", "Fira Code", Consolas, monospace';
    debugButton.style.cursor = "pointer";
    debugButton.style.zIndex = "1000";
    debugButton.style.opacity = "0.7";
    debugButton.style.transition = "opacity 0.2s ease";

    // Add hover effect
    debugButton.addEventListener("mouseenter", () => {
      debugButton.style.opacity = "1";
    });
    debugButton.addEventListener("mouseleave", () => {
      debugButton.style.opacity = "0.7";
    });

    // Add click event
    debugButton.addEventListener("click", () => {
      this.toggleDebugMode();
    });

    document.body.appendChild(debugButton);
    this.debugButtonElement = debugButton;

    // Update the button state
    this.updateDebugButtonState();
  }

  // Update debug button state
  updateDebugButtonState() {
    if (!this.debugButtonElement) return;

    if (this.gameState.debugMode) {
      this.debugButtonElement.style.backgroundColor = "#68D391";
      this.debugButtonElement.style.color = "#1A202C";
    } else {
      this.debugButtonElement.style.backgroundColor = "#2D3748";
      this.debugButtonElement.style.color = "#E2E8F0";
    }
  }

  // Toggle debug mode
  toggleDebugMode() {
    this.gameState.debugMode = !this.gameState.debugMode;
    this.updateDebugButtonState();

    if (this.gameState.debugMode) {
      this.createDebugInfoPanel();
      this.createDebugControls();
      showNotification("Debug Mode Enabled", "#68D391");
    } else {
      this.removeDebugInfoPanel();
      this.removeDebugControls();
      showNotification("Debug Mode Disabled", "#FC8181");
    }
  }

  // Create debug info panel
  createDebugInfoPanel() {
    if (this.debugInfoElement) return;

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

    this.debugInfoElement = debugInfo;
    this.updateDebugInfo();
  }

  // Create debug controls panel
  createDebugControls() {
    if (this.debugControlsElement) return;

    // Create controls container
    const controls = document.createElement("div");
    controls.id = "debug-controls";
    controls.style.position = "absolute";
    controls.style.top = "50px";
    controls.style.right = "10px";
    controls.style.backgroundColor = "rgba(26, 32, 44, 0.8)";
    controls.style.padding = "10px";
    controls.style.borderRadius = "4px";
    controls.style.fontFamily =
      '"JetBrains Mono", "Fira Code", Consolas, monospace';
    controls.style.fontSize = "12px";
    controls.style.color = "#E2E8F0";
    controls.style.zIndex = "1000";
    controls.style.borderLeft = "3px solid #68D391";
    document.body.appendChild(controls);

    // Add debug info title
    const debugTitle = document.createElement("div");
    debugTitle.textContent = "Debug Controls";
    debugTitle.style.fontWeight = "bold";
    debugTitle.style.marginBottom = "10px";
    debugTitle.style.textAlign = "center";
    controls.appendChild(debugTitle);

    this.debugControlsElement = controls;
  }

  // Remove debug info panel
  removeDebugInfoPanel() {
    if (this.debugInfoElement) {
      this.debugInfoElement.remove();
      this.debugInfoElement = null;
    }
  }

  // Remove debug controls panel
  removeDebugControls() {
    if (this.debugControlsElement) {
      this.debugControlsElement.remove();
      this.debugControlsElement = null;
    }
  }

  // Update debug info
  updateDebugInfo() {
    if (!this.gameState.debugMode || !this.debugInfoElement) return;

    // Find the current platform (where the stick is positioned)
    const currentPlatform = this.gameState.platforms.find(
      (platform) =>
        platform.x + platform.w ===
        this.gameState.sticks[this.gameState.sticks.length - 1].x
    );

    // Find the next platform (the one we're trying to reach)
    const nextPlatform = this.gameState.platforms.find(
      (platform) =>
        platform.x > this.gameState.sticks[this.gameState.sticks.length - 1].x
    );

    const distanceToNext = nextPlatform
      ? (
          nextPlatform.x -
          this.gameState.sticks[this.gameState.sticks.length - 1].x
        ).toFixed(1)
      : "N/A";

    // Calculate the perfect hit area range based on the current perfectAreaSize
    // In debug mode, the perfect area is twice as large
    const perfectSize = this.gameState.debugMode
      ? this.gameState.perfectAreaSize * 2
      : this.gameState.perfectAreaSize;

    let perfectHitInfo = "N/A";
    if (nextPlatform) {
      const perfectCenter = nextPlatform.x + nextPlatform.w / 2;
      const perfectStart = (perfectCenter - perfectSize / 2).toFixed(1);
      const perfectEnd = (perfectCenter + perfectSize / 2).toFixed(1);

      // Calculate the required stick length to hit the perfect center
      const requiredLength = (
        perfectCenter -
        this.gameState.sticks[this.gameState.sticks.length - 1].x
      ).toFixed(1);

      perfectHitInfo = `${perfectStart} to ${perfectEnd} (center: ${perfectCenter.toFixed(
        1
      )})`;
    }

    // Add performance monitoring
    const platformCount = this.gameState.platforms.length;
    const stickCount = this.gameState.sticks.length;
    const serverCount = this.gameState.servers.length;
    const totalObjects = platformCount + stickCount + serverCount;

    this.debugInfoElement.innerHTML = `
      <div>Game Phase: ${this.gameState.phase}</div>
      <div>Stick Length: ${this.gameState.sticks[
        this.gameState.sticks.length - 1
      ].length.toFixed(1)}</div>
      <div>Current Platform: #${
        currentPlatform ? currentPlatform.id : "N/A"
      }</div>
      <div>Next Platform: #${
        nextPlatform ? nextPlatform.id : "N/A"
      } (${distanceToNext})</div>
      <div>Perfect Center: ${
        nextPlatform
          ? (
              nextPlatform.x +
              nextPlatform.w / 2 -
              this.gameState.sticks[this.gameState.sticks.length - 1].x
            ).toFixed(1)
          : "N/A"
      }</div>
      <div style="margin-top: 10px; border-top: 1px solid #4A5568; padding-top: 5px;">
        <div>Platforms: ${platformCount}</div>
        <div>Sticks: ${stickCount}</div>
        <div>Servers: ${serverCount}</div>
        <div>Total Objects: ${totalObjects}</div>
      </div>
    `;

    requestAnimationFrame(() => this.updateDebugInfo());
  }
}
