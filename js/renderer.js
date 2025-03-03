import { config, getHillY, getServerY } from "./utils.js";

export class Renderer {
  constructor(ctx, gameState) {
    this.ctx = ctx;
    this.gameState = gameState;

    // Pre-generated background elements to prevent flickering
    this.binaryPattern = [];
    this.hillNodes = [];
    this.circuitLines = [];

    // Initialize background elements
    this.generateBackgroundElements();
  }

  // Generate stable background elements
  generateBackgroundElements() {
    // Pre-generate binary pattern
    this.binaryPattern = [];
    for (let x = 0; x < Math.ceil(window.innerWidth / 20) + 1; x++) {
      this.binaryPattern[x] = [];
      for (let y = 0; y < Math.ceil(window.innerHeight / 15) + 1; y++) {
        this.binaryPattern[x][y] = Math.random() > 0.5 ? "1" : "0";
      }
    }

    // Pre-generate hill nodes
    this.hillNodes = [];
    for (let i = 0; i < window.innerWidth; i += 80) {
      if (Math.random() > 0.7) {
        this.hillNodes.push(i);
      }
    }

    // Pre-generate circuit lines
    this.circuitLines = [];
    const segments = 5;
    const width = window.innerWidth / segments;

    for (let i = 0; i < segments; i++) {
      const x1 = i * width;
      const x2 = (i + 1) * width;
      const randomOffset1 = 10 + Math.random() * 20;
      const randomOffset2 = 10 + Math.random() * 20;

      this.circuitLines.push({
        x1,
        x2,
        randomOffset1,
        randomOffset2,
      });
    }
  }

  // Smoothly update background elements when window size changes
  updateBackgroundElements() {
    // Get current dimensions
    const currentPatternWidth = this.binaryPattern.length;
    const currentPatternHeight = this.binaryPattern[0]
      ? this.binaryPattern[0].length
      : 0;

    // Calculate new dimensions
    const newPatternWidth = Math.ceil(window.innerWidth / 20) + 1;
    const newPatternHeight = Math.ceil(window.innerHeight / 15) + 1;

    // Update binary pattern - preserve existing values and only add new ones
    for (let x = 0; x < newPatternWidth; x++) {
      if (!this.binaryPattern[x]) {
        this.binaryPattern[x] = [];
      }

      for (let y = 0; y < newPatternHeight; y++) {
        if (this.binaryPattern[x][y] === undefined) {
          this.binaryPattern[x][y] = Math.random() > 0.5 ? "1" : "0";
        }
      }
    }

    // Only add new hill nodes if window width increased
    if (window.innerWidth > this.hillNodes[this.hillNodes.length - 1] + 80) {
      for (
        let i = this.hillNodes[this.hillNodes.length - 1] + 80;
        i < window.innerWidth;
        i += 80
      ) {
        if (Math.random() > 0.7) {
          this.hillNodes.push(i);
        }
      }
    }

    // Update circuit lines to match new window width
    const segments = 5;
    const width = window.innerWidth / segments;

    // Preserve existing circuit lines but adjust their positions
    for (let i = 0; i < segments; i++) {
      if (this.circuitLines[i]) {
        this.circuitLines[i].x1 = i * width;
        this.circuitLines[i].x2 = (i + 1) * width;
      } else {
        const randomOffset1 = 10 + Math.random() * 20;
        const randomOffset2 = 10 + Math.random() * 20;

        this.circuitLines.push({
          x1: i * width,
          x2: (i + 1) * width,
          randomOffset1,
          randomOffset2,
        });
      }
    }
  }

  // Main draw function
  draw() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.drawBackground();

    // Center main canvas area to the middle of the screen
    this.ctx.translate(
      (window.innerWidth - config.canvasWidth) / 2 - this.gameState.sceneOffset,
      (window.innerHeight - config.canvasHeight) / 2
    );

    // Draw scene
    this.drawPlatforms();
    this.drawHero();
    this.drawSticks();
    this.drawMissedGems();
    this.drawCollectedGems();

    // Restore transformation
    this.ctx.restore();
  }

  // Draw background
  drawBackground() {
    // Draw tech-themed sky
    var gradient = this.ctx.createLinearGradient(0, 0, 0, window.innerHeight);
    gradient.addColorStop(0, "#1A365D"); // Dark blue
    gradient.addColorStop(1, "#2D3748"); // Dark blue-grey
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // Add binary pattern to background using pre-generated pattern
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    this.ctx.font = "10px monospace";

    // Use pre-generated binary pattern
    const patternWidth = Math.ceil(window.innerWidth / 20);
    const patternHeight = Math.ceil(window.innerHeight / 15);

    for (let x = 0; x < patternWidth; x++) {
      for (let y = 0; y < patternHeight; y++) {
        if (this.binaryPattern[x] && this.binaryPattern[x][y]) {
          this.ctx.fillText(this.binaryPattern[x][y], x * 20, y * 15);
        }
      }
    }

    // Draw circuit-like hills
    this.drawHill(
      config.hill1BaseHeight,
      config.hill1Amplitude,
      config.hill1Stretch,
      "#2B6CB0"
    ); // Medium blue

    this.drawHill(
      config.hill2BaseHeight,
      config.hill2Amplitude,
      config.hill2Stretch,
      "#2C5282"
    ); // Darker blue

    // Draw servers/computers towers
    this.gameState.servers.forEach((server) => this.drawServer(server));
  }

  // Draw a hill (a shape under a stretched out sinus wave)
  drawHill(baseHeight, amplitude, stretch, color) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, window.innerHeight);
    this.ctx.lineTo(
      0,
      getHillY(
        0,
        baseHeight,
        amplitude,
        stretch,
        this.gameState.sceneOffset,
        config.backgroundSpeedMultiplier
      )
    );

    // Add circuit patterns on the hills
    for (let i = 0; i < window.innerWidth; i++) {
      this.ctx.lineTo(
        i,
        getHillY(
          i,
          baseHeight,
          amplitude,
          stretch,
          this.gameState.sceneOffset,
          config.backgroundSpeedMultiplier
        )
      );

      // Add pre-generated circuit nodes at intervals
      if (this.hillNodes.includes(i)) {
        const y = getHillY(
          i,
          baseHeight,
          amplitude,
          stretch,
          this.gameState.sceneOffset,
          config.backgroundSpeedMultiplier
        );
        this.ctx.lineTo(i, y - 5);
        this.ctx.lineTo(i + 10, y - 5);
        this.ctx.lineTo(i + 10, y);
      }
    }

    this.ctx.lineTo(window.innerWidth, window.innerHeight);
    this.ctx.fillStyle = color;
    this.ctx.fill();

    // Add circuit lines using pre-generated positions
    this.ctx.strokeStyle = "rgba(79, 209, 197, 0.3)"; // Light teal with transparency
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    this.circuitLines.forEach((line) => {
      const x1 = line.x1;
      const x2 = line.x2;
      const y1 =
        getHillY(
          x1,
          baseHeight,
          amplitude,
          stretch,
          this.gameState.sceneOffset,
          config.backgroundSpeedMultiplier
        ) + line.randomOffset1;
      const y2 =
        getHillY(
          x2,
          baseHeight,
          amplitude,
          stretch,
          this.gameState.sceneOffset,
          config.backgroundSpeedMultiplier
        ) + line.randomOffset2;

      // Horizontal line
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x1 + (x2 - x1) * 0.4, y1);

      // Vertical connector
      this.ctx.moveTo(x1 + (x2 - x1) * 0.4, y1);
      this.ctx.lineTo(x1 + (x2 - x1) * 0.4, y2);

      // Horizontal again
      this.ctx.moveTo(x1 + (x2 - x1) * 0.4, y2);
      this.ctx.lineTo(x2, y2);
    });

    this.ctx.stroke();
  }

  // Draw server
  drawServer(server) {
    this.ctx.save();
    this.ctx.translate(
      (-this.gameState.sceneOffset * config.backgroundSpeedMultiplier +
        server.x) *
        config.hill1Stretch,
      getServerY(server.x, config.hill1BaseHeight, config.hill1Amplitude)
    );

    // Draw server/computer tower
    const towerWidth = 14;
    const towerHeight = 24;

    // Tower body
    this.ctx.fillStyle = server.color;
    this.ctx.fillRect(-towerWidth / 2, -towerHeight, towerWidth, towerHeight);

    // Server case outline
    this.ctx.strokeStyle = "#A0AEC0";
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(-towerWidth / 2, -towerHeight, towerWidth, towerHeight);

    // Server rack lines
    const rackLines = 5;
    const rackHeight = towerHeight / rackLines;

    for (let i = 0; i < rackLines; i++) {
      // Server slot
      this.ctx.fillStyle = "#1A202C"; // Darker shade for server slots
      this.ctx.fillRect(
        -towerWidth / 2 + 1,
        -towerHeight + i * rackHeight + 1,
        towerWidth - 2,
        rackHeight - 2
      );

      // Add rack mount points
      this.ctx.fillStyle = "#718096";
      this.ctx.fillRect(
        -towerWidth / 2 + 2,
        -towerHeight + i * rackHeight + rackHeight / 2 - 1,
        2,
        2
      );
      this.ctx.fillRect(
        towerWidth / 2 - 4,
        -towerHeight + i * rackHeight + rackHeight / 2 - 1,
        2,
        2
      );
    }

    // Draw indicator lights
    if (server.indicatorLights) {
      server.indicatorLights.forEach((light) => {
        this.ctx.fillStyle = light.color;
        this.ctx.fillRect(
          -towerWidth / 2 + towerWidth - 4,
          -towerHeight + light.rack * rackHeight + rackHeight / 2 - 1,
          2,
          2
        );
      });
    }

    this.ctx.restore();
  }

  // Draw platforms
  drawPlatforms() {
    this.gameState.platforms.forEach(({ x, w, id }) => {
      // Create a gradient for the platform base
      const platformGradient = this.ctx.createLinearGradient(
        x,
        config.canvasHeight - config.platformHeight,
        x,
        config.canvasHeight
      );
      platformGradient.addColorStop(0, "#1A365D"); // Dark blue at top
      platformGradient.addColorStop(0.4, "#2B4F76"); // Medium blue
      platformGradient.addColorStop(1, "#1E3A5F"); // Slightly darker blue at bottom

      // Draw platform with gradient
      this.ctx.fillStyle = platformGradient;
      this.ctx.fillRect(
        x,
        config.canvasHeight - config.platformHeight,
        w,
        config.platformHeight + (window.innerHeight - config.canvasHeight) / 2
      );

      // Add a subtle top edge highlight
      this.ctx.fillStyle = "rgba(99, 179, 237, 0.15)"; // Very subtle blue highlight
      this.ctx.fillRect(x, config.canvasHeight - config.platformHeight, w, 1);

      // Display platform ID when in debug mode
      if (this.gameState.debugMode && id !== undefined) {
        this.ctx.fillStyle = "#FC8181"; // Red color for debug info
        this.ctx.font = "bold 14px monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          `#${id}`,
          x + w / 2,
          config.canvasHeight - config.platformHeight - 10
        );
      }

      // Add code-like decoration to platforms
      const blockHeight = 20;
      const numBlocks = Math.floor(w / 30);

      for (let i = 0; i < numBlocks; i++) {
        const blockWidth = Math.min(25, w / numBlocks - 5);
        const blockX = x + i * (w / numBlocks) + 2.5;

        // Code block background with subtle gradient
        const codeBlockGradient = this.ctx.createLinearGradient(
          blockX,
          config.canvasHeight - config.platformHeight + 10,
          blockX,
          config.canvasHeight - config.platformHeight + 10 + blockHeight
        );
        codeBlockGradient.addColorStop(0, "#1A202C"); // Darker shade for code block
        codeBlockGradient.addColorStop(1, "#0D1117"); // Even darker at bottom

        this.ctx.fillStyle = codeBlockGradient;
        this.ctx.fillRect(
          blockX,
          config.canvasHeight - config.platformHeight + 10,
          blockWidth,
          blockHeight
        );

        // Add subtle border to code blocks
        this.ctx.strokeStyle = "rgba(99, 179, 237, 0.3)"; // Light blue border
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(
          blockX,
          config.canvasHeight - config.platformHeight + 10,
          blockWidth,
          blockHeight
        );

        // Code line (simplified)
        this.ctx.fillStyle = "#81E6D9"; // Teal color for code
        this.ctx.fillRect(
          blockX + 3,
          config.canvasHeight - config.platformHeight + 13,
          blockWidth * 0.7,
          2
        );

        this.ctx.fillStyle = "#F687B3"; // Pink color for code
        this.ctx.fillRect(
          blockX + 3,
          config.canvasHeight - config.platformHeight + 17,
          blockWidth * 0.5,
          2
        );

        // Function brackets
        if (i === 0) {
          this.ctx.fillStyle = "#F6E05E"; // Yellow for brackets
          this.ctx.font = "15px monospace";
          this.ctx.fillText(
            "{",
            blockX - 2,
            config.canvasHeight - config.platformHeight + 24
          );
        }
        if (i === numBlocks - 1) {
          this.ctx.fillStyle = "#F6E05E"; // Yellow for brackets
          this.ctx.font = "15px monospace";
          this.ctx.fillText(
            "}",
            blockX + blockWidth - 5,
            config.canvasHeight - config.platformHeight + 24
          );
        }
      }

      // Draw perfect area only if hero did not yet reach the platform
      if (
        this.gameState.sticks.length > 0 &&
        this.gameState.sticks[this.gameState.sticks.length - 1].x < x
      ) {
        // In debug mode, make the perfect area larger and more visible
        const perfectSize = this.gameState.debugMode
          ? config.perfectAreaSize * 2
          : config.perfectAreaSize;

        // Draw the code gem bonus object
        this.drawCodeGem(
          x + w / 2,
          config.canvasHeight - config.platformHeight - perfectSize / 2,
          perfectSize,
          this.gameState.debugMode
        );

        // In debug mode, add a vertical guide line
        if (this.gameState.debugMode) {
          this.ctx.strokeStyle = "rgba(252, 129, 129, 0.5)"; // Semi-transparent red
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([5, 5]); // Dashed line
          this.ctx.beginPath();
          this.ctx.moveTo(x + w / 2, 0);
          this.ctx.lineTo(x + w / 2, config.canvasHeight);
          this.ctx.stroke();
          this.ctx.setLineDash([]); // Reset to solid line
        }
      }
    });
  }

  // Draw the code gem bonus object
  drawCodeGem(x, y, size, isDebugMode) {
    const gemSize = size * 1.5; // Make the gem slightly larger than the perfect area

    this.ctx.save();
    this.ctx.translate(x, y);

    // Apply floating animation
    const floatOffset = Math.sin(Date.now() / 300) * 3;
    this.ctx.translate(0, floatOffset);

    // Apply rotation animation
    this.ctx.rotate((Math.PI / 180) * this.gameState.bonusGemRotation);

    // Create glow effect
    this.ctx.shadowColor = isDebugMode
      ? "rgba(252, 129, 129, 0.8)"
      : "rgba(56, 178, 172, 0.8)";
    this.ctx.shadowBlur = 15;

    // Draw the gem shape (hexagon)
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const gemX = Math.cos(angle) * (gemSize / 2);
      const gemY = Math.sin(angle) * (gemSize / 2);

      if (i === 0) {
        this.ctx.moveTo(gemX, gemY);
      } else {
        this.ctx.lineTo(gemX, gemY);
      }
    }
    this.ctx.closePath();

    // Create gradient fill
    const gemGradient = this.ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      gemSize / 2
    );

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

    this.ctx.fillStyle = gemGradient;
    this.ctx.fill();

    // Add code symbol inside the gem
    this.ctx.fillStyle = isDebugMode ? "#FFFFFF" : "#E6FFFA";
    this.ctx.font = `${gemSize * 0.4}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("</>", 0, 0);

    // Add shine effect
    this.ctx.beginPath();
    this.ctx.moveTo(-gemSize / 4, -gemSize / 4);
    this.ctx.lineTo(-gemSize / 8, -gemSize / 8);
    this.ctx.lineTo(-gemSize / 16, -gemSize / 4);
    this.ctx.closePath();
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    this.ctx.fill();

    this.ctx.restore();
  }

  // Draw hero
  drawHero() {
    // Use the shared character reference implementation
    CharacterReference.drawCharacter(
      this.ctx,
      this.gameState.phase,
      this.gameState.heroX,
      this.gameState.heroY,
      config.canvasHeight,
      config.platformHeight
    );
  }

  // Draw sticks
  drawSticks() {
    this.gameState.sticks.forEach((stick) => {
      this.ctx.save();

      // Move the anchor point to the start of the stick and rotate
      this.ctx.translate(stick.x, config.canvasHeight - config.platformHeight);
      this.ctx.rotate((Math.PI / 180) * stick.rotation);

      // Draw stick as a connection/pipe
      const stickWidth = 3;

      // Gradient for stick
      const gradient = this.ctx.createLinearGradient(0, 0, 0, -stick.length);
      gradient.addColorStop(0, "#4299E1"); // Blue
      gradient.addColorStop(1, "#63B3ED"); // Lighter blue

      // Main stick
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(-stickWidth / 2, 0, stickWidth, -stick.length);

      // Connection nodes
      const numNodes = Math.floor(stick.length / 15);
      for (let i = 1; i <= numNodes; i++) {
        this.ctx.beginPath();
        this.ctx.fillStyle = "#CBD5E0"; // Light grey for nodes
        this.ctx.arc(0, -i * 15, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Restore transformations
      this.ctx.restore();
    });
  }

  // Draw missed gems
  drawMissedGems() {
    this.gameState.missedGems.forEach((gem) => {
      this.drawMissedGem(gem);
    });
  }

  // Draw a missed gem
  drawMissedGem(gem) {
    this.ctx.save();
    this.ctx.translate(gem.x, gem.y);

    // Apply scale animation
    this.ctx.scale(gem.scale, gem.scale);

    // Set opacity
    this.ctx.globalAlpha = gem.opacity;

    // Draw the gem shape (hexagon)
    const gemSize = gem.size * 1.5;
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const gemX = Math.cos(angle) * (gemSize / 2);
      const gemY = Math.sin(angle) * (gemSize / 2);

      if (i === 0) {
        this.ctx.moveTo(gemX, gemY);
      } else {
        this.ctx.lineTo(gemX, gemY);
      }
    }
    this.ctx.closePath();

    // Create gradient fill with slightly desaturated colors
    const gemGradient = this.ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      gemSize / 2
    );

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

    this.ctx.fillStyle = gemGradient;
    this.ctx.fill();

    // Add code symbol inside the gem
    this.ctx.fillStyle = gem.isDebugMode ? "#FFFFFF" : "#E6FFFA";
    this.ctx.font = `${gemSize * 0.4}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("</>", 0, 0);

    this.ctx.restore();
  }

  // Draw collected gems
  drawCollectedGems() {
    this.gameState.collectedGems.forEach((gem) => {
      this.drawCollectedGem(gem);
    });
  }

  // Draw a collected gem
  drawCollectedGem(gem) {
    this.ctx.save();
    this.ctx.translate(gem.x, gem.y);

    // Apply scale and rotation animations
    this.ctx.scale(gem.scale, gem.scale);
    this.ctx.rotate((Math.PI / 180) * gem.rotation);

    // Set opacity
    this.ctx.globalAlpha = gem.opacity;

    // Create glow effect
    this.ctx.shadowColor = gem.isDebugMode
      ? "rgba(252, 129, 129, 0.8)"
      : "rgba(56, 178, 172, 0.8)";
    this.ctx.shadowBlur = 15;

    // Draw the gem shape (hexagon)
    const gemSize = gem.size * 1.5;
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const gemX = Math.cos(angle) * (gemSize / 2);
      const gemY = Math.sin(angle) * (gemSize / 2);

      if (i === 0) {
        this.ctx.moveTo(gemX, gemY);
      } else {
        this.ctx.lineTo(gemX, gemY);
      }
    }
    this.ctx.closePath();

    // Create gradient fill with brighter colors
    const gemGradient = this.ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      gemSize / 2
    );

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

    this.ctx.fillStyle = gemGradient;
    this.ctx.fill();

    // Add code symbol inside the gem
    this.ctx.fillStyle = gem.isDebugMode ? "#FFFFFF" : "#E6FFFA";
    this.ctx.font = `${gemSize * 0.4}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("</>", 0, 0);

    // Add shine effect
    this.ctx.beginPath();
    this.ctx.moveTo(-gemSize / 4, -gemSize / 4);
    this.ctx.lineTo(-gemSize / 8, -gemSize / 8);
    this.ctx.lineTo(-gemSize / 16, -gemSize / 4);
    this.ctx.closePath();
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    this.ctx.fill();

    this.ctx.restore();
  }
}
