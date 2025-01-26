// script.js
window.addEventListener("load", () => {
    // DOM References
    const gameContainer = document.getElementById("game-container");
    const backgroundImg = document.getElementById("level-background");
    const mainCharacterEl = document.getElementById("main-character");
    const gameObjectsEl = document.getElementById("game-objects");
  
    // HUD references
    const healthBarEl = document.getElementById("health-bar");
    const scoreEl = document.getElementById("score");
    const levelEl = document.getElementById("level-display");
    const timeLeftEl = document.getElementById("time-left");
  
    // Game Data
    let isGameOver = false;
    let isPaused = false;  // pause between levels
    let level = 1;
    let score = 0;
  
    // Health Bar
    const maxPlayerHealth = 100;
    let playerHealth = maxPlayerHealth;
  
    // Each level = 60s, must reach level * 1000 points
    let timeLeft = 60;
  
    // Player (Plane)
    const plane = {
      x: window.innerWidth / 2 - 50,
      y: window.innerHeight - 150,
      width: 100,
      height: 100,
      speed: 8
    };
  
    // Bullets
    let bullets = [];
    const bulletBaseSpeed = 10;
    let powerLevel = 1;  // bonus-based multi-shot
  
    // Teddies (enemies)
    let teddies = [];
    let teddySpeed = 3;
    let teddySpawnInterval = 1500; 
    let teddiesPerSpawn = 1;
  
    // Bonus (mc.jpeg)
    let bonuses = [];
    let bonusSpeed = 3;
    let bonusSpawnInterval = 4000;
  
    // Key Controls
    const keys = { left: false, right: false, up: false, down: false, space: false };
  
    // =============================
    // INIT
    // =============================
    function init() {
      updateLevelUI(level);
      updateScoreUI(score);
      updateHealthUI(playerHealth);
      updateTimeLeftUI(timeLeft);
      updatePlanePosition();
      setBackground(level);
  
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);
  
      // Main loop
      requestAnimationFrame(gameLoop);
  
      // Spawn Teddies
      setInterval(() => {
        if (!isGameOver && !isPaused) {
          for (let i = 0; i < teddiesPerSpawn; i++) {
            spawnTeddy();
          }
        }
      }, teddySpawnInterval);
  
      // Spawn bonuses
      setInterval(() => {
        if (!isGameOver && !isPaused) {
          spawnBonus();
        }
      }, bonusSpawnInterval);
  
      // 60-second timer for each level
      let levelTimer = setInterval(() => {
        if (isGameOver) {
          clearInterval(levelTimer);
          return;
        }
        if (!isPaused) {
          timeLeft--;
          updateTimeLeftUI(timeLeft);
  
          if (timeLeft <= 0) {
            if (score < level * 1000) {
              gameOver(`Time's up! Needed ${level * 1000} but got ${score}.`);
            } else {
              endLevel();
            }
          }
        }
      }, 1000);
    }
  
    // =============================
    // GAME LOOP
    // =============================
    function gameLoop() {
      if (isGameOver) return;
  
      if (!isPaused) {
        movePlane();
        updateBullets();
        updateTeddies();
        updateBonuses();
        checkCollisions();
  
        if (score >= level * 1000) {
          endLevel();
        }
      }
  
      requestAnimationFrame(gameLoop);
    }
  
    // =============================
    // END LEVEL (Pause, Countdown)
    // =============================
    function endLevel() {
      if (level >= 10) {
        gameOver(`You cleared Level 10! You win!`);
        return;
      }
      isPaused = true;
      showLevelTransitionOverlay(level, level + 1);
    }
  
    function showLevelTransitionOverlay(currentLevel, nextLevel) {
      const overlay = document.createElement("div");
      overlay.className = "overlay visible";
  
      const messageBox = document.createElement("div");
      messageBox.className = "overlay-message";
  
      const title = document.createElement("h1");
      title.innerText = `Level ${currentLevel} Passed Successfully!`;
  
      const countdownText = document.createElement("h2");
      countdownText.innerText = `Level ${nextLevel} starts in 3 seconds...`;
  
      messageBox.appendChild(title);
      messageBox.appendChild(countdownText);
      overlay.appendChild(messageBox);
      gameContainer.appendChild(overlay);
  
      let countdown = 3;
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          startNextLevel();
        } else {
          countdownText.innerText = `Level ${nextLevel} starts in ${countdown} seconds...`;
        }
      }, 1000);
    }
  
    function startNextLevel() {
      level++;
      updateLevelUI(level);
      timeLeft = 60;
      updateTimeLeftUI(timeLeft);
  
      teddySpeed += 1;
      teddiesPerSpawn++;
      if (teddySpawnInterval > 300) {
        teddySpawnInterval -= 100;
      }
      if (bonusSpawnInterval > 1000) {
        bonusSpawnInterval -= 100;
      }
      setBackground(level);
      isPaused = false;
    }
  
    // =============================
    // PLAYER MOVEMENT
    // =============================
    function movePlane() {
      if (keys.left) {
        plane.x -= plane.speed;
        if (plane.x < 0) plane.x = 0;
      }
      if (keys.right) {
        plane.x += plane.speed;
        const maxX = window.innerWidth - plane.width;
        if (plane.x > maxX) plane.x = maxX;
      }
      if (keys.up) {
        plane.y -= plane.speed;
        if (plane.y < 0) plane.y = 0;
      }
      if (keys.down) {
        plane.y += plane.speed;
        const maxY = window.innerHeight - plane.height;
        if (plane.y > maxY) plane.y = maxY;
      }
      updatePlanePosition();
    }
    function updatePlanePosition() {
      mainCharacterEl.style.left = plane.x + "px";
      mainCharacterEl.style.top  = plane.y + "px";
    }
  
    // =============================
    // BULLETS
    // =============================
    function shootBullets() {
      const spreadAngle = 30;
      for (let i = 0; i < powerLevel; i++) {
        let angleDeg = 0;
        if (powerLevel > 1) {
          const step = spreadAngle / (powerLevel - 1);
          angleDeg = -spreadAngle / 2 + i * step;
        }
        createBullet(angleDeg);
      }
    }
    function createBullet(angleDeg) {
      const bulletEl = document.createElement("div");
      bulletEl.className = "bullet";
      gameObjectsEl.appendChild(bulletEl);
  
      const startX = plane.x + plane.width / 2 - 4;
      const startY = plane.y;
  
      bulletEl.style.left = startX + "px";
      bulletEl.style.top  = startY + "px";
  
      const angleRad = (Math.PI / 180) * angleDeg;
      const vx = bulletBaseSpeed * Math.sin(angleRad);
      const vy = -bulletBaseSpeed * Math.cos(angleRad);
  
      bullets.push({
        x: startX,
        y: startY,
        width: 8,
        height: 20,
        el: bulletEl,
        vx: vx,
        vy: vy
      });
    }
    function updateBullets() {
      for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
  
        if (
          b.x < -50 || b.x > window.innerWidth + 50 ||
          b.y < -50 || b.y > window.innerHeight + 50
        ) {
          removeBullet(i);
          i--;
        } else {
          b.el.style.left = b.x + "px";
          b.el.style.top  = b.y + "px";
        }
      }
    }
    function removeBullet(index) {
      const b = bullets[index];
      if (b && b.el && b.el.parentNode) {
        b.el.parentNode.removeChild(b.el);
      }
      bullets.splice(index, 1);
    }
  
    // =============================
    // TEDDIES (Enemies)
    // =============================
    function spawnTeddy() {
      // create <img class="teddy" src="img/teddy.jpeg">
      const teddyEl = document.createElement("img");
      teddyEl.className = "teddy";
      teddyEl.src = "img/teddy.jpeg";  // Adjust if you use .png or a different name
      gameObjectsEl.appendChild(teddyEl);
  
      // random health 3..50
      const health = Math.floor(Math.random() * (50 - 3 + 1)) + 3;
  
      // size might scale with health
      const size = 50 + health; // 53..100 px
      teddyEl.style.width  = size + "px";
      teddyEl.style.height = size + "px";
  
      // position
      const maxX = window.innerWidth - size;
      const teddyX = Math.floor(Math.random() * maxX);
      const teddyY = -size;
  
      teddyEl.style.left = teddyX + "px";
      teddyEl.style.top  = teddyY + "px";
  
      // store in array
      teddies.push({
        x: teddyX,
        y: teddyY,
        width: size,
        height: size,
        health: health,
        el: teddyEl
      });
    }
    function updateTeddies() {
      for (let i = 0; i < teddies.length; i++) {
        const t = teddies[i];
        t.y += teddySpeed;
        if (t.y > window.innerHeight) {
          removeTeddy(i);
          i--;
        } else {
          t.el.style.top = t.y + "px";
        }
      }
    }
    function removeTeddy(index) {
      const t = teddies[index];
      if (t && t.el && t.el.parentNode) {
        t.el.parentNode.removeChild(t.el);
      }
      teddies.splice(index, 1);
    }
  
    // =============================
    // BONUS (mc.jpeg)
    // =============================
    let powerTimeout = null;
    function spawnBonus() {
      // random 2..20
      const powerVal = Math.floor(Math.random() * (20 - 2 + 1)) + 2;
  
      const bonusEl = document.createElement("img");
      bonusEl.className = "bonus";
      bonusEl.src = "img/mc.jpeg";
      gameObjectsEl.appendChild(bonusEl);
  
      const size = 60;
      const maxX = window.innerWidth - size;
      const bonusX = Math.floor(Math.random() * maxX);
      const bonusY = -size;
  
      bonusEl.style.left = bonusX + "px";
      bonusEl.style.top  = bonusY + "px";
  
      bonuses.push({
        x: bonusX,
        y: bonusY,
        width: size,
        height: size,
        powerVal: powerVal,
        el: bonusEl
      });
    }
  
    function updateBonuses() {
      for (let i = 0; i < bonuses.length; i++) {
        const b = bonuses[i];
        b.y += bonusSpeed;
        if (b.y > window.innerHeight) {
          removeBonus(i);
          i--;
        } else {
          b.el.style.top = b.y + "px";
        }
      }
    }
    function removeBonus(index) {
      const b = bonuses[index];
      if (b && b.el && b.el.parentNode) {
        b.el.parentNode.removeChild(b.el);
      }
      bonuses.splice(index, 1);
    }
  
    // =============================
    // COLLISIONS
    // =============================
    function checkCollisions() {
      // Bullets vs Teddies
      for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        for (let j = 0; j < teddies.length; j++) {
          const ted = teddies[j];
          if (isColliding(bullet, ted)) {
            removeBullet(i);
            i--;
  
            ted.health--;
            if (ted.health <= 0) {
              // gain points
              score += ted.width * 2;
              updateScoreUI(score);
              removeTeddy(j);
            }
            break;
          }
        }
      }
  
      // Plane vs Teddies
      for (let j = 0; j < teddies.length; j++) {
        const ted = teddies[j];
        if (isColliding(plane, ted)) {
          playerHealth -= ted.health;
          if (playerHealth < 0) playerHealth = 0;
          updateHealthUI(playerHealth);
  
          // lose points
          score = Math.max(0, score - ted.health);
          updateScoreUI(score);
  
          if (playerHealth <= 0) {
            gameOver("You were destroyed by a Teddy!");
            return;
          }
          removeTeddy(j);
          j--;
        }
      }
  
      // Plane vs Bonus
      for (let k = 0; k < bonuses.length; k++) {
        const bonus = bonuses[k];
        if (isColliding(plane, bonus)) {
          setPowerLevel(bonus.powerVal);
          removeBonus(k);
          k--;
        }
      }
    }
  
    function isColliding(a, b) {
      const ax2 = a.x + (a.width || 0);
      const ay2 = a.y + (a.height || 0);
      const bx2 = b.x + (b.width || 0);
      const by2 = b.y + (b.height || 0);
  
      return (
        a.x < bx2 &&
        ax2 > b.x &&
        a.y < by2 &&
        ay2 > b.y
      );
    }
  
    // =============================
    // STAR (BONUS) POWER LASTS 5 S
    // =============================
    function setPowerLevel(newLevel) {
      if (powerTimeout) clearTimeout(powerTimeout);
      powerLevel = newLevel;
      powerTimeout = setTimeout(() => {
        powerLevel = 1;
      }, 5000);
    }
  
    // =============================
    // BACKGROUND
    // =============================
    function setBackground(lvl) {
      if (lvl === 10) {
        backgroundImg.src = "img/background_10.png";
      } else {
        backgroundImg.src = `img/background_${lvl}.jpeg`;
      }
    }
  
    // =============================
    // GAME OVER
    // =============================
    function gameOver(reason) {
      if (isGameOver) return;
      isGameOver = true;
  
      explodeCharacter(plane.x, plane.y, plane.width, plane.height);
      mainCharacterEl.style.display = "none";
  
      setTimeout(() => {
        showGameOverOverlay(reason);
      }, 700);
    }
    function explodeCharacter(x, y, width, height) {
      const explosionEl = document.createElement("div");
      explosionEl.className = "explosion";
      explosionEl.style.left = (x + width / 2 - 50) + "px";
      explosionEl.style.top  = (y + height / 2 - 50) + "px";
      gameContainer.appendChild(explosionEl);
  
      explosionEl.addEventListener("animationend", () => {
        if (explosionEl.parentNode) {
          explosionEl.parentNode.removeChild(explosionEl);
        }
      });
    }
    function showGameOverOverlay(reason) {
      const overlay = document.createElement("div");
      overlay.className = "overlay visible";
  
      const messageBox = document.createElement("div");
      messageBox.className = "overlay-message";
  
      const heading = document.createElement("h1");
      heading.innerText = "Try Again Steady";
  
      const paragraph = document.createElement("p");
      paragraph.innerText = `Reason: ${reason}`;
  
      const restartBtn = document.createElement("button");
      restartBtn.className = "button-restart";
      restartBtn.innerText = "Restart";
      restartBtn.addEventListener("click", () => {
        location.reload();
      });
  
      messageBox.appendChild(heading);
      messageBox.appendChild(paragraph);
      messageBox.appendChild(restartBtn);
      overlay.appendChild(messageBox);
      gameContainer.appendChild(overlay);
    }
  
    // =============================
    // UI UPDATERS
    // =============================
    function updateScoreUI(val) {
      score = val;
      scoreEl.textContent = score;
    }
    function updateHealthUI(val) {
      playerHealth = val;
      // Convert to percentage
      const healthPercent = (playerHealth / maxPlayerHealth) * 100;
      healthBarEl.style.width = healthPercent + "%";
    }
    function updateLevelUI(val) {
      level = val;
      levelEl.textContent = val;
    }
    function updateTimeLeftUI(val) {
      timeLeftEl.textContent = val;
    }
  
    // =============================
    // KEY EVENTS
    // =============================
    function onKeyDown(e) {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          keys.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          keys.right = true;
          break;
        case "ArrowUp":
        case "KeyW":
          keys.up = true;
          break;
        case "ArrowDown":
        case "KeyS":
          keys.down = true;
          break;
        case "Space":
          if (!keys.space && !isPaused && !isGameOver) {
            shootBullets();
          }
          keys.space = true;
          break;
      }
    }
    function onKeyUp(e) {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          keys.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          keys.right = false;
          break;
        case "ArrowUp":
        case "KeyW":
          keys.up = false;
          break;
        case "ArrowDown":
        case "KeyS":
          keys.down = false;
          break;
        case "Space":
          keys.space = false;
          break;
      }
    }
  
    // Start the game
    init();
  });
  