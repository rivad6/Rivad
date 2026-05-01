import React, { useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAchievements } from "../../context/AchievementsContext";
import { cn } from "../../lib/utils";
import {
  Play,
  RefreshCw,
  Zap,
  Shield,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Crosshair,
  Settings,
  Target,
} from "lucide-react";
import { useAudio } from "../../context/AudioContext";
import { motion, AnimatePresence } from "motion/react";

type GameState =
  | "start"
  | "playing"
  | "gameover"
  | "win"
  | "takeoff"
  | "asteroids"
  | "asteroids_win";

const CHARACTERS = [
  {
    id: "classic",
    nameKey: "Pencil",
    descKey: "Reliable and classic.",
    price: 0,
    speed: 7,
    fireRateBase: 1,
    color: "#fbbf24",
    tailColor: "#f59e0b",
  },
  {
    id: "rapid",
    nameKey: "Gel Pen",
    descKey: "Shoots fast ink.",
    price: 200,
    speed: 8,
    fireRateBase: 1.5,
    color: "#6ee7b7",
    tailColor: "#10b981",
  },
  {
    id: "tank",
    nameKey: "Thick Marker",
    descKey: "Heavy but powerful.",
    price: 500,
    speed: 6,
    fireRateBase: 1,
    color: "#93c5fd",
    tailColor: "#3b82f6",
  },
  {
    id: "laser",
    nameKey: "Highlighter",
    descKey: "Fast neon beams.",
    price: 1000,
    speed: 10,
    fireRateBase: 2,
    color: "#c084fc",
    tailColor: "#a855f7",
  },
];

import { FullscreenButton } from "../ui/FullscreenButton";

type Difficulty = "easy" | "normal" | "hard";

export function CreativeInvaders({
  isPausedGlobal = false,
  hideFullscreenButton = false,
  onFinish,
  isFullscreen = false,
}: {
  isPausedGlobal?: boolean;
  hideFullscreenButton?: boolean;
  isFullscreen?: boolean;
  onFinish?: () => void;
}) {
  const { t } = useLanguage();
  const { unlockAchievement } = useAchievements();
  const { playSound, playMusic } = useAudio();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  const [gameState, setGameState] = useState<GameState>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () =>
      (localStorage.getItem("invaders_difficulty") as Difficulty) || "normal",
  );

  useEffect(() => {
    if (
      gameState === "playing" ||
      gameState === "asteroids" ||
      gameState === "takeoff"
    ) {
      playMusic("invaders");
    } else {
      playMusic("none");
    }
    return () => playMusic("none");
  }, [gameState, playMusic]);

  const [score, setScore] = useState(0);
  const [hudShield, setHudShield] = useState(0);
  const [hudPower, setHudPower] = useState(1);
  const [hudTurbo, setHudTurbo] = useState(0);
  const [hudTimer, setHudTimer] = useState(0);

  const scoreRefDOM = useRef<HTMLDivElement>(null);

  const [festCoins, setFestCoins] = useState(() =>
    Number(localStorage.getItem("fest_coins") || 0),
  );
  const [highScore, setHighScore] = useState(() =>
    Number(localStorage.getItem("invaders_highscore") || 0),
  );
  const [unlockedChars, setUnlockedChars] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("invaders_chars") || '["classic"]'),
  );
  const [selectedCharId, setSelectedCharId] = useState(
    () => localStorage.getItem("invaders_selected_char") || "classic",
  );
  const [storeTab, setStoreTab] = useState<"chars" | "upgrades">("chars");
  const [showMobileControls, setShowMobileControls] = useState(
    () => localStorage.getItem("invaders_mobile_controls") === "true",
  );
  const [secretCode, setSecretCode] = useState("");
  const [isAsteroidMode, setIsAsteroidMode] = useState(false);
  const [hasDiscoveredSecret, setHasDiscoveredSecret] = useState(
    () => localStorage.getItem("invaders_secret_discovered") === "true",
  );
  const pendingCoinsRef = useRef(0);
  const pausedRef = useRef(false);
  const pausedGlobalRef = useRef(false);

  useEffect(() => {
    pausedGlobalRef.current = isPausedGlobal;
  }, [isPausedGlobal]);

  const secretSequence = useRef<string>("");

  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem("invaders_upgrades");
    return saved
      ? JSON.parse(saved)
      : { shield: 0, power: 0, speed: 0, rear_turret: 0 };
  });

  const selectedChar =
    CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];

  useEffect(() => {
    localStorage.setItem(
      "invaders_mobile_controls",
      showMobileControls.toString(),
    );
  }, [showMobileControls]);

  useEffect(() => {
    localStorage.setItem("invaders_difficulty", difficulty);
  }, [difficulty]);

  useEffect(() => {
    localStorage.setItem("fest_coins", festCoins.toString());
    localStorage.setItem("invaders_chars", JSON.stringify(unlockedChars));
    localStorage.setItem("invaders_selected_char", selectedCharId);
    localStorage.setItem("invaders_upgrades", JSON.stringify(upgrades));
    localStorage.setItem("invaders_highscore", highScore.toString());
  }, [festCoins, unlockedChars, selectedCharId, upgrades, highScore]);

  const buyChar = (char: (typeof CHARACTERS)[0]) => {
    if (festCoins >= char.price) {
      setFestCoins((prev) => prev - char.price);
      setUnlockedChars((prev) => {
        const next = [...prev, char.id];
        if (next.length === CHARACTERS.length) {
          unlockAchievement("invaders_all_ships");
        }
        return next;
      });
      playSound("purchase");
    } else {
      playSound("alert");
    }
  };

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretCode.trim().toLowerCase() === "asteroid") {
      playSound("powerup");
      setIsAsteroidMode(true);
      setHasDiscoveredSecret(true);
      localStorage.setItem("invaders_secret_discovered", "true");
      setSecretCode("");

      // Initialize state and go directly to takeoff
      initGame("takeoff");

      // Additional setup after state is initialized
      if (state.current) {
        state.current.isAsteroidMode = true;
        state.current.score += 1000;
        state.current.bgType = "deep";
      }
    } else {
      playSound("alert");
      setSecretCode("");
    }
  };

  // Game configuration
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;

  const sprites = {
    player: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 2, 2, 1, 0, 0],
      [0, 1, 3, 3, 3, 3, 1, 0],
      [1, 3, 4, 4, 4, 4, 3, 1],
      [1, 3, 4, 4, 4, 4, 3, 1],
      [1, 3, 4, 4, 4, 4, 3, 1],
      [1, 5, 5, 5, 5, 5, 5, 1],
      [1, 6, 6, 6, 6, 6, 6, 1],
    ],
    routine: [
      [0, 1, 1, 0, 1, 1, 0, 0],
      [1, 2, 2, 1, 2, 2, 1, 0],
      [1, 2, 3, 2, 3, 2, 2, 1],
      [0, 1, 2, 2, 2, 3, 2, 1],
      [1, 2, 2, 3, 2, 2, 1, 0],
      [1, 3, 2, 2, 3, 2, 1, 0],
      [0, 1, 2, 2, 2, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0, 0],
    ],
    block: [
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 3, 3, 3, 3, 3, 1, 1],
      [1, 3, 1, 1, 3, 3, 1, 1],
      [1, 3, 1, 1, 3, 3, 1, 1],
      [1, 3, 3, 3, 3, 3, 1, 1],
      [1, 3, 3, 3, 3, 3, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    distraction: [
      [0, 1, 1, 1, 1, 1, 0, 3],
      [1, 2, 2, 2, 2, 1, 3, 3],
      [1, 2, 2, 2, 2, 1, 0, 0],
      [1, 2, 2, 2, 2, 1, 0, 0],
      [1, 2, 4, 4, 2, 1, 0, 0],
      [1, 2, 4, 4, 2, 1, 0, 0],
      [1, 1, 4, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0, 0],
    ],
    boss: [
      [0, 1, 1, 0, 0, 1, 1, 0],
      [1, 3, 3, 1, 1, 3, 3, 1],
      [1, 3, 3, 1, 1, 3, 3, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 3, 3, 3, 3, 2, 1],
      [1, 2, 3, 1, 1, 3, 2, 1],
      [1, 2, 3, 1, 3, 3, 2, 1],
      [1, 2, 3, 3, 3, 3, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
    ],
    drop: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 2, 1, 0, 0],
      [0, 1, 2, 2, 2, 1, 0],
      [1, 2, 2, 4, 3, 2, 1],
      [1, 2, 3, 4, 3, 2, 1],
      [1, 2, 2, 3, 2, 2, 1],
      [0, 1, 2, 2, 2, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ],
    asteroid: [
      [0, 1, 1, 1, 1, 1, 0, 0],
      [1, 2, 2, 2, 3, 2, 1, 0],
      [1, 2, 3, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 3, 2, 2, 1],
      [1, 3, 2, 2, 2, 2, 3, 1],
      [1, 2, 2, 3, 2, 2, 2, 1],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
    ],
  };

  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    sprite: number[][],
    x: number,
    y: number,
    width: number,
    height: number,
    palette: string[],
    isCutout: boolean = true,
  ) => {
    const rows = sprite.length;
    const cols = sprite[0].length;
    const pxW = width / cols;
    const pxH = height / rows;
    const tF = Math.floor(performance.now() / 120);

    if (isCutout) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (sprite[r][c] > 0) {
            const ox = Math.sin(r * 12.3 + c * 7.1 + tF) * 1.5;
            const oy = Math.cos(r * 8.5 + c * 13.7 + tF) * 1.5;
            ctx.rect(
              x + c * pxW - 3 + ox,
              y + r * pxH - 3 + oy,
              pxW + 6,
              pxH + 6,
            );
          }
        }
      }
      ctx.fill();
      ctx.restore();
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = sprite[r][c];
        if (val > 0 && palette[val - 1]) {
          ctx.fillStyle = palette[val - 1];
          const ox = Math.sin(r * 12.3 + c * 7.1 + tF) * 1.5;
          const oy = Math.cos(r * 8.5 + c * 13.7 + tF) * 1.5;
          ctx.fillRect(
            x + c * pxW - 0.5 + ox,
            y + r * pxH - 0.5 + oy,
            pxW + 1.2,
            pxH + 1.2,
          );
        }
      }
    }
  };

  const state = useRef({
    player: {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 60,
      width: 40,
      height: 40,
      speed: 7,
      angle: 0,
      isMovingLeft: false,
      isMovingRight: false,
      isMovingUp: false,
      isMovingDown: false,
      power: 1,
      powerTimer: 0,
      shield: 0,
      speedBoostTimer: 0,
      magnetTimer: 0,
      hasteTimer: 0,
    },
    projectiles: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      speed: number;
      color: string;
      isEnemy?: boolean;
    }[],
    enemies: [] as {
      x: number;
      y: number;
      vx?: number;
      vy?: number;
      width: number;
      height: number;
      type:
        | "routine"
        | "block"
        | "distraction"
        | "boss"
        | "asteroid_l"
        | "asteroid_m"
        | "asteroid_s";
      hp: number;
      maxHp: number;
      variant?: number;
      offset: number;
      hitFlash?: number;
    }[],
    drops: [] as {
      x: number;
      y: number;
      type:
        | "power"
        | "shield"
        | "speed"
        | "secret"
        | "magnet"
        | "repair"
        | "haste";
    }[],
    stars: Array.from({ length: 100 }).map(() => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      speed: Math.random() * 2 + 0.5,
      size: Math.random() * 2 + 1,
    })),
    enemyDirection: 1,
    difficultyMultiplier: 1.0,
    enemySpeedBase: 1.5,
    enemyMoveTimer: 0,
    time: 0,
    score: 0,
    lastFireTime: 0,
    particles: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      isCoin?: boolean;
    }[],
    level: 1,
    wave: 1,
    lastHitEdgeTime: 0,
    bgType: "grid" as "grid" | "deep",
    planets: [] as {
      x: number;
      y: number;
      size: number;
      color: string;
      speed: number;
    }[],
    shake: 0,
    playerFlash: 0,
    isTransitioning: false,
    levelUpTimer: 0,
    isAsteroidMode: false,
    asteroidModeTimer: 0,
    pendingCoins: 0,
    joystick: {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      distance: 0,
      angle: 0,
    },
  });

  const loadAsteroidsLevel = useCallback(() => {
    state.current.enemies = [];
    state.current.projectiles = [];
    state.current.drops = [];
    state.current.isTransitioning = false;
    state.current.player.x = GAME_WIDTH / 2;
    state.current.player.y = GAME_HEIGHT / 2;
    state.current.bgType = "deep";
    state.current.asteroidModeTimer = 0;

    // Add distant planets/moons
    state.current.planets = Array.from({ length: 3 }).map(() => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      size: 30 + Math.random() * 70,
      color: ["#1e3a8a", "#3730a3", "#1e1b4b", "#111827"][
        Math.floor(Math.random() * 4)
      ],
      speed: 0.1 + Math.random() * 0.3,
    }));

    // Create asteroids based on difficulty
    const asteroidCount =
      difficulty === "easy" ? 4 : difficulty === "hard" ? 7 : 5;
    const asteroidSpeedMulti =
      difficulty === "easy" ? 0.6 : difficulty === "hard" ? 1.4 : 1.0;
    for (let i = 0; i < asteroidCount; i++) {
      let ax, ay;
      let attempts = 0;
      // Safe spawn logic: ensure asteroid is not too close to player (center)
      do {
        ax = Math.random() * GAME_WIDTH;
        ay = Math.random() * GAME_HEIGHT;
        const dist = Math.sqrt(
          Math.pow(ax - state.current.player.x, 2) +
            Math.pow(ay - state.current.player.y, 2),
        );
        attempts++;
        if (dist > 180 || attempts > 20) break;
      } while (true);

      state.current.enemies.push({
        x: ax,
        y: ay,
        vx: (Math.random() - 0.5) * 4 * asteroidSpeedMulti,
        vy: (Math.random() - 0.5) * 4 * asteroidSpeedMulti,
        width: 80,
        height: 80,
        type: "asteroid_l",
        hp: 2,
        maxHp: 2,
        offset: Math.random() * Math.PI * 2,
      });
    }
  }, []);

  const loadLevel = useCallback((level: number) => {
    state.current.enemies = [];
    state.current.drops = [];
    state.current.isTransitioning = false;
    state.current.enemyDirection = 1;

    // Difficulty scaling
    const diffMulti =
      difficulty === "easy" ? 0.7 : difficulty === "hard" ? 1.3 : 1.0;
    state.current.difficultyMultiplier = diffMulti;

    state.current.enemySpeedBase =
      (1.0 + level * 0.2 + state.current.wave * 0.5) * diffMulti;
    state.current.player.x = GAME_WIDTH / 2;
    state.current.projectiles = [];
    state.current.bgType = "grid";

    // Normalize level for map selection
    const currentMapLevel = ((level - 1) % 4) + 1;

    if (currentMapLevel === 4) {
      // Boss level
      const bossHp = (100 + level * 20) * state.current.difficultyMultiplier;
      state.current.enemies.push({
        x: GAME_WIDTH / 2 - 100,
        y: 50,
        width: 200,
        height: 150,
        type: "boss",
        hp: bossHp,
        maxHp: bossHp,
        offset: 0,
        variant: Math.floor(Math.random() * 3),
      });
      return;
    }

    const rows = 3 + (currentMapLevel > 3 ? 3 : currentMapLevel);
    const cols = 7 + (currentMapLevel > 3 ? 3 : currentMapLevel);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: "routine" | "block" | "distraction" | "boss" = "routine";
        let hp = 1;

        const rand = Math.random();
        if (currentMapLevel === 1) {
          if (r === 0 && rand < 0.2) {
            type = "block";
            hp = 2;
          } else {
            type = "routine";
            hp = 1;
          }
        } else if (currentMapLevel === 2) {
          if (r === 0) {
            type = "block";
            hp = 2 + Math.floor(level / 2);
          } else if (r === 1 && rand < 0.2) {
            type = "distraction";
            hp = 1;
          } else {
            type = "routine";
            hp = 1;
          }
        } else if (currentMapLevel === 3) {
          if (r === 0) {
            type = "block";
            hp = 3 + Math.floor(level / 2);
          } else if (r === 1) {
            type = "distraction";
            hp = 1;
          } else if (r === 2 && rand < 0.3) {
            type = "distraction";
            hp = 1;
          } else {
            type = "routine";
            hp = 1;
          }
        }

        state.current.enemies.push({
          x: c * ((GAME_WIDTH / cols) * 0.8) + 40,
          y: r * 45 + 60,
          width: 32,
          height: 32,
          type,
          hp,
          maxHp: hp,
          offset: Math.random() * Math.PI * 2,
        });
      }
    }
  }, []);

  const initGame = useCallback(
    (initialState: GameState = "playing") => {
      state.current = {
        player: {
          x: GAME_WIDTH / 2,
          y: GAME_HEIGHT - 60,
          width: 40,
          height: 40,
          speed: selectedChar.speed + upgrades.speed * 0.5,
          isMovingLeft: false,
          isMovingRight: false,
          isMovingUp: false,
          isMovingDown: false,
          power: (selectedChar.id === "laser" ? 2 : 1) + upgrades.power,
          powerTimer: 0,
          shield: (selectedChar.id === "tank" ? 3 : 0) + upgrades.shield,
          speedBoostTimer: selectedChar.id === "rapid" ? 500 : 0,
          magnetTimer: 0,
          hasteTimer: 0,
          angle: -Math.PI / 2,
        },
        projectiles: [],
        enemies: [],
        drops: [],
        stars: Array.from({ length: 100 }).map(() => ({
          x: Math.random() * GAME_WIDTH,
          y: Math.random() * GAME_HEIGHT,
          speed: Math.random() * 2 + 0.5,
          size: Math.random() * 2 + 1,
        })),
        planets: [],
        enemyDirection: 1,
        enemySpeedBase:
          1.5 *
          (difficulty === "easy" ? 0.7 : difficulty === "hard" ? 1.4 : 1.0),
        difficultyMultiplier:
          difficulty === "easy" ? 0.7 : difficulty === "hard" ? 1.3 : 1.0,
        enemyMoveTimer: 0,
        time: 0,
        score: 0,
        lastFireTime: 0,
        particles: [],
        level: 1,
        wave: 1,
        bgType: "grid",
        shake: 0,
        playerFlash: 0,
        lastHitEdgeTime: 0,
        isTransitioning: false,
        levelUpTimer: 0,
        activeTimer: 0,
        asteroidModeTimer: 0,
        pendingCoins: 0,
        isAsteroidMode: false,
        joystick: {
          active: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          distance: 0,
          angle: 0,
        },
      };

      loadLevel(1);
      setScore(0);
      setGameState(initialState);
    },
    [loadLevel, selectedChar, GAME_WIDTH, GAME_HEIGHT, upgrades, difficulty],
  );

  const fire = useCallback(() => {
    const s = state.current;
    if (gameState !== "playing" && gameState !== "asteroids") return;
    if (s.isTransitioning) return;

    const now = Date.now();
    // Use fireRateBase
    const baseFireDelay = 300 / selectedChar.fireRateBase;
    const diffFireMulti =
      difficulty === "easy" ? 1.3 : difficulty === "hard" ? 0.8 : 1.0;
    const powerFireMulti =
      s.player.hasteTimer > 0 ? 0.4 : s.player.power > 1 ? 0.5 : 1.0;
    const fireDelay =
      s.player.speedBoostTimer > 0
        ? baseFireDelay * 0.33
        : (baseFireDelay * powerFireMulti) / diffFireMulti;

    if (now - s.lastFireTime > fireDelay) {
      playSound("fire");

      const fireBullet = (
        angleOffset: number,
        color: string,
        vxOffset: number = 0,
        vyOffset: number = -10,
      ) => {
        const angle =
          gameState === "asteroids" || s.isAsteroidMode
            ? s.player.angle + angleOffset
            : angleOffset;
        const speed = s.isAsteroidMode ? 14 : 10;
        const vx =
          gameState === "asteroids" || s.isAsteroidMode
            ? Math.cos(angle) * speed
            : vxOffset;
        const vy =
          gameState === "asteroids" || s.isAsteroidMode
            ? Math.sin(angle) * speed
            : vyOffset;

        s.projectiles.push({
          x: s.player.x + s.player.width / 2,
          y: s.player.y + s.player.height / 2,
          vx: vx,
          vy: vy,
          speed: speed,
          color: s.isAsteroidMode && !color.includes("ef") ? "#f472b6" : color,
        });
      };

      if (s.player.power === 1) {
        fireBullet(
          gameState === "asteroids" || s.isAsteroidMode ? 0 : 0,
          "#facc15",
          0,
          -10,
        );
      } else if (s.player.power >= 2) {
        fireBullet(
          gameState === "asteroids" || s.isAsteroidMode ? -0.2 : 0,
          "#38bdf8",
          -2,
          -10,
        );
        fireBullet(
          gameState === "asteroids" || s.isAsteroidMode ? 0.2 : 0,
          "#38bdf8",
          2,
          -10,
        );
        if (s.player.power >= 3 || s.isAsteroidMode) {
          fireBullet(
            gameState === "asteroids" || s.isAsteroidMode ? 0 : 0,
            "#facc15",
            0,
            -10,
          );
        }
        if (s.player.power >= 4) {
          // Mega shots: side bursts
          fireBullet(
            gameState === "asteroids" || s.isAsteroidMode ? -0.4 : 0,
            "#f472b6",
            -4,
            -12,
          );
          fireBullet(
            gameState === "asteroids" || s.isAsteroidMode ? 0.4 : 0,
            "#f472b6",
            4,
            -12,
          );
        }
      }

      // Rear turret firing - Auto-enabled in Deep Space / Asteroid Mode
      const isDeepSpace = gameState === "asteroids" || s.isAsteroidMode;
      if (isDeepSpace || upgrades.rear_turret > 0) {
        const turretPower = isDeepSpace
          ? Math.max(1, upgrades.rear_turret)
          : upgrades.rear_turret;
        const spread = turretPower > 1 ? 0.3 : 0;
        const bulletColor = isDeepSpace ? "#f472b6" : "#ef4444";

        fireBullet(Math.PI - spread, bulletColor);
        if (turretPower > 1) {
          fireBullet(Math.PI + spread, bulletColor);
        }
        if (turretPower >= 3) {
          fireBullet(Math.PI, isDeepSpace ? "#f472b6" : "#facc15");
        }
      }

      s.lastFireTime = now;

      // Muzzle flash particle
      for (let i = 0; i < 5; i++) {
        s.particles.push({
          x: s.player.x + s.player.width / 2,
          y: s.player.y,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * -4,
          life: 1,
          maxLife: 10 + Math.random() * 10,
          color: "#fef08a",
        });
      }
    }
  }, [selectedChar, gameState, upgrades, playSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret code detection
      secretSequence.current = (
        secretSequence.current + e.key.toLowerCase()
      ).slice(-8);
      if (secretSequence.current === "asteroid") {
        playSound("powerup");
        setIsAsteroidMode(true);
        setHasDiscoveredSecret(true);
        localStorage.setItem("invaders_secret_discovered", "true");

        initGame("takeoff");
        if (state.current) {
          state.current.score += 1000;
          state.current.isAsteroidMode = true;
          state.current.bgType = "deep";
        }
        secretSequence.current = "";
        return;
      }

      const keysToPrevent = [
        " ",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "s",
        "a",
        "d",
      ];
      if (keysToPrevent.includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" || e.key === "a")
        state.current.player.isMovingLeft = true;
      else if (e.key === "ArrowRight" || e.key === "d")
        state.current.player.isMovingRight = true;
      else if (e.key === "ArrowUp" || e.key === "w")
        state.current.player.isMovingUp = true;
      else if (e.key === "ArrowDown" || e.key === "s")
        state.current.player.isMovingDown = true;
      else if (e.key === " ")
        if (gameState === "playing" || gameState === "asteroids") fire();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a")
        state.current.player.isMovingLeft = false;
      else if (e.key === "ArrowRight" || e.key === "d")
        state.current.player.isMovingRight = false;
      else if (e.key === "ArrowUp" || e.key === "w")
        state.current.player.isMovingUp = false;
      else if (e.key === "ArrowDown" || e.key === "s")
        state.current.player.isMovingDown = false;
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [fire, gameState]);

  const createExplosion = (
    x: number,
    y: number,
    color: string,
    count: number = 15,
    isCoin: boolean = false,
  ) => {
    for (let i = 0; i < count; i++) {
      state.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (isCoin ? 5 : 10),
        vy: (Math.random() - 0.5) * (isCoin ? 5 : 10) - (isCoin ? 5 : 0),
        life: 1,
        maxLife: Math.random() * 25 + 10,
        color,
        isCoin,
      });
    }
  };

  const triggerGameOver = useCallback(() => {
    const s = state.current;
    playSound("explosion");
    setGameState("gameover");
    setScore(s.score);
    if (s.score > highScore) setHighScore(s.score);
    if (s.pendingCoins > 0) {
      setFestCoins((prev) => prev + s.pendingCoins);
      s.pendingCoins = 0;
    }
  }, [highScore, playSound]);

  const update = useCallback(
    (dt: number) => {
      const s = state.current;
      if (
        gameState !== "playing" &&
        gameState !== "asteroids" &&
        gameState !== "takeoff"
      )
        return;
      if (pausedGlobalRef.current || pausedRef.current) return;

      const normalDt = dt / 16.666; // Normalize to 60fps

      if (s.shake > 0) s.shake *= Math.pow(0.9, normalDt);
      if (s.playerFlash > 0) s.playerFlash -= normalDt;
      if (s.levelUpTimer > 0) s.levelUpTimer -= normalDt;

      if (gameState === "asteroids") {
        const prevTimer = s.asteroidModeTimer;
        s.asteroidModeTimer += dt / 1000;

        // Red space transition starting at 280s, full at 300s
        if (s.asteroidModeTimer > 280 && s.asteroidModeTimer < 320) {
          s.shake = Math.min(2, s.shake + 0.1 * normalDt);
        }

        // Spawn Final Boss: Sol Rojo del Aburrimiento at 300s
        if (prevTimer < 300 && s.asteroidModeTimer >= 300) {
          playSound("boss_spawn");
          s.enemies.push({
            x: GAME_WIDTH / 2 - 150,
            y: -300,
            vx: 0,
            vy: 0.5, // Slow entrance
            width: 300,
            height: 300,
            type: "boss",
            hp: 1500 * s.difficultyMultiplier,
            maxHp: 1500 * s.difficultyMultiplier,
            offset: 0,
            variant: 99, // Special ID for Red Sun
          });
          s.isTransitioning = true;
          setTimeout(() => {
            if (state.current) state.current.isTransitioning = false;
          }, 5000);
        }

        // Dynamic spawning based on time (stop regular spawning if boss is active maybe, or keep it chaotic)
        const hasRedSun = s.enemies.some((e) => e.variant === 99);
        const spawnFrequency =
          (hasRedSun
            ? 0.005
            : 0.012 + Math.min(0.04, s.asteroidModeTimer / 120)) * normalDt;
        if (Math.random() < spawnFrequency) {
          const side = Math.floor(Math.random() * 4);
          let ax, ay, vx, vy;
          const margin = 50;

          if (side === 0) {
            ax = -margin;
            ay = Math.random() * GAME_HEIGHT;
            vx = 1.5;
            vy = (Math.random() - 0.5) * 2;
          } else if (side === 1) {
            ax = GAME_WIDTH + margin;
            ay = Math.random() * GAME_HEIGHT;
            vx = -1.5;
            vy = (Math.random() - 0.5) * 2;
          } else if (side === 2) {
            ax = Math.random() * GAME_WIDTH;
            ay = -margin;
            vx = (Math.random() - 0.5) * 2;
            vy = 1.5;
          } else {
            ax = Math.random() * GAME_WIDTH;
            ay = GAME_HEIGHT + margin;
            vx = (Math.random() - 0.5) * 2;
            vy = -1.5;
          }

          const speedFactor =
            (1 + s.asteroidModeTimer / 45) * s.difficultyMultiplier;

          // Occasionally spawn enemy ships in asteroid field
          if (s.asteroidModeTimer > 15 && Math.random() < 0.25) {
            s.enemies.push({
              x: ax,
              y: ay,
              vx: vx * speedFactor * 1.5,
              vy: vy * speedFactor * 1.5,
              width: 30,
              height: 30,
              type: "distraction",
              hp: 1,
              maxHp: 1,
              offset: Math.random() * Math.PI,
              variant: 1,
            });
          } else {
            const type = Math.random() < 0.3 ? "asteroid_l" : "asteroid_m";
            s.enemies.push({
              x: ax,
              y: ay,
              vx: vx * speedFactor,
              vy: vy * speedFactor,
              width: type === "asteroid_l" ? 70 : 45,
              height: type === "asteroid_l" ? 70 : 45,
              type: type as any,
              hp: type === "asteroid_l" ? 2 : 1,
              maxHp: type === "asteroid_l" ? 2 : 1,
              offset: Math.random() * Math.PI,
            });
          }
        }
      }

      if (gameState === "takeoff") {
        const takeoffSpeed = 10 * s.difficultyMultiplier * normalDt;
        s.player.y -= takeoffSpeed;
        s.player.angle = Math.sin(s.time) * 0.1;

        for (const star of s.stars) {
          star.y += star.speed * 8 * normalDt;
          if (star.y > GAME_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * GAME_WIDTH;
          }
        }

        if (s.player.y < -s.player.height) {
          setGameState("asteroids");
          loadAsteroidsLevel();
          createExplosion(GAME_WIDTH / 2, GAME_HEIGHT / 2, "#38bdf8", 100);
          playSound("win");
          setHasDiscoveredSecret(true);
          localStorage.setItem("invaders_secret_discovered", "true");
        }

        for (let i = 0; i < 3; i++) {
          s.particles.push({
            x: s.player.x + s.player.width / 2 + (Math.random() - 0.5) * 10,
            y: s.player.y + s.player.height,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 5 + 5,
            life: 1,
            maxLife: 15,
            color: "#fbbf24",
          });
        }
        return;
      }

      // Update stars
      for (const star of s.stars) {
        star.y +=
          (star.speed + (s.player.speedBoostTimer > 0 ? 5 : 0)) * normalDt;
        if (star.y > GAME_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * GAME_WIDTH;
        }
      }

      s.time += 0.05 * normalDt;

      if (s.player.powerTimer > 0) {
        s.player.powerTimer -= normalDt;
        if (s.player.powerTimer <= 0) s.player.power = 1;
      }
      if (s.player.speedBoostTimer > 0) {
        s.player.speedBoostTimer -= normalDt;
      }
      if (s.player.magnetTimer > 0) {
        s.player.magnetTimer -= normalDt;
      }
      if (s.player.hasteTimer > 0) {
        s.player.hasteTimer -= normalDt;
      }

      const baseSpeed =
        s.player.speedBoostTimer > 0 ? s.player.speed * 1.5 : s.player.speed;
      const playerCurrentSpeed =
        (s.player.hasteTimer > 0 ? baseSpeed * 1.4 : baseSpeed) * normalDt;

      if (gameState === "asteroids") {
        if (s.joystick.active) {
          const moveX =
            Math.cos(s.joystick.angle) *
            playerCurrentSpeed *
            Math.min(1, s.joystick.distance / 40);
          const moveY =
            Math.sin(s.joystick.angle) *
            playerCurrentSpeed *
            Math.min(1, s.joystick.distance / 40);
          s.player.x += moveX;
          s.player.y += moveY;
          s.player.angle = s.joystick.angle;
        } else {
          // Keyboard control in 360
          let moveX = 0;
          let moveY = 0;
          if (s.player.isMovingLeft) moveX -= 1;
          if (s.player.isMovingRight) moveX += 1;
          if (s.player.isMovingUp) moveY -= 1;
          if (s.player.isMovingDown) moveY += 1;

          if (moveX !== 0 || moveY !== 0) {
            const targetAngle = Math.atan2(moveY, moveX);
            // Smooth rotation
            let diff = targetAngle - s.player.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            s.player.angle += diff * 0.2 * normalDt;

            s.player.x += Math.cos(targetAngle) * playerCurrentSpeed;
            s.player.y += Math.sin(targetAngle) * playerCurrentSpeed;
          }
        }
      } else {
        if (s.player.isMovingLeft) s.player.x -= playerCurrentSpeed;
        if (s.player.isMovingRight) s.player.x += playerCurrentSpeed;
        if (gameState === "asteroids") {
          if (s.player.isMovingUp) s.player.y -= playerCurrentSpeed;
          if (s.player.isMovingDown) s.player.y += playerCurrentSpeed;
        }
      }

      if (gameState === "asteroids") {
        if (s.player.x < -s.player.width) s.player.x = GAME_WIDTH;
        if (s.player.x > GAME_WIDTH) s.player.x = -s.player.width;
        if (s.player.y < -s.player.height) s.player.y = GAME_HEIGHT;
        if (s.player.y > GAME_HEIGHT) s.player.y = -s.player.height;

        for (const planet of s.planets) {
          planet.y += planet.speed * normalDt;
          if (planet.y > GAME_HEIGHT + 100) {
            planet.y = -100;
            planet.x = Math.random() * GAME_WIDTH;
          }
        }
      } else {
        if (s.player.x < 0) s.player.x = 0;
        if (s.player.x > GAME_WIDTH - s.player.width)
          s.player.x = GAME_WIDTH - s.player.width;
        if (s.player.y < GAME_HEIGHT * 0.5) s.player.y = GAME_HEIGHT * 0.5;
        if (s.player.y > GAME_HEIGHT - s.player.height)
          s.player.y = GAME_HEIGHT - s.player.height;
      }

      for (let i = s.projectiles.length - 1; i >= 0; i--) {
        if (s.isTransitioning) break;
        s.projectiles[i].x += s.projectiles[i].vx * normalDt;
        s.projectiles[i].y += s.projectiles[i].vy * normalDt;
        if (
          s.projectiles[i].y < 0 ||
          s.projectiles[i].y > GAME_HEIGHT ||
          s.projectiles[i].x < 0 ||
          s.projectiles[i].x > GAME_WIDTH
        ) {
          s.projectiles.splice(i, 1);
        }
      }

      const enemySpeedProgression = Math.max(0, 1 - s.enemies.length / 80);
      const currentSpeed =
        (s.enemySpeedBase + enemySpeedProgression * 2.5) * normalDt;

      let minX = GAME_WIDTH;
      let maxX = 0;

      if (gameState === "playing") {
        for (const enemy of s.enemies) {
          let enemySpeedX = currentSpeed;
          if (enemy.type === "block") enemySpeedX *= 0.3;
          else if (enemy.type === "distraction") enemySpeedX *= 1.5;
          else if (enemy.type === "boss") enemySpeedX *= 1.2;

          let nextX = enemy.x + s.enemyDirection * enemySpeedX;
          if (enemy.type === "distraction") {
            nextX += Math.cos(enemy.offset) * 4 * normalDt;
          }
          if (nextX < minX) minX = nextX;
          if (nextX + enemy.width > maxX) maxX = nextX + enemy.width;
        }
      }

      let hitEdge = false;
      const nowTimestamp = Date.now();
      if (gameState === "playing" && nowTimestamp - s.lastHitEdgeTime > 500) {
        if (minX <= 5 && s.enemyDirection < 0) {
          hitEdge = true;
          s.enemyDirection = 1;
          s.lastHitEdgeTime = nowTimestamp;
          playSound("click");
        } else if (maxX >= GAME_WIDTH - 5 && s.enemyDirection > 0) {
          hitEdge = true;
          s.enemyDirection = -1;
          s.lastHitEdgeTime = nowTimestamp;
          playSound("click");
        }
      }

      if (
        (gameState === "playing" || gameState === "asteroids") &&
        Math.random() <
          (0.02 + s.level * 0.01) * s.difficultyMultiplier * normalDt
      ) {
        const shooters = s.enemies.filter(
          (e) => e.type !== "block" && !e.type.startsWith("asteroid"),
        );
        if (shooters.length > 0) {
          const shooter = shooters[Math.floor(Math.random() * shooters.length)];
          const isBoss = shooter.type === "boss";
          const isFast = shooter.type === "distraction";
          const isRedSun = shooter.variant === 99;
          const variant = shooter.variant || 0;

          let bulletColor = "#ff00ff";
          if (isBoss) {
            bulletColor = isRedSun
              ? "#dc2626"
              : variant === 0
                ? "#ef4444"
                : variant === 1
                  ? "#38bdf8"
                  : "#8b5cf6";
          } else if (isFast) {
            bulletColor = "#fbbf24";
          }
          const projSpeedBase = isFast ? 6 : 4;
          const projSpeed =
            (projSpeedBase + s.level * 0.5) * s.difficultyMultiplier;

          if (isRedSun) {
            // Pattern: Circle of Boredom
            const numBullets = 12;
            const now = Date.now();
            const phase = (now / 1000) % (Math.PI * 2);

            for (let i = 0; i < numBullets; i++) {
              const angle = phase + (i * Math.PI * 2) / numBullets;
              s.projectiles.push({
                x: shooter.x + shooter.width / 2,
                y: shooter.y + shooter.height / 2,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                speed: 3,
                color: bulletColor,
                isEnemy: true,
              });
            }
          } else {
            s.projectiles.push({
              x: shooter.x + shooter.width / 2,
              y: shooter.y + shooter.height,
              vx:
                isBoss && variant === 2
                  ? (s.player.x - shooter.x) * 0.01
                  : isBoss
                    ? (Math.random() - 0.5) * 4
                    : 0,
              vy: projSpeed,
              speed: projSpeed,
              color: bulletColor,
              isEnemy: true,
            });
          }

          if (isBoss) {
            if (variant === 0 && Math.random() < 0.5) {
              for (let d = -1; d <= 1; d += 2) {
                s.projectiles.push({
                  x: shooter.x + shooter.width / 2,
                  y: shooter.y + shooter.height,
                  vx: d * 3,
                  vy: projSpeed * 1.2,
                  speed: projSpeed * 1.2,
                  color: bulletColor,
                  isEnemy: true,
                });
              }
            } else if (variant === 1 && Math.random() < 0.3) {
              for (let i = 0; i < 3; i++) {
                s.projectiles.push({
                  x: shooter.x + shooter.width / 2 + (Math.random() - 0.5) * 20,
                  y: shooter.y + shooter.height,
                  vx: 0,
                  vy: (10 + s.level) * s.difficultyMultiplier,
                  speed: (10 + s.level) * s.difficultyMultiplier,
                  color: bulletColor,
                  isEnemy: true,
                });
              }
            }
          }
        }
      }

      for (const enemy of s.enemies) {
        enemy.offset += 0.05 * normalDt;

        if (gameState === "asteroids") {
          if (enemy.variant === 99) {
            // Sol Rojo Boss movement: descend then hover
            if (enemy.y < 50) {
              enemy.y += 0.5 * normalDt;
            } else {
              enemy.x += Math.cos(s.time * 0.5) * 1.5 * normalDt;
              enemy.y = 50 + Math.sin(s.time * 0.3) * 15;
            }
          } else {
            enemy.x +=
              (enemy.vx || 0) * (1 + s.asteroidModeTimer / 200) * normalDt;
            enemy.y +=
              (enemy.vy || 0) * (1 + s.asteroidModeTimer / 200) * normalDt;

            if (enemy.x < -enemy.width - 20) enemy.x = GAME_WIDTH + 10;
            if (enemy.x > GAME_WIDTH) enemy.x = -enemy.width;
            if (enemy.y < -enemy.height) enemy.y = GAME_HEIGHT;
            if (enemy.y > GAME_HEIGHT) enemy.y = -enemy.height;
          }

          if (
            s.player.x < enemy.x + enemy.width - 5 &&
            s.player.x + s.player.width > enemy.x + 5 &&
            s.player.y < enemy.y + enemy.height - 5 &&
            s.player.y + s.player.height > enemy.y + 5
          ) {
            createExplosion(
              s.player.x + s.player.width / 2,
              s.player.y + s.player.height / 2,
              "#f87171",
              20,
            );
            triggerGameOver();
          }
        } else {
          const moveX = s.enemyDirection * currentSpeed;

          if (hitEdge) {
            if (enemy.type !== "block" && enemy.type !== "boss") {
              enemy.y += 5 * normalDt; // Reduced from 10
            } else if (enemy.type === "boss") {
              enemy.y += 2 * normalDt; // Reduced from 5
            }
            if (enemy.y >= s.player.y - enemy.height) {
              triggerGameOver();
            }
          } else {
            if (enemy.type === "block") {
              enemy.y += (0.1 + s.level * 0.05) * normalDt;
              enemy.x += moveX * 0.3;
            } else if (enemy.type === "distraction") {
              enemy.x += moveX * 1.3; // Reduced from 1.5
              enemy.x += Math.cos(enemy.offset) * 3 * normalDt; // Reduced from 4
              enemy.y += Math.sin(enemy.offset * 2) * 1.5 * normalDt; // Reduced from 2
            } else if (enemy.type === "boss") {
              enemy.x += moveX * 1.2;
              enemy.y += Math.sin(enemy.offset) * 1.5 * normalDt;
            } else {
              enemy.x += moveX;
            }
          }
        }
      }

      for (let i = s.projectiles.length - 1; i >= 0; i--) {
        const proj = s.projectiles[i];
        let hit = false;

        if (proj.isEnemy) {
          if (
            proj.x >= s.player.x &&
            proj.x <= s.player.x + s.player.width &&
            proj.y >= s.player.y &&
            proj.y <= s.player.y + s.player.height
          ) {
            createExplosion(
              s.player.x + s.player.width / 2,
              s.player.y + s.player.height / 2,
              "#f87171",
              20,
            );
            if (s.player.shield > 0) {
              playSound("shield");
              s.player.shield--;
              s.shake = 10;
              s.playerFlash = 10;
              hit = true;
            } else if (s.player.power > 1) {
              playSound("hit");
              s.player.power = 1;
              s.shake = 15;
              s.playerFlash = 15;
              hit = true;
            } else {
              triggerGameOver();
            }
          }
        } else {
          for (let j = s.enemies.length - 1; j >= 0; j--) {
            const enemy = s.enemies[j];
            if (
              proj.x >= enemy.x &&
              proj.x <= enemy.x + enemy.width &&
              proj.y >= enemy.y &&
              proj.y <= enemy.y + enemy.height
            ) {
              hit = true;
              enemy.hp -= 1;
              enemy.hitFlash = 5;

              if (enemy.hp <= 0) {
                playSound("explosion");
                const color =
                  enemy.type === "block"
                    ? "#ef4444"
                    : enemy.type === "distraction"
                      ? "#f59e0b"
                      : enemy.type.startsWith("asteroid")
                        ? "#d4d4d4"
                        : "#6b7280";
                createExplosion(
                  enemy.x + enemy.width / 2,
                  enemy.y + enemy.height / 2,
                  color,
                  20,
                );

                if (enemy.type === "boss") {
                  unlockAchievement("invaders_boss_kill");
                  createExplosion(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    "#ef4444",
                    50,
                  );
                  playSound("powerup");

                  if (enemy.variant === 99) {
                    // Final Boss defeated!
                    localStorage.setItem("invaders_secret_discovered", "true");
                    s.score += 50000;
                    // Huge reward
                    for (let k = 0; k < 15; k++) {
                      s.drops.push({
                        x: enemy.x + Math.random() * enemy.width,
                        y: enemy.y + Math.random() * enemy.height,
                        type: "power",
                      });
                    }
                    // Signal completion
                    s.enemies = [];
                    s.levelUpTimer = 200;
                  } else {
                    for (let k = 0; k < 3; k++) {
                      const types = ["power", "shield", "speed"] as const;
                      s.drops.push({
                        x: enemy.x + Math.random() * enemy.width,
                        y: enemy.y + Math.random() * enemy.height,
                        type: types[k],
                      });
                    }
                  }
                } else if (
                  enemy.type === "asteroid_l" ||
                  enemy.type === "asteroid_m"
                ) {
                  const newType =
                    enemy.type === "asteroid_l" ? "asteroid_m" : "asteroid_s";
                  const newSize = enemy.type === "asteroid_l" ? 50 : 30;
                  for (let k = 0; k < 2; k++) {
                    s.enemies.push({
                      x: enemy.x,
                      y: enemy.y,
                      vx: (enemy.vx || 0) + (Math.random() - 0.5) * 4,
                      vy: (enemy.vy || 0) + (Math.random() - 0.5) * 4,
                      width: newSize,
                      height: newSize,
                      type: newType,
                      hp: 1,
                      maxHp: 1,
                      offset: Math.random() * Math.PI * 2,
                    });
                  }
                }

                // Drop logic with level awareness and difficulty regulation
                // Reduced base chance to avoid item clutter
                const dropChanceBase = s.isAsteroidMode
                  ? 0.15
                  : s.level <= 4
                    ? 0.2
                    : 0.08;
                const diffDropMulti =
                  difficulty === "easy"
                    ? 1.4
                    : difficulty === "hard"
                      ? 0.5
                      : 1.0;
                const dropChance = dropChanceBase * diffDropMulti;

                if (Math.random() < dropChance) {
                  let types: (
                    | "power"
                    | "shield"
                    | "speed"
                    | "magnet"
                    | "repair"
                    | "haste"
                  )[] = ["power"];

                  if (enemy.type.startsWith("asteroid")) {
                    types = ["repair", "magnet", "shield"];
                  } else if (s.level === 1) {
                    types.push("shield", "shield", "power", "magnet");
                  } else if (s.level === 2) {
                    types.push("power", "shield", "speed", "haste");
                  } else if (s.level === 3) {
                    types.push("speed", "magnet", "haste", "shield");
                  } else if (s.level === 4) {
                    types.push("haste", "magnet", "power", "shield", "repair");
                  } else {
                    types.push("shield", "speed", "magnet", "haste");
                    if (Math.random() < 0.08) types.push("repair");
                  }

                  s.drops.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    type: types[Math.floor(Math.random() * types.length)],
                  });
                }

                // Randomly spawn secret drops in Asteroid Mode
                if (s.isAsteroidMode && Math.random() < 0.05) {
                  s.drops.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    type: "secret",
                  });
                }

                s.enemies.splice(j, 1);
                s.score += enemy.maxHp * 10;

                const earnedKarmas = Math.ceil(enemy.maxHp / 2) + s.level;
                s.pendingCoins = (s.pendingCoins || 0) + earnedKarmas;
                createExplosion(
                  enemy.x + enemy.width / 2,
                  enemy.y + enemy.height / 2,
                  "#facc15",
                  earnedKarmas,
                  true,
                );
              } else {
                playSound("hit");
                createExplosion(proj.x, proj.y, "#ffffff", 5);
              }
              break;
            }
          }
        }
        if (hit) s.projectiles.splice(i, 1);
      }

      for (let i = s.drops.length - 1; i >= 0; i--) {
        const drop = s.drops[i];
        if (s.player.magnetTimer > 0) {
          const dx = s.player.x + s.player.width / 2 - drop.x;
          const dy = s.player.y + s.player.height / 2 - drop.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 400) {
            drop.x += (dx / dist) * 12 * normalDt;
            drop.y += (dy / dist) * 12 * normalDt;
          } else {
            drop.y += 3 * normalDt;
          }
        } else {
          drop.y += 3 * normalDt;
        }

        if (
          drop.x > s.player.x &&
          drop.x < s.player.x + s.player.width &&
          drop.y > s.player.y &&
          drop.y < s.player.y + s.player.height
        ) {
          playSound("powerup");
          if (drop.type === "power") {
            s.player.power = Math.min(3, s.player.power + 1);
            s.player.powerTimer = 300;
          } else if (drop.type === "shield") {
            s.player.shield = Math.min(3, s.player.shield + 1);
          } else if (drop.type === "speed") {
            s.player.speedBoostTimer = 300;
          } else if (drop.type === "secret") {
            s.player.power = 4; // MEGA POWER
            s.player.powerTimer = 600;
            s.player.shield = 3;
            playSound("powerup");
          } else if (drop.type === "magnet") {
            s.player.magnetTimer = 400;
          } else if (drop.type === "haste") {
            s.player.hasteTimer = 300;
          } else if (drop.type === "repair") {
            // hull logic doesn't exist as separate hp, we'll give shield
            s.player.shield = Math.min(3, s.player.shield + 2);
          }

          s.drops.splice(i, 1);
          const color =
            drop.type === "shield"
              ? "#3b82f6"
              : drop.type === "speed"
                ? "#facc15"
                : drop.type === "secret"
                  ? "#f472b6"
                  : drop.type === "magnet"
                    ? "#a855f7"
                    : drop.type === "repair"
                      ? "#22c55e"
                      : drop.type === "haste"
                        ? "#f97316"
                        : "#8b5cf6";
          createExplosion(
            s.player.x + s.player.width / 2,
            s.player.y,
            color,
            30,
          );
          continue;
        }
        if (drop.y > GAME_HEIGHT) {
          s.drops.splice(i, 1);
        }
      }

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * normalDt;
        p.y += p.vy * normalDt;
        p.life += normalDt;
        if (p.life >= p.maxLife) s.particles.splice(i, 1);
      }

      if (s.enemies.length === 0 && s.levelUpTimer <= 0 && !s.isTransitioning) {
        if (gameState === "playing") {
          s.isTransitioning = true;
          s.projectiles = [];
          state.current.level++;
          if (state.current.level === 6) unlockAchievement("invaders_level_5");
          s.levelUpTimer = 100;
          if ((state.current.level - 1) % 5 === 0 && state.current.level > 1) {
            setGameState("takeoff");
            setHasDiscoveredSecret(true);
            localStorage.setItem("invaders_secret_discovered", "true");
          } else {
            loadLevel(state.current.level);
          }
        } else if (gameState === "asteroids") {
          if (s.isAsteroidMode) {
             // Endless mode: just spawn more immediately to keep the chaos flowing
             for (let i = 0; i < 4; i++) {
                s.enemies.push({
                  x: Math.random() < 0.5 ? -50 : GAME_WIDTH + 50,
                  y: Math.random() * GAME_HEIGHT,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  width: 80, height: 80,
                  type: "asteroid_l",
                  hp: 2, maxHp: 2,
                  offset: Math.random() * Math.PI * 2
                });
             }
          } else {
            s.isTransitioning = true;
            s.projectiles = [];
            state.current.wave++;
            saveScore();
            playSound("win");

            // Show sequence and either continue asteroids or go back to main gameplay
            if (state.current.wave % 2 === 0) {
              // Every 2 asteroid waves, go back to main game
              s.levelUpTimer = 150;
              loadLevel(state.current.level);
              setGameState("playing");
              if (state.current) state.current.isTransitioning = false;
            } else {
              // Stay in asteroid mode, but reset for next wave
              s.levelUpTimer = 100;
              setTimeout(() => {
                if (state.current) {
                  loadAsteroidsLevel();
                  state.current.isTransitioning = false;
                }
              }, 1500);
            }
          }
        }
      }

      if (hudShield !== s.player.shield) setHudShield(s.player.shield);
      if (hudPower !== s.player.power) setHudPower(s.player.power);
      const turboActive = s.player.speedBoostTimer > 0 ? 1 : 0;
      if (hudTurbo !== turboActive) setHudTurbo(turboActive);

      if (gameState === "asteroids") {
        const currentIntTimer = Math.floor(s.asteroidModeTimer);
        if (hudTimer !== currentIntTimer) setHudTimer(currentIntTimer);
      }
    },
    [
      gameState,
      loadLevel,
      playSound,
      upgrades,
      t,
      unlockAchievement,
      loadAsteroidsLevel,
      hudShield,
      hudPower,
      hudTurbo,
      hudTimer,
      setHudShield,
      setHudPower,
      setHudTurbo,
      setHudTimer,
      setGameState,
      setScore,
      highScore,
      setHighScore,
      setFestCoins,
    ],
  );

  const saveScore = () => {
    const s = state.current;
    if (s.score > highScore) setHighScore(s.score);
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#fdfaf6";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw notebook lines
      ctx.strokeStyle = "#bfdbfe60";
      ctx.lineWidth = 1.5;
      const lineJitter = Math.floor(performance.now() / 200);
      for (let i = 0; i < GAME_HEIGHT; i += 30) {
        ctx.beginPath();
        for (let x = 0; x <= GAME_WIDTH; x += 20) {
          const yOff = Math.sin(x * 0.05 + i + lineJitter) * 1.5;
          if (x === 0) ctx.moveTo(x, i + yOff);
          else ctx.lineTo(x, i + yOff);
        }
        ctx.stroke();
      }

      // Draw red margin line
      ctx.strokeStyle = "#fca5a560";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let y = 0; y <= GAME_HEIGHT; y += 20) {
        const xOff = Math.cos(y * 0.05 + lineJitter) * 1.5;
        if (y === 0) ctx.moveTo(40 + xOff, y);
        else ctx.lineTo(40 + xOff, y);
      }
      ctx.stroke();

      const s = state.current;

      ctx.save();
      if (s.shake > 1) {
        ctx.translate(
          (Math.random() - 0.5) * s.shake,
          (Math.random() - 0.5) * s.shake,
        );
      }

      // Red Sun Boss transition in deep space
      if (gameState === "asteroids" && s.asteroidModeTimer > 280) {
        const intensity = Math.min(0.5, (s.asteroidModeTimer - 280) / 40);
        ctx.fillStyle = `rgba(220, 38, 38, ${intensity})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }

      // Additional doodle background based on type
      if (s.bgType === "grid") {
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.5;
        const lineJitter = Math.floor(performance.now() / 200);
        for (let i = 0; i < GAME_WIDTH; i += 30) {
          ctx.beginPath();
          for (let y = 0; y <= GAME_HEIGHT; y += 20) {
            const xOff = Math.sin(y * 0.05 + i + lineJitter) * 1.5;
            if (y === 0) ctx.moveTo(i + xOff, y);
            else ctx.lineTo(i + xOff, y);
          }
          ctx.stroke();
        }
      } else {
        // Doodle clouds or scribbles in deep space
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(GAME_WIDTH * 0.2, GAME_HEIGHT * 0.3, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.arc(GAME_WIDTH * 0.8, GAME_HEIGHT * 0.7, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw Atmosphere/Earth in takeoff
      if (gameState === "takeoff") {
        const gradient = ctx.createLinearGradient(
          0,
          GAME_HEIGHT,
          0,
          GAME_HEIGHT - 400,
        );
        gradient.addColorStop(0, "#bae6fd");
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Simple doodle earth
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.ellipse(
          GAME_WIDTH / 2,
          GAME_HEIGHT + 800,
          1200,
          900,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.ellipse(
          GAME_WIDTH / 2 + 100,
          GAME_HEIGHT + 850,
          400,
          200,
          0.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      // Draw planets in deep space
      if (gameState === "asteroids") {
        for (const planet of s.planets) {
          ctx.fillStyle = planet.color;
          ctx.globalAlpha = planet.speed * 2;
          ctx.beginPath();
          ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
          ctx.fill();

          // Add a small detail
          ctx.fillStyle = "#ffffff10";
          ctx.beginPath();
          ctx.arc(
            planet.x - planet.size * 0.3,
            planet.y - planet.size * 0.3,
            planet.size * 0.4,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Draw 'stars' (paper dots/speckles)
      ctx.fillStyle = "#94a3b8";
      for (const star of s.stars) {
        ctx.globalAlpha = star.speed / 6;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Player
      // For a doodle effect, base color becomes darker
      const playerBaseColor =
        s.playerFlash > 0
          ? "#ffffff"
          : s.player.power > 1
            ? "#a855f7"
            : selectedChar.color;
      const playerPalette = [
        "#0f172a",
        "#e2e8f0",
        "#64748b",
        playerBaseColor,
        "#94a3b8",
        selectedChar.tailColor,
      ];

      // Support rotation
      if (gameState === "asteroids" || gameState === "takeoff") {
        ctx.save();
        ctx.translate(
          s.player.x + s.player.width / 2,
          s.player.y + s.player.height / 2,
        );
        ctx.rotate(s.player.angle + Math.PI / 2); // Sprite faces up normally, so adjust
        drawSprite(
          ctx,
          sprites.player,
          -s.player.width / 2,
          -s.player.height / 2,
          s.player.width,
          s.player.height,
          playerPalette,
        );

        // Draw rear turret if upgraded or in deep space
        const isDeepSpace = gameState === "asteroids" || s.isAsteroidMode;
        const effectiveTurret = isDeepSpace
          ? Math.max(1, upgrades.rear_turret)
          : upgrades.rear_turret;
        if (effectiveTurret > 0) {
          ctx.fillStyle = isDeepSpace ? "#f472b6" : "#ef4444";
          ctx.fillRect(-5, s.player.height / 2 - 5, 10, 10);
          if (effectiveTurret > 1) {
            ctx.fillRect(-12, s.player.height / 2 - 2, 6, 6);
            ctx.fillRect(6, s.player.height / 2 - 2, 6, 6);
          }
        }
        ctx.restore();
      } else {
        drawSprite(
          ctx,
          sprites.player,
          s.player.x,
          s.player.y,
          s.player.width,
          s.player.height,
          playerPalette,
        );
      }

      // (Removed shadowBlur)

      if (s.player.shield > 0) {
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 2 + Math.sin(s.time * 10) * 1;
        ctx.beginPath();
        ctx.arc(
          s.player.x + s.player.width / 2,
          s.player.y + s.player.height / 2,
          s.player.width / 2 + 5,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }

      // Enemies
      for (const enemy of s.enemies) {
        if (enemy.hitFlash && enemy.hitFlash > 0) enemy.hitFlash--;
        const isHit = (enemy.hitFlash || 0) > 0;

        if (enemy.type === "routine") {
          const palette = isHit
            ? ["#ffffff", "#ffffff", "#ffffff"]
            : ["#1e1b4b", "#4f46e5", "#818cf8"]; // Sketchy pen color
          drawSprite(
            ctx,
            sprites.routine,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            palette,
          );
        } else if (enemy.type === "block") {
          const boxColor =
            enemy.hp === 1 ? "#ef4444" : enemy.hp === 2 ? "#b91c1c" : "#7f1d1d";
          const palette = isHit
            ? ["#ffffff", "#ffffff", "#ffffff"]
            : ["#450a0a", "#fecaca", boxColor]; // Red marker
          drawSprite(
            ctx,
            sprites.block,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            palette,
          );
        } else if (enemy.type === "distraction") {
          const palette = isHit
            ? ["#ffffff", "#ffffff", "#ffffff", "#ffffff"]
            : ["#022c22", "#10b981", "#fbbf24", "#0f172a"]; // Green/yellow highlighter
          drawSprite(
            ctx,
            sprites.distraction,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            palette,
          );
        } else if (enemy.type === "boss") {
          const variant = enemy.variant || 0;
          if (variant === 99) {
            // Sol Rojo del Aburrimiento
            ctx.save();
            ctx.translate(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
            );

            // Outer heat / boredom haze
            const pulse = Math.sin(s.time * 2) * 15 + Math.sin(s.time * 5) * 5;
            const gradient = ctx.createRadialGradient(
              0,
              0,
              10,
              0,
              0,
              enemy.width / 2 + pulse,
            );
            gradient.addColorStop(0, "#ef4444");
            gradient.addColorStop(0.6, "#7f1d1d");
            gradient.addColorStop(1, "transparent");

            ctx.globalAlpha = 0.8;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, enemy.width / 2 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Core
            ctx.fillStyle = "#fdfaf6";
            ctx.beginPath();
            ctx.arc(0, 0, enemy.width / 3, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = "#dc2626";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, enemy.width / 3, 0, Math.PI * 2);
            ctx.stroke();

            // Text marking - Boredom Sun
            ctx.fillStyle = "#dc2626";
            ctx.font = "bold 16px monospace";
            ctx.textAlign = "center";
            ctx.fillText(t("game.invaders.sun_red", "RED SUN"), 0, -5);
            ctx.font = "bold 10px monospace";
            ctx.fillText(t("game.invaders.boredom", "BOREDOM"), 0, 15);

            ctx.restore();
          } else {
            const bossColor =
              variant === 0 ? "#ef4444" : variant === 1 ? "#38bdf8" : "#8b5cf6";
            const metalColor =
              enemy.hp / enemy.maxHp > 0.5 ? "#d4d4d4" : "#fca5a5";
            const palette = isHit
              ? ["#ffffff", "#ffffff"]
              : [bossColor, metalColor];
            drawSprite(
              ctx,
              sprites.boss,
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height,
              palette,
            );
          }
          // Health bar
          ctx.fillStyle = "#333";
          ctx.fillRect(enemy.x, enemy.y - 15, enemy.width, 10);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(
            enemy.x,
            enemy.y - 15,
            enemy.width * (enemy.hp / enemy.maxHp),
            10,
          );
        } else if (enemy.type.startsWith("asteroid")) {
          drawSprite(
            ctx,
            sprites.asteroid,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            ["#1e293b", "#9ca3af", "#d4d4d4"],
          );
        }
      }

      // Drops
      for (const drop of s.drops) {
        const t = drop.type;
        const glowColor =
          t === "secret"
            ? "#f472b6"
            : t === "shield"
              ? "#3b82f6"
              : t === "speed"
                ? "#facc15"
                : t === "magnet"
                  ? "#a855f7"
                  : t === "repair"
                    ? "#22c55e"
                    : t === "haste"
                      ? "#f97316"
                      : "#06b6d4";

        const primaryColor =
          t === "secret"
            ? "#ffffff"
            : t === "shield"
              ? "#60a5fa"
              : t === "speed"
                ? "#fde047"
                : t === "magnet"
                  ? "#d8b4fe"
                  : t === "repair"
                    ? "#4ade80"
                    : t === "haste"
                      ? "#fb923c"
                      : "#d946ef";

        const palette = [
          "#0f172a",
          primaryColor,
          t === "secret" ? "#f472b6" : "#ffffff",
          "#000000",
        ];

        drawSprite(
          ctx,
          sprites.drop,
          drop.x - 10,
          drop.y - 10,
          20,
          20,
          palette,
        );
        if (t === "secret") {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1;
          ctx.strokeRect(drop.x - 12, drop.y - 12, 24, 24);
        }
      }

      // Projectiles
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const projJitter = Math.floor(performance.now() / 80);
      for (const proj of s.projectiles) {
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = proj.isEnemy ? 4 : 3;

        const p1x = proj.x + Math.sin(proj.x + projJitter) * 1.5;
        const p1y = proj.y + Math.cos(proj.y + projJitter) * 1.5;
        const p2x =
          proj.x - proj.vx * 2 + Math.sin(proj.x * 2 + projJitter) * 1.5;
        const p2y =
          proj.y - proj.vy * 2 + Math.cos(proj.y * 2 + projJitter) * 1.5;

        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();
      }

      // Particles
      const partJitter = Math.floor(performance.now() / 100);
      for (const p of s.particles) {
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(p.x, p.y + Math.sin(p.y * 0.1 + partJitter) * 2);
        ctx.rotate(p.life * 0.1);

        if (p.isCoin) {
          ctx.beginPath();
          ctx.rect(-3, -3, 6, 6);
          ctx.fillStyle = p.color;

          ctx.shadowColor = "rgba(0,0,0,0.4)";
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fill();

          ctx.shadowColor = "transparent";
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          const size = Math.max(2, 6 * alpha);
          const ox = Math.sin(p.x + partJitter) * 2;
          const oy = Math.cos(p.y + partJitter) * 2;

          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 1;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(
            -size / 2 + ox - 2,
            -size / 2 + oy - 2,
            size + 4,
            size + 4,
          );

          ctx.shadowColor = "transparent";
          ctx.fillStyle = p.color;
          ctx.fillRect(-size / 2 + ox, -size / 2 + oy, size, size);
        }
        ctx.restore();
        ctx.globalAlpha = 1.0;
      }

      if (state.current.levelUpTimer > 0) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px sans-serif";
        ctx.textAlign = "center";
        ctx.globalAlpha = Math.min(1, state.current.levelUpTimer / 50);
        ctx.fillText(
          `${t("game.invaders.level_up")} ${state.current.level}`,
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2,
        );
        ctx.globalAlpha = 1.0;
      }

      // Draw virtual joystick
      if (gameState === "asteroids" && s.joystick.active) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.joystick.startX, s.joystick.startY, 50, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(252, 211, 77, 0.3)";
        ctx.beginPath();
        const jX =
          s.joystick.startX +
          Math.cos(s.joystick.angle) * Math.min(50, s.joystick.distance);
        const jY =
          s.joystick.startY +
          Math.sin(s.joystick.angle) * Math.min(50, s.joystick.distance);
        ctx.arc(jX, jY, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },
    [t],
  );

  const lastTimeRef = useRef<number>(performance.now());
  const TIME_STEP = 1000 / 60; // 60 FPS target

  const tick = useCallback(
    (time: number) => {
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Smooth update with variable dt (clamped to avoid giant leaps)
      const effectiveDt = Math.min(dt, 50);
      update(effectiveDt);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) draw(ctx);
      }
      if (scoreRefDOM.current) {
        scoreRefDOM.current.innerText = state.current.score
          .toString()
          .padStart(5, "0");
      }

      requestRef.current = requestAnimationFrame(tick);
    },
    [update, draw],
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full min-h-[400px] font-mono p-2 md:p-4 text-zinc-800 relative bg-[#fdfaf6] rounded-xl flex-grow overflow-y-auto custom-scrollbar border-2 border-blue-200 shadow-inner [&.is-fullscreen]:bg-[#fdfaf6] [&.is-fullscreen]:rounded-none [&.is-fullscreen]:border-none"
    >
      {!hideFullscreenButton && (
        <FullscreenButton
          targetRef={containerRef}
          className="top-2 right-2 z-[70] transition-opacity opacity-20 hover:opacity-100"
        />
      )}

      {/* Universal/Manual Pause Overlay */}
      <AnimatePresence>
        {(gameState === "playing" ||
          gameState === "asteroids" ||
          gameState === "takeoff") &&
          (isPausedGlobal || pausedRef.current) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-[#fdfaf6]/90 backdrop-blur-sm flex items-center justify-center flex-col gap-4 text-center p-4 border border-blue-200"
            >
              <div className="flex flex-col items-center gap-2">
                <Target className="w-12 h-12 md:w-16 md:h-16 text-brand-accent animate-pulse" />
                <h2 className="text-zinc-800 font-black text-xl md:text-2xl uppercase tracking-[0.3em]">
                  {isPausedGlobal
                    ? t("game.paused.system")
                    : t("game.invaders.mission_paused")}
                </h2>
              </div>
              <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-bold text-center px-4 md:px-16 leading-relaxed max-w-xs">
                {isPausedGlobal
                  ? t("game.paused.desc")
                  : t("game.paused.manual")}
              </p>
              {!isPausedGlobal && (
                <button
                  aria-label="Resume"
                  onClick={() => {
                    pausedRef.current = false;
                    playSound("start");
                  }}
                  className="bg-brand-accent text-white px-12 py-4 rounded-full font-black uppercase text-sm tracking-[0.3em] hover:bg-brand-accent/80 transition-all shadow-[0_0_30px_rgba(242,74,41,0.4)] active:scale-95"
                >
                  {t("game.invaders.resume_mission")}
                </button>
              )}
            </motion.div>
          )}
      </AnimatePresence>

      {/* Top HUD */}
      <div className="flex justify-between items-center w-full max-w-4xl mb-4 px-2 md:px-6 py-1 md:py-2 text-[8px] md:text-[10px] font-bold shrink-0 relative z-20">
        <div className="flex items-center gap-3 md:gap-6">
          <button
            onClick={() => {
              playSound("hover");
              setShowMobileControls((prev) => !prev);
            }}
            className={`flex items-center gap-1 uppercase font-mono text-[7px] md:text-[9px] font-bold border-2 border-dashed px-2 md:px-3 py-1 md:py-1.5 transition-all outline-none rotate-1 shadow-sm ${showMobileControls ? "bg-yellow-200 border-yellow-500 text-yellow-800" : "bg-white text-zinc-500 border-zinc-300 hover:border-zinc-400"}`}
          >
            <Settings className="w-2.5 h-2.5 md:w-3 md:h-3" />{" "}
            {showMobileControls
              ? t("game.common.controls_on")
              : t("game.common.controls_off")}
          </button>

          <div className="flex items-center gap-1 md:gap-2 bg-white px-4 py-2 border-2 border-blue-200 shadow-[2px_2px_0px_#bfdbfe] -rotate-1 rounded-sm">
            <span className="text-zinc-500 font-mono tracking-tighter uppercase mr-2">
              SCORE
            </span>
            <div
              ref={scoreRefDOM}
              className="text-blue-600 font-mono text-sm md:text-base font-black underline decoration-wavy decoration-blue-300"
            >
              {score}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5 bg-yellow-50 px-3 md:px-4 py-1.5 md:py-2 rounded-sm border-2 border-yellow-200 shadow-[2px_2px_0px_#fef08a] rotate-1">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
              <span className="text-blue-600 font-mono font-bold text-[10px] md:text-sm">
                x{hudShield}
              </span>
            </div>
            <div className="flex items-center gap-1.5 border-l-2 border-yellow-200 pl-3 md:pl-5">
              <Zap className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
              <span className="text-orange-600 font-mono font-bold text-[10px] md:text-sm">
                L{hudPower}
              </span>
            </div>
            {gameState === "asteroids" && (
              <div className="flex items-center gap-1.5 border-l-2 border-yellow-200 pl-3 md:pl-5">
                <Star className="w-3 h-3 md:w-4 md:h-4 text-fuchsia-500 animate-pulse" />
                <span className="text-fuchsia-600 font-mono font-black text-[10px] md:text-sm">
                  {Math.floor(hudTimer / 60)}:
                  {(hudTimer % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <Star className="w-3 h-3 text-yellow-500" /> {highScore}
        </div>
      </div>

      <div className={cn("relative border-x-4 border-b-4 border-blue-200 rounded-b-xl bg-[#fdf8ed] overflow-hidden w-full flex-grow touch-none shadow-sm shadow-blue-900/10", isFullscreen ? "max-w-none max-h-none" : "max-w-4xl max-h-[800px]")}>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-multiply z-10"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
          }}
        ></div>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-full object-contain cursor-none touch-none"
          onMouseMove={(e) => {
            if (
              (gameState === "playing" || gameState === "asteroids") &&
              canvasRef.current
            ) {
              const canvas = canvasRef.current;
              const rect = canvas.getBoundingClientRect();

              const scaleX = canvas.width / canvas.height;
              const scaleY = rect.width / rect.height;

              let displayedWidth = rect.width;
              let displayedHeight = rect.height;

              if (scaleX > scaleY) {
                displayedHeight = rect.width / scaleX;
              } else {
                displayedWidth = rect.height * scaleX;
              }

              const offsetX = (rect.width - displayedWidth) / 2;
              const offsetY = (rect.height - displayedHeight) / 2;

              let x =
                ((e.clientX - rect.left - offsetX) / displayedWidth) *
                canvas.width;
              let y =
                ((e.clientY - rect.top - offsetY) / displayedHeight) *
                canvas.height;

              if (gameState === "asteroids") {
                // In asteroids mode, mouse only rotates, doesn't move directly if not "follow" mode
                const dx =
                  x - (state.current.player.x + state.current.player.width / 2);
                const dy =
                  y -
                  (state.current.player.y + state.current.player.height / 2);

                if (Math.sqrt(dx * dx + dy * dy) > 10) {
                  state.current.player.angle = Math.atan2(dy, dx);
                }
              } else {
                state.current.player.x = x - state.current.player.width / 2;
              }
            }
          }}
          onClick={() => {
            if (gameState === "playing" || gameState === "asteroids") fire();
          }}
          onTouchStart={(e) => {
            if (
              (gameState === "playing" || gameState === "asteroids") &&
              canvasRef.current
            ) {
              const canvas = canvasRef.current;
              const rect = canvas.getBoundingClientRect();
              const touch = e.touches[0];

              const canvasX =
                ((touch.clientX - rect.left) / rect.width) * canvas.width;
              const canvasY =
                ((touch.clientY - rect.top) / rect.height) * canvas.height;

              if (gameState === "asteroids" && canvasX < canvas.width / 2) {
                // Start joystick on left half
                state.current.joystick.active = true;
                state.current.joystick.startX = canvasX;
                state.current.joystick.startY = canvasY;
                state.current.joystick.currentX = canvasX;
                state.current.joystick.currentY = canvasY;
              } else {
                fire();
              }
            }
          }}
          onTouchMove={(e) => {
            if (
              (gameState === "playing" || gameState === "asteroids") &&
              canvasRef.current
            ) {
              e.preventDefault();
              const canvas = canvasRef.current;
              const rect = canvas.getBoundingClientRect();
              const touch = e.touches[0];

              const scaleX = canvas.width / canvas.height;
              const scaleY = rect.width / rect.height;

              let displayedWidth = rect.width;
              let displayedHeight = rect.height;

              if (scaleX > scaleY) {
                displayedHeight = rect.width / scaleX;
              } else {
                displayedWidth = rect.height * scaleX;
              }

              const offsetX = (rect.width - displayedWidth) / 2;
              const offsetY = (rect.height - displayedHeight) / 2;

              let x =
                ((touch.clientX - rect.left - offsetX) / displayedWidth) *
                canvas.width;
              let y =
                ((touch.clientY - rect.top - offsetY) / displayedHeight) *
                canvas.height;

              if (gameState === "asteroids") {
                if (state.current.joystick.active) {
                  const dx = x - state.current.joystick.startX;
                  const dy = y - state.current.joystick.startY;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  state.current.joystick.currentX = x;
                  state.current.joystick.currentY = y;
                  state.current.joystick.distance = dist;
                  if (dist > 5) {
                    state.current.joystick.angle = Math.atan2(dy, dx);
                  }
                } else {
                  // Fallback for right-side touch movement or simple follow
                  const dx =
                    x -
                    (state.current.player.x + state.current.player.width / 2);
                  const dy =
                    y -
                    (state.current.player.y + state.current.player.height / 2);

                  if (Math.sqrt(dx * dx + dy * dy) > 10) {
                    state.current.player.angle = Math.atan2(dy, dx);
                  }

                  const moveSpeed = 0.2; // Smooth follow
                  state.current.player.x += dx * moveSpeed;
                  state.current.player.y += dy * moveSpeed;
                }
              } else {
                state.current.player.x = x - state.current.player.width / 2;
              }
            }
          }}
          onTouchEnd={() => {
            state.current.joystick.active = false;
            state.current.joystick.distance = 0;
          }}
        />

        {/* Note paper lines are drawn on the canvas itself */}

        <AnimatePresence>
          {gameState === "start" && (
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#fdfaf6]/95 backdrop-blur-md z-50 pointer-events-auto overflow-y-auto"
            >
              <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-2xl flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  <div className="flex-1 text-left flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 border border-blue-300 shadow-sm">
                      <Zap className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-4xl md:text-5xl font-display text-zinc-900 mb-2 uppercase tracking-tighter relative inline-block -rotate-2 bg-yellow-200 px-4 py-2 border-2 border-dashed border-yellow-400 shadow-sm">
                      {t("game.invaders.subtitle", "Doodle Invaders").split(' ')[0]}
                      <br />
                      {t("game.invaders.subtitle", "Doodle Invaders").split(' ').slice(1).join(' ')}
                      <span className="absolute -top-4 -right-8 rotate-12 text-[10px] bg-red-600 text-white font-mono font-bold px-2 py-1 shadow-[2px_2px_0px_#7f1d1d]">
                        {t("game.invaders.by_you", "BY YOU")}
                      </span>
                    </h3>
                    <p className="text-zinc-600 text-xs font-mono max-w-xs mb-4 leading-relaxed">
                      {t("game.invaders.instruction.desc", {
                        blocks: t("game.invaders.instruction.blocks"),
                        distractions: t(
                          "game.invaders.instruction.distractions",
                        ),
                        routine: t("game.invaders.instruction.routine"),
                      })
                        .split(/(\{\{.*?\}\})/)
                        .map((part, i) => {
                          if (part === "{{blocks}}")
                            return (
                              <span key={i} className="text-red-500 font-bold">
                                {t("game.invaders.instruction.blocks")}
                              </span>
                            );
                          if (part === "{{distractions}}")
                            return (
                              <span
                                key={i}
                                className="text-yellow-500 font-bold"
                              >
                                {t("game.invaders.instruction.distractions")}
                              </span>
                            );
                          if (part === "{{routine}}")
                            return (
                              <span key={i} className="text-gray-400 font-bold">
                                {t("game.invaders.instruction.routine")}
                              </span>
                            );
                          return part;
                        })}
                    </p>
                    <div className="text-yellow-500 font-mono text-sm tracking-widest flex items-center gap-2 mt-auto">
                      <Zap className="w-4 h-4" /> {festCoins}{" "}
                      {t("game.invaders.karmas")}
                    </div>
                    <div className="text-brand-accent font-mono text-[10px] tracking-widest flex items-center gap-2 mt-2">
                      {t("game.invaders.highscore")} {highScore}
                    </div>
                    <div
                      className="mt-2 text-brand-accent font-mono text-[10px] tracking-widest flex items-center gap-2 cursor-pointer hover:underline"
                      onClick={() => setShowMobileControls((prev) => !prev)}
                    >
                      <Settings className="w-3 h-3" />{" "}
                      {showMobileControls
                        ? t("game.common.controls_on")
                        : t("game.common.controls_off")}
                    </div>

                    <div className="mt-6 flex flex-col gap-2 w-full max-w-[200px]">
                      <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
                        {t("game.invaders.difficulty")}
                      </p>
                      <div className="flex gap-1 p-1 bg-white border border-blue-100 rounded-lg shadow-inner">
                        {(["easy", "normal", "hard"] as const).map((d) => (
                          <button
                            key={d}
                            aria-label={`Difficulty: ${d}`}
                            onClick={() => {
                              setDifficulty(d);
                              playSound("hover");
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-md font-mono text-[9px] uppercase tracking-tighter transition-all ${
                              difficulty === d
                                ? "bg-blue-500 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                            }`}
                          >
                            {t(`game.difficulty.${d}`, d)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                      <button
                        aria-label="Toggle Mobile Controls"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMobileControls((prev) => !prev);
                          playSound("click");
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-widest transition-all ${showMobileControls ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}
                      >
                        <Settings className="w-3 h-3" />
                        {showMobileControls
                          ? t("game.common.controls_on")
                          : t("game.common.controls_off")}
                      </button>
                    </div>
                    <div className="flex gap-2 mt-4 ml-2">
                      <button
                        aria-label="Store Tab Pencils"
                        onClick={() => setStoreTab("chars")}
                        className={`px-4 py-2 text-[10px] uppercase font-bold font-mono tracking-widest transition-all border-2 border-b-0 rounded-t-lg -mb-1 relative z-10 ${storeTab === "chars" ? "bg-yellow-100 border-yellow-300 text-yellow-800 rotate-1 shadow-[2px_0px_0px_#fde047]" : "bg-zinc-100 border-zinc-200 text-zinc-400 mt-1 cursor-pointer"}`}
                      >
                        Pencils
                      </button>
                      <button
                        aria-label="Store Tab Upgrades"
                        onClick={() => setStoreTab("upgrades")}
                        className={`px-4 py-2 text-[10px] uppercase font-bold font-mono tracking-widest transition-all border-2 border-b-0 rounded-t-lg -mb-1 relative z-10 ${storeTab === "upgrades" ? "bg-yellow-100 border-yellow-300 text-yellow-800 -rotate-1 shadow-[-2px_0px_0px_#fde047]" : "bg-zinc-100 border-zinc-200 text-zinc-400 mt-1 cursor-pointer"}`}
                      >
                        Upgrades
                      </button>
                    </div>

                    {(hasDiscoveredSecret ||
                      secretCode.trim().toLowerCase() === "asteroid") && (
                      <button
                        aria-label="Enter Deep Space"
                        onClick={(e) => {
                          e.preventDefault();
                          playSound("powerup");
                          setIsAsteroidMode(true);
                          setHasDiscoveredSecret(true);
                          localStorage.setItem("invaders_secret_discovered", "true");
                          setSecretCode("");
                          initGame("takeoff");
                          if (state.current) {
                            state.current.score += 1000;
                            state.current.isAsteroidMode = true;
                            state.current.bgType = "deep";
                          }
                        }}
                        className="mt-6 w-full max-w-[200px] py-1.5 bg-purple-100 border border-purple-300 rounded text-purple-700 font-mono text-[8px] uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2 group"
                      >
                        <Star className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                        {t("game.invaders.enter_deep_space") || "DEEP SPACE"}
                      </button>
                    )}

                    <form
                      onSubmit={handleSecretSubmit}
                      className="mt-6 flex gap-2 w-full max-w-[200px]"
                    >
                      <input
                        type="text"
                        aria-label="Secret Code"
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value)}
                        placeholder={t(
                          "game.invaders.secret_code",
                          "SECRET CODE",
                        )}
                        className="flex-1 bg-white border border-blue-200 rounded px-2 py-1 text-[8px] font-mono uppercase tracking-widest focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <button
                        aria-label="Submit Secret Code"
                        type="submit"
                        className="bg-blue-100 border border-blue-300 text-blue-600 px-2 py-1 rounded text-[8px] font-mono uppercase hover:bg-blue-500 hover:text-white transition-all"
                      >
                        OK
                      </button>
                    </form>
                  </div>

                  <div className="flex-1 w-full bg-[#fdf8ed] border-2 border-yellow-300 rounded p-6 relative shadow-sm h-full flex flex-col justify-center">
                    {/* Fake tape at the top */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 border border-white/60 shadow-sm backdrop-blur-[2px] -rotate-2 z-20" />

                    {storeTab === "chars" ? (
                      <>
                        <div className="flex justify-between items-center w-full mb-6">
                          <button
                            aria-label="Previous Character"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound("hover");
                              const currentIndex = CHARACTERS.findIndex(
                                (c) => c.id === selectedCharId,
                              );
                              const prevIndex =
                                (currentIndex - 1 + CHARACTERS.length) %
                                CHARACTERS.length;
                              setSelectedCharId(CHARACTERS[prevIndex].id);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors z-10 cursor-pointer pointer-events-auto"
                          >
                            &lt;
                          </button>

                          <div className="flex-1 flex flex-col items-center justify-center pointer-events-none px-4">
                            <div
                              className="w-24 h-24 mb-4 flex items-center justify-center relative bg-zinc-50 border-2 rounded-lg"
                              style={{
                                borderColor: `${selectedChar.color}50`,
                                backgroundColor: `${selectedChar.color}15`,
                              }}
                            >
                              <div className="w-16 h-16 grid grid-rows-8 grid-cols-8 gap-0 relative z-10 mx-auto">
                                {sprites.player.flatMap((row, r) =>
                                  row.map((val, c) => (
                                    <div
                                      key={`${r}-${c}`}
                                      style={{
                                        backgroundColor:
                                          val > 0
                                            ? [
                                                "#0f172a",
                                                "#e2e8f0",
                                                "#64748b",
                                                selectedChar.color,
                                                "#94a3b8",
                                                selectedChar.tailColor,
                                              ][val - 1]
                                            : "transparent",
                                      }}
                                    />
                                  )),
                                )}
                              </div>
                            </div>
                            <p className="text-sm font-mono text-zinc-800 uppercase tracking-widest">
                              {t(selectedChar.nameKey)}
                            </p>
                            <p className="text-[10px] font-mono text-zinc-500 mt-2 h-10 text-center">
                              {t(selectedChar.descKey)}
                            </p>
                          </div>

                          <button
                            aria-label="Next Character"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound("hover");
                              const currentIndex = CHARACTERS.findIndex(
                                (c) => c.id === selectedCharId,
                              );
                              const nextIndex =
                                (currentIndex + 1) % CHARACTERS.length;
                              setSelectedCharId(CHARACTERS[nextIndex].id);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors z-10 cursor-pointer pointer-events-auto"
                          >
                            &gt;
                          </button>
                        </div>

                        <div className="w-full flex justify-center">
                          {unlockedChars.includes(selectedCharId) ? (
                            <div className="flex flex-col gap-3 w-full">
                              <button
                                aria-label="Start Game"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  initGame();
                                }}
                                className="w-full bg-blue-500 text-white font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-xl border-2 border-blue-700 flex justify-center items-center gap-3 hover:bg-blue-400 transition-all shadow-[4px_4px_0px_#1d4ed8] active:translate-y-1 active:translate-x-1 active:shadow-none cursor-pointer pointer-events-auto -rotate-1"
                              >
                                <Play size={18} /> {t("game.invaders.start_game") || "START GAME"}
                              </button>
                              {hasDiscoveredSecret && (
                                <button
                                  aria-label="Start Deep Space"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSound("powerup");
                                    setIsAsteroidMode(true);
                                    initGame("takeoff");
                                    if (state.current) {
                                      state.current.score += 1000;
                                      state.current.isAsteroidMode = true;
                                      state.current.bgType = "deep";
                                    }
                                  }}
                                  className="w-full bg-purple-600 text-white font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-xl border-2 border-purple-800 flex justify-center items-center gap-3 hover:bg-purple-500 transition-all shadow-[4px_4px_0px_#6b21a8] active:translate-y-1 active:translate-x-1 active:shadow-none cursor-pointer pointer-events-auto rotate-1"
                                >
                                  <Star size={18} /> DEEP SPACE
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              aria-label={`Buy ${selectedChar.nameKey}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                buyChar(selectedChar);
                              }}
                              className={`w-full font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-xl border-2 flex justify-center items-center transition-all cursor-pointer pointer-events-auto rotate-1 ${festCoins >= selectedChar.price ? "bg-yellow-400 text-zinc-900 border-yellow-600 hover:bg-yellow-300 shadow-[4px_4px_0px_#ca8a04] active:translate-y-1 active:translate-x-1 active:shadow-none" : "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300 shadow-[4px_4px_0px_#94a3b8]"}`}
                            >
                              {t("game.invaders.unlock")} - {selectedChar.price}{" "}
                              {t("game.invaders.karmas")}
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-4 text-left">
                        {[
                          {
                            id: "shield",
                            icon: Shield,
                            name: t("game.invaders.upgrade.shield.name", "Outline (Shield)"),
                            price: 1000 * (upgrades.shield + 1),
                          },
                          {
                            id: "power",
                            icon: Zap,
                            name: t("game.invaders.upgrade.power.name", "Bold Ink (Power)"),
                            price: 2000 * (upgrades.power + 1),
                          },
                          {
                            id: "speed",
                            icon: Star,
                            name: t("game.invaders.upgrade.speed.name", "Quick Stroke (Speed)"),
                            price: 1500 * (upgrades.speed + 1),
                          },
                          ...(hasDiscoveredSecret
                            ? [
                                {
                                  id: "rear_turret",
                                  icon: RefreshCw,
                                  name: t("game.invaders.upgrade.rear_turret.name", "Back Eraser"),
                                  price: 3000 * (upgrades.rear_turret + 1),
                                },
                              ]
                            : []),
                        ].map((upg) => (
                          <div
                            key={upg.id}
                            className="flex items-center justify-between bg-zinc-50 p-3 border border-blue-100 rounded-lg shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
                                <upg.icon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-800 font-bold uppercase tracking-widest">
                                  {upg.name}
                                </p>
                                <p className="text-[8px] text-zinc-500">
                                  {t("game.invaders.level")}{" "}
                                  {upgrades[upg.id as keyof typeof upgrades]}
                                </p>
                              </div>
                            </div>
                            <button
                              aria-label={`Upgrade ${upg.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  festCoins >= upg.price &&
                                  upgrades[upg.id as keyof typeof upgrades] < 5
                                ) {
                                  setFestCoins((prev) => prev - upg.price);
                                  setUpgrades((prev) => ({
                                    ...prev,
                                    [upg.id]:
                                      prev[upg.id as keyof typeof upgrades] + 1,
                                  }));
                                  playSound("purchase");
                                } else {
                                  playSound("alert");
                                }
                              }}
                              className={`px-3 py-1.5 text-[8px] font-bold rounded flex items-center gap-1 transition-all pointer-events-auto cursor-pointer ${festCoins >= upg.price && upgrades[upg.id as keyof typeof upgrades] < 5 ? "bg-green-500 text-white hover:bg-green-600 shadow-sm" : "bg-slate-200 text-slate-400 border border-slate-300"}`}
                            >
                              <Zap className="w-3 h-3 text-blue-600" />{" "}
                              <span className="text-zinc-800">{upg.price}</span>
                            </button>
                          </div>
                        ))}
                        <p className="text-[7px] text-zinc-500 text-center mt-2 italic uppercase">
                          {t("game.invaders.upgrade.desc")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === "gameover" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#fdfaf6]/95 backdrop-blur-md flex flex-col items-center justify-center border-4 border-red-200 pointer-events-auto z-50"
            >
              <h3 className="text-4xl md:text-5xl font-display text-red-600 mb-2 uppercase tracking-tighter drop-shadow-sm -rotate-2">
                {t("game.invaders.drained", "OUT OF INK!")}
              </h3>
              <p className="text-red-400 font-mono mb-8 uppercase tracking-widest text-sm rotate-1">
                {t("game.invaders.gameover", "Your pen dried out.")}
              </p>
              <p className="text-zinc-600 font-mono mb-8 -rotate-1">
                {t("game.invaders.finalscore", "Final Score:")}{" "}
                <span className="text-red-600 text-2xl font-black ml-2 underline decoration-wavy decoration-red-400">
                  {score}
                </span>
              </p>
              <div className="flex flex-col gap-3 w-full max-w-[240px]">
                  <button
                    aria-label="Try Again"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      initGame();
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      initGame();
                    }}
                    className="w-full bg-red-500 text-white border-2 border-red-700 font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-[4px_4px_0px_#b91c1c] active:translate-y-1 active:translate-x-1 active:shadow-none relative z-50 cursor-pointer pointer-events-auto rotate-1"
                  >
                    <RefreshCw size={18} /> {t("game.invaders.tryagain", "Draw Again")}
                  </button>
                  {onFinish && (
                    <button
                      aria-label="BACK TO MENU"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFinish();
                      }}
                      className="w-full text-zinc-400 text-[10px] py-1 font-mono uppercase tracking-[0.2em] hover:text-zinc-800 transition-colors"
                    >
                      BACK TO MENU
                    </button>
                  )}
              </div>
            </motion.div>
          )}

          {gameState === "takeoff" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50"
            >
              <h3 className="text-4xl font-display text-blue-600 animate-pulse uppercase tracking-[0.2em] font-black -rotate-3 text-center">
                {t("game.invaders.flipping", "Flipping Page...")}
              </h3>
              <p className="text-zinc-500 font-mono mt-4 uppercase tracking-[0.4em] text-[10px] animate-bounce font-bold rotate-2">
                {t("game.invaders.finding", "Finding clean space...")}
              </p>
            </motion.div>
          )}

          {gameState === "win" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#fdfaf6]/95 backdrop-blur-md flex flex-col items-center justify-center border-4 border-emerald-200 pointer-events-auto z-50"
            >
              <h3 className="text-4xl md:text-5xl font-display text-emerald-600 mb-2 uppercase tracking-tighter drop-shadow-sm -rotate-3">
                {t("game.invaders.masterpiece", "MASTERPIECE!")}
              </h3>
              <p className="text-emerald-500 font-mono mb-8 uppercase tracking-widest text-sm rotate-1">
                {t("game.invaders.win", "The page is fully drawn.")}
              </p>
              <p className="text-zinc-600 font-mono mb-8 rotate-1">
                {t("game.invaders.finalscore", "Final Score:")}{" "}
                <span className="text-emerald-600 text-2xl font-black ml-2 underline decoration-wavy decoration-emerald-400">
                  {score}
                </span>
              </p>
              <div className="flex flex-col gap-3 w-full max-w-[240px]">
                  <button
                    aria-label="Draw More"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      initGame();
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      initGame();
                    }}
                    className="w-full bg-emerald-500 text-white border-2 border-emerald-700 font-black font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-[4px_4px_0px_#047857] active:translate-y-1 active:translate-x-1 active:shadow-none relative z-50 cursor-pointer pointer-events-auto -rotate-1"
                  >
                    <RefreshCw size={18} /> Draw More
                  </button>
                  {onFinish && (
                    <button
                      aria-label="BACK TO MENU"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFinish();
                      }}
                      className="w-full text-zinc-400 text-[10px] py-1 font-mono uppercase tracking-[0.2em] hover:text-zinc-800 transition-colors"
                    >
                      BACK TO MENU
                    </button>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showMobileControls &&
          (gameState === "playing" ||
            gameState === "asteroids" ||
            gameState === "takeoff") && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              {/* Movement Controls (Left) - Compact Joystick Area */}
              <div className="absolute bottom-6 left-6 flex flex-col gap-1 opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex gap-1 justify-center">
                  <button
                    aria-label="Move Up"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingUp = true;
                    }}
                    onMouseUp={() => (state.current.player.isMovingUp = false)}
                    onMouseLeave={() =>
                      (state.current.player.isMovingUp = false)
                    }
                    onTouchStart={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingUp = true;
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingUp = false;
                    }}
                    className="w-12 h-12 bg-black/5 backdrop-blur-sm border border-black/20 rounded-full flex items-center justify-center active:bg-black/10 transition-all pointer-events-auto shadow-sm"
                  >
                    <ChevronUp className="text-zinc-600 w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    aria-label="Move Left"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingLeft = true;
                    }}
                    onMouseUp={() =>
                      (state.current.player.isMovingLeft = false)
                    }
                    onMouseLeave={() =>
                      (state.current.player.isMovingLeft = false)
                    }
                    onTouchStart={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingLeft = true;
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingLeft = false;
                    }}
                    className="w-12 h-12 bg-black/5 backdrop-blur-sm border border-black/20 rounded-full flex items-center justify-center active:bg-black/10 transition-all pointer-events-auto shadow-sm"
                  >
                    <ChevronLeft className="text-zinc-600 w-5 h-5" />
                  </button>
                  <div className="w-12 h-12" /> {/* Center hole */}
                  <button
                    aria-label="Move Right"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingRight = true;
                    }}
                    onMouseUp={() =>
                      (state.current.player.isMovingRight = false)
                    }
                    onMouseLeave={() =>
                      (state.current.player.isMovingRight = false)
                    }
                    onTouchStart={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingRight = true;
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingRight = false;
                    }}
                    className="w-12 h-12 bg-black/5 backdrop-blur-sm border border-black/20 rounded-full flex items-center justify-center active:bg-black/10 transition-all pointer-events-auto shadow-sm"
                  >
                    <ChevronRight className="text-zinc-600 w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-1 justify-center">
                  <button
                    aria-label="Move Down"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingDown = true;
                    }}
                    onMouseUp={() =>
                      (state.current.player.isMovingDown = false)
                    }
                    onMouseLeave={() =>
                      (state.current.player.isMovingDown = false)
                    }
                    onTouchStart={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingDown = true;
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      state.current.player.isMovingDown = false;
                    }}
                    className="w-12 h-12 bg-black/5 backdrop-blur-sm border border-black/20 rounded-full flex items-center justify-center active:bg-black/10 transition-all pointer-events-auto shadow-sm"
                  >
                    <ChevronDown className="text-zinc-600 w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Fire Button (Right) - More Minimal */}
              <div className="absolute bottom-10 right-10 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <button
                  aria-label="Fire"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    fire();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    fire();
                  }}
                  className="w-20 h-20 bg-blue-100 backdrop-blur-sm border border-blue-300 rounded-full flex items-center justify-center active:bg-blue-200 transition-all pointer-events-auto shadow-sm"
                >
                  <Zap className="w-8 h-8 text-blue-600" />
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
