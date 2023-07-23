import EnemyController from "./EnemyController.js";
import Bullet from "./Bullet.js";

CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
  const ctx = this;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gameMenuCanvas = document.createElement("canvas");
const gameMenuCtx = gameMenuCanvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

class Player {
  rightPressed = false;
  leftPressed = false;
  shootPressed = false;

  getSpeedLevel() {
    return speedLevel;
  }

  getMaxHealthLevel() {
    return maxHealthLevel;
  }

  getFireRateLevel() {
    return fireRateLevel;
  }

  constructor(canvas, velocity, bulletController) {
    this.canvas = canvas;
    this.velocity = velocity;
    this.bulletController = bulletController;

    this.x = this.canvas.width / 2;
    this.y = this.canvas.height - 75;
    this.width = 50;
    this.height = 48;
    this.image = new Image();
    this.image.src = "player.png";

    document.addEventListener("keydown", this.keydown);
    document.addEventListener("keyup", this.keyup);
  }

  draw(ctx) {
    if (this.shootPressed) {
      this.bulletController.shoot(this.x + this.width / 2, this.y, 4, 10);
    }
    this.move();
    this.collideWithWalls();
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collideWithWalls() {
    //left
    if (this.x < 0) {
      this.x = 0;
    }

    //right
    if (this.x > this.canvas.width - this.width) {
      this.x = this.canvas.width - this.width;
    }
  }

  move() {
    if (this.rightPressed) {
      this.x += this.velocity;
    } else if (this.leftPressed) {
      this.x += -this.velocity;
    }
  }

  keydown = (event) => {
    if (event.code == "ArrowRight") {
      this.rightPressed = true;
    }
    if (event.code == "ArrowLeft") {
      this.leftPressed = true;
    }
    if (event.code == "Space") {
      this.shootPressed = true;
    }
  };

  keyup = (event) => {
    if (event.code == "ArrowRight") {
      this.rightPressed = false;
    }
    if (event.code == "ArrowLeft") {
      this.leftPressed = false;
    }
    if (event.code == "Space") {
      this.shootPressed = false;
    }
  };
}

class BulletController {
  bullets = [];
  timeTillNextBulletAllowed = 0;

  constructor(canvas, maxBulletsAtATime, bulletColor) {
    this.canvas = canvas;
    this.maxBulletsAtATime = maxBulletsAtATime;
    this.bulletColor = bulletColor;
    this.timeTillNextBulletAllowed = 0;
    this.bulletCooldownMax = 10; // Firerate
  }

  draw(ctx) {
    this.bullets = this.bullets.filter(
      (bullet) => bullet.y + bullet.width > 0 && bullet.y <= this.canvas.height
    );

    this.bullets.forEach((bullet) => bullet.draw(ctx));
    if (this.timeTillNextBulletAllowed > 0) {
      this.timeTillNextBulletAllowed--;
    }
  }

  collideWith(sprite) {
    const bulletThatHitSpriteIndex = this.bullets.findIndex((bullet) =>
      bullet.collideWith(sprite)
    );

    if (bulletThatHitSpriteIndex >= 0) {
      this.bullets.splice(bulletThatHitSpriteIndex, 1);
      return true;
    }

    return false;
  }

  shoot(x, y, velocity) {
    if (this.timeTillNextBulletAllowed <= 0 && this.bullets.length < this.maxBulletsAtATime) {
      const bullet = new Bullet(this.canvas, x, y, velocity, this.bulletColor);
      this.bullets.push(bullet);
      this.timeTillNextBulletAllowed = this.bulletCooldownMax; // Set cooldown to one second
    }
  }
}

let token = 0;
let speedLevel = 1;
let maxHealthLevel = 1;
let fireRateLevel = 1;

const background = new Image();
background.src = "space.png";

let backgroundImageGameOver = new Image();
backgroundImageGameOver.src = "GameOver.png";

let backgroundGameMenu = new Image();
backgroundGameMenu.src = "starryNight.png";

let backgroundImageWin = new Image();
backgroundImageWin.src = "NextRound.png";

const playerBulletController = new BulletController(canvas, 10, "red", true);
const enemyBulletController = new BulletController(canvas, 4, "white", false);
const enemyController = new EnemyController(
  canvas,
  enemyBulletController,
  playerBulletController
);
const player = new Player(canvas, 3, playerBulletController);

let isGameOver = false;
let didWin = false;

function drawStats(ctx) {
  ctx.fillStyle = "white";
  ctx.font = "15px Arial";
  
  // Draw Speed
  const speedText = `Speed: ${speedLevel}`;
  const speedTextWidth = ctx.measureText(speedText).width;
  ctx.fillText(speedText, canvas.width - speedTextWidth - 10, canvas.height - 120);

  // Draw Health
  const healthText = `Health: ${maxHealthLevel}`;
  const healthTextWidth = ctx.measureText(healthText).width;
  ctx.fillText(healthText, canvas.width - healthTextWidth - 10, canvas.height - 90);

  // Draw Fire Rate
  const fireRateText = `Fire Rate: ${fireRateLevel}`;
  const fireRateTextWidth = ctx.measureText(fireRateText).width;
  ctx.fillText(fireRateText, canvas.width - fireRateTextWidth - 10, canvas.height - 60);
  
  // Draw Tokens
  const tokenText = `Tokens: ${token}`;
  const tokenTextWidth = ctx.measureText(tokenText).width;
  ctx.fillText(tokenText, canvas.width - tokenTextWidth - 10, canvas.height - 30);
}
function game() {
  checkGameOver();
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  displayGameOver();
  if (!isGameOver) {
    enemyController.draw(ctx);
    player.draw(ctx);
    playerBulletController.draw(ctx);
    enemyBulletController.draw(ctx);
  }
  if (screen === "GameMenu") {
    gameMenu();
  }
  drawStats(ctx);
}

function gameMenu() {
  isGameOver = false;
  const text = "Game Menu";
  ctx.fillStyle = "white";
  ctx.font = "42px Pangolin";
  const textWidth = ctx.measureText(text).width;
  const textX = (canvas.width - textWidth) / 2;
  const textY = 50;
  ctx.fillText(text, textX, textY);

  // Draw upgrade bars
  const barHeight = 20;
  const barWidth = 300;
  const barX = 50;
  const barY = 150;
  const barSpacing = 50;
  const maxBarValue = 5; // Set this based on the maximum upgrade level

  // Player Speed Bar
  ctx.fillStyle = "rgb(245, 173, 66)";
  ctx.fillRect(barX, barY, (barWidth / maxBarValue) * speedLevel, barHeight);

  // Health Bar
  ctx.fillStyle = "rgb(0, 255, 8)";
  ctx.fillRect(barX, barY + barHeight + barSpacing, (barWidth / maxBarValue) * maxHealthLevel, barHeight);

  // Fire Rate Bar
  ctx.fillStyle = "rgb(234, 255, 3)";
  ctx.fillRect(barX, barY + (barHeight + barSpacing) * 2, (barWidth / maxBarValue) * fireRateLevel, barHeight);

  // Draw upgrade buttons
  ctx.fillStyle = "rgb(140, 140, 240)";
  ctx.roundRect(370, barY, 100, barHeight, 10); // Speed upgrade button
  ctx.roundRect(370, barY + barHeight + barSpacing, 100, barHeight, 10); // Health upgrade button
  ctx.roundRect(370, barY + (barHeight + barSpacing) * 2, 100, barHeight, 10); // Fire Rate upgrade button
  ctx.fill();


  ctx.shadowBlur = 10;
  ctx.fillStyle = "black";
  ctx.font = "bold 20px Pangolin";
  // Calculate the position for "Speed" text within the button
  const speedText = "Speed";
  const speedTextWidth = ctx.measureText(speedText).width;
  const speedTextX = 370 + (100 - speedTextWidth) / 2;
  const speedTextY = barY + barHeight - 5;
  ctx.fillText(speedText, speedTextX, speedTextY);

  // Calculate the position for "Health" text within the button
  const healthText = "Health";
  const healthTextWidth = ctx.measureText(healthText).width;
  const healthTextX = 370 + (100 - healthTextWidth) / 2;
  const healthTextY = barY + barHeight + barSpacing + barHeight - 5;
  ctx.fillText(healthText, healthTextX, healthTextY);

  // Calculate the position for "Fire Rate" text within the button
  const fireRateText = "Fire Rate";
  const fireRateTextWidth = ctx.measureText(fireRateText).width;
  const fireRateTextX = 370 + (100 - fireRateTextWidth) / 2;
  const fireRateTextY = barY + (barHeight + barSpacing) * 2 + barHeight - 5;
  ctx.fillText(fireRateText, fireRateTextX, fireRateTextY);

  // Add event listeners to handle upgrades when buttons are clicked
  canvas.addEventListener("click", handleUpgradeClick);

  const buttonWidth = 200;
  const buttonHeight = 50;
  const buttonX = (canvas.width - buttonWidth) / 2;
  const buttonY = canvas.height - 100;

  const buttonText = "Next Round";
  const buttonTextWidth = ctx.measureText(buttonText).width;
  const buttonTextX = buttonX + (buttonWidth - buttonTextWidth) / 2;
  const buttonTextY = buttonY + buttonHeight - 15;

  ctx.fillStyle = "rgb(40, 40, 240)";
  ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
  ctx.fill();

  ctx.shadowBlur = 10;
  ctx.fillStyle = "white";
  ctx.font = "20px Pangolin";

  ctx.fillText(buttonText, buttonTextX, buttonTextY);

  // Add event listener to handle clicks on the "Next Round" button
  canvas.addEventListener("click", handleNextRoundClick);
  
  ctx.drawImage(gameMenuCanvas, 0, 0);
}

function handleNextRoundClick(event) {
  const buttonWidth = 200;
  const buttonHeight = 50;
  const buttonX = (canvas.width - buttonWidth) / 2;
  const buttonY = canvas.height - 100;

  const mouseX = event.clientX - canvas.offsetLeft;
  const mouseY = event.clientY - canvas.offsetTop;

  // Check if the click is within the bounds of the "Next Round" button
  if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
      mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
    // Reset game state to its initial conditions here
    if (didWin) {
      token++;
    }
    console.log("Next Round button clicked.");

    // Reset other game-related variables as needed

    // Call any initialization function to reset the game elements

    // Remove the event listener for the "Next Round" button since the game is restarting
    canvas.removeEventListener("click", handleNextRoundClick);
  }
}

  function handleUpgradeClick(event) {
  let barHeight = 20;
  let barY = 150;
  let barSpacing = 50;
  let maxBarValue = 5;
  
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  // Define the upgrade button rectangles
  const speedUpgradeButtonRect = { x: 640, y: barY + 60, w: 100, h: barHeight };
  const healthUpgradeButtonRect = { x: 640, y: barY + barHeight + barSpacing + 60, w: 100, h: barHeight };
  const fireRateUpgradeButtonRect = { x: 640, y: barY + (barHeight + barSpacing) * 2 + 60, w: 100, h: barHeight };

  // Check if the mouse click is inside any of the upgrade buttons
  if (isInRect({ x: mouseX, y: mouseY }, speedUpgradeButtonRect)) {
    console.log("Speed upgrade button clicked.");
    if (speedLevel < maxBarValue && speedLevel < 5) {
      speedLevel++;
      player.velocity += 1;

      // Redraw the game menu with updated upgrade bars and stats
      gameMenu();
    }
  }
  else if (isInRect({ x: mouseX, y: mouseY }, healthUpgradeButtonRect)) {
    console.log("Health upgrade button clicked.");
    if (maxHealthLevel < maxBarValue && maxHealthLevel < 5) {
      maxHealthLevel++;
      maxHealth += 1;

      // Redraw the game menu with updated upgrade bars and stats
      gameMenu();
    }
  }
  else if (isInRect({ x: mouseX, y: mouseY }, fireRateUpgradeButtonRect)) {
    console.log("fireRate upgrade button clicked.");
    if (fireRateLevel < maxBarValue && fireRateLevel < 5) {
      fireRateLevel++;
      playerBulletController.bulletCooldownMax -= 1;

      // Redraw the game menu with updated upgrade bars and stats
      gameMenu();
    }
  }
}

canvas.addEventListener("click", handleUpgradeClick);
canvas.addEventListener("click", handleNextRoundClick);

// Helper function to check if a point is inside a rectangle
function isInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

function displayGameOver() {
  if (isGameOver){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (didWin) {
      // Draw the "You Win" background image
      setTimeout(() => {
        isGameOver = false; // Reset isGameOver to allow the game to continue
        screen = "GameMenu";
        didWin = false;
        gameMenu();
      }, 1000);
      ctx.drawImage(backgroundGameMenu, 0, 0, canvas.width, canvas.height);
    } else {
      // Draw the "Game Over" background image
      ctx.drawImage(backgroundImageGameOver, 0, 0, canvas.width, canvas.height);
    }
  }
}

function checkGameOver() {
  if (isGameOver) {
    return;
  }

  if (enemyBulletController.collideWith(player)) {
    isGameOver = true;
    didWin = false;
  }

  if (enemyController.collideWith(player)) {
    isGameOver = true;
    didWin = false;
  }

  if (enemyController.enemyRows.length === 0) {
    isGameOver = true;
    didWin = true;
  }
}
setInterval(game, 1000 / 60);