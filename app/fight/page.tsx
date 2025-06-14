"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { fighters } from "@/lib/fighters"
import { useKeyboardControls } from "@/hooks/use-keyboard-controls"
import { FightControls } from "@/components/fight-controls"
import { PowerBar } from "@/components/power-bar"
import { Fighter } from "@/components/fighter"
import { getRandomFighter } from "@/lib/game-utils"
import { getRandomStageBackground } from "@/lib/stage-utils"

// Define fighter state types
type FighterState = "idle" | "jump" | "duck" | "punch" | "kick" | "defence" | "jumpKick"

const FIGHTER_WIDTH = 140
const PLAYER2_FIGHTER_WIDTH = 140

export default function FightScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const playerId = searchParams.get("player") || fighters[0].id
  const playerFighter = fighters.find((f) => f.id === playerId) || fighters[0]

  // Get previous opponents from URL
  const previousOpponentsParam = searchParams.get("prevOpponents") || ""
  const previousOpponents = previousOpponentsParam ? previousOpponentsParam.split(",") : []

  // Use useRef to store the CPU fighter so it doesn't change during the game
  const cpuFighterRef = useRef(getRandomFighter(playerId, previousOpponents))
  const cpuFighter = cpuFighterRef.current

  // Get a random stage background
  const stageBackgroundRef = useRef(getRandomStageBackground())
  const stageBackground = stageBackgroundRef.current

  const [playerHealth, setPlayerHealth] = useState(100)
  const [cpuHealth, setCpuHealth] = useState(100)
  const [playerPosition, setPlayerPosition] = useState(150) // 150px from left edge
  const [cpuPosition, setCpuPosition] = useState(150) // 150px from right edge
  const [playerState, setPlayerState] = useState<FighterState>("idle")
  const [cpuState, setCpuState] = useState<FighterState>("idle")
  const [playerJumpDirection, setPlayerJumpDirection] = useState<"left" | "right" | null>(null)
  const [isPlayerDefending, setIsPlayerDefending] = useState(false)
  const [isPlayerFacingLeft, setIsPlayerFacingLeft] = useState(false)
  const [isCpuFacingLeft, setIsCpuFacingLeft] = useState(true) // Start facing left (towards player)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<"player" | "cpu" | null>(null)

  // Add these new state variables near the top of the component
  const roundCount = Number.parseInt(searchParams.get("round") || "1", 10)
  const difficulty = Number.parseFloat(searchParams.get("difficulty") || "1.0")

  // Add state for tracking when fighters are hit
  const [isPlayerHit, setIsPlayerHit] = useState(false)
  const [isCpuHit, setIsCpuHit] = useState(false)

  // Add state for walking animation
  const [isPlayerWalking, setIsPlayerWalking] = useState(false)
  const [isCpuWalking, setIsCpuWalking] = useState(false)

  // Add state to track if jump key was just pressed
  const [jumpKeyPressed, setJumpKeyPressed] = useState(false)

  // Add state for jump kicking
  const [isPlayerJumpKicking, setIsPlayerJumpKicking] = useState(false)

  // Add state to track player's last action for CPU to react
  const [playerLastAction, setPlayerLastAction] = useState<FighterState>("idle")

  // Add state to track CPU movement
  const [cpuMovementTimer, setCpuMovementTimer] = useState(0)
  const [cpuIdleTime, setCpuIdleTime] = useState(0)
  const [cpuAttackCooldown, setCpuAttackCooldown] = useState(false)

  // Track key press for single tap movement
  const [arrowLeftPressed, setArrowLeftPressed] = useState(false)
  const [arrowRightPressed, setArrowRightPressed] = useState(false)

  // Add pause state
  const [isPaused, setIsPaused] = useState(false)

  const gameLoopRef = useRef<number | null>(null)
  const cpuMovementRef = useRef<number | null>(null)
  const lastCpuActionRef = useRef(Date.now())
  const movementIntervalRef = useRef<number | null>(null)
  const hitCooldownRef = useRef(false)

  // Set up keyboard controls
  const { isKeyDown, resetKeys } = useKeyboardControls()

  // Calculate actual positions for hit detection - slightly reduced hit area
  const getPlayerCenterX = () => playerPosition + 70
  const getCpuCenterX = () => window.innerWidth - cpuPosition - 70

  // Fighter collision detection - define collision boxes
  const FIGHTER_COLLISION_WIDTH = 100 // Width of fighter collision box
  const PLAYER2_FIGHTER_COLLISION_WIDTH = 90 // Slightly smaller hit area for Player 2

  // Check if fighters are colliding
  const checkCollision = () => {
    // Only check collision when both fighters are on the ground (not jumping)
    if ((playerState as FighterState) === "jump" || (cpuState as FighterState) === "jump") {
      return false
    }

    const playerRight = playerPosition + FIGHTER_COLLISION_WIDTH
    const cpuLeft = window.innerWidth - cpuPosition - PLAYER2_FIGHTER_COLLISION_WIDTH

    // If player's right edge is past CPU's left edge, they're colliding
    return playerRight >= cpuLeft
  }

  // Handle single tap movement for player
  useEffect(() => {
    // Handle single tap for left arrow
    if (
      isKeyDown.ArrowLeft &&
      !arrowLeftPressed &&
      playerState !== "jump" &&
      playerState !== "defence" &&
      playerState !== "duck"
    ) {
      setArrowLeftPressed(true)
      setIsPlayerFacingLeft(true)
      // Set walking animation when moving
      setIsPlayerWalking(true)

      // Calculate new position
      const newPosition = Math.max(playerPosition - 20, 50)

      // Check if this movement would cause collision
      const playerRight = newPosition + FIGHTER_COLLISION_WIDTH
      const cpuLeft = window.innerWidth - cpuPosition - PLAYER2_FIGHTER_COLLISION_WIDTH

      // Only move if it won't cause collision
      if ((playerState as FighterState) === "jump" || playerRight < cpuLeft) {
        setPlayerPosition(newPosition)
      }
    }
    if (!isKeyDown.ArrowLeft && arrowLeftPressed) {
      setArrowLeftPressed(false)
      // Stop walking animation if both movement keys are up
      if (!isKeyDown.ArrowRight) setIsPlayerWalking(false)
    }

    // Handle single tap for right arrow
    if (
      isKeyDown.ArrowRight &&
      !arrowRightPressed &&
      playerState !== "jump" &&
      playerState !== "defence" &&
      playerState !== "duck"
    ) {
      setArrowRightPressed(true)
      setIsPlayerFacingLeft(false)
      // Set walking animation when moving
      setIsPlayerWalking(true)

      // Calculate new position
      const newPosition = Math.min(playerPosition + 20, window.innerWidth - 150)

      // Check if this movement would cause collision
      const playerRight = newPosition + FIGHTER_COLLISION_WIDTH
      const cpuLeft = window.innerWidth - cpuPosition - PLAYER2_FIGHTER_COLLISION_WIDTH

      // Only move if it won't cause collision
      if ((playerState as FighterState) === "jump" || playerRight < cpuLeft) {
        setPlayerPosition(newPosition)
      }
    }
    if (!isKeyDown.ArrowRight && arrowRightPressed) {
      setArrowRightPressed(false)
      // Stop walking animation if both movement keys are up
      if (!isKeyDown.ArrowLeft) setIsPlayerWalking(false)
    }
  }, [
    isKeyDown.ArrowLeft,
    isKeyDown.ArrowRight,
    arrowLeftPressed,
    arrowRightPressed,
    playerState,
    playerPosition,
    cpuPosition,
  ])

  // CPU movement logic - separate from main game loop for more frequent movement
  useEffect(() => {
    if (gameOver || isPaused) return

    // CPU movement loop - runs more frequently than the main game loop
    cpuMovementRef.current = window.setInterval(() => {
      // Don't move if CPU is in the middle of an action
      if ((cpuState as FighterState) !== "idle") return

      // Get positions for calculations
      const cpuCenterX = getCpuCenterX()
      const playerCenterX = getPlayerCenterX()

      // Always update CPU facing direction based on player position
      // CPU should face left when player is to the left
      setIsCpuFacingLeft(cpuCenterX < playerCenterX)

      // Check if player is nearby for attack
      const isPlayerNearby = Math.abs(cpuCenterX - playerCenterX) < 170

      // If player is nearby and not on cooldown, attempt to attack
      if (isPlayerNearby && !cpuAttackCooldown && (cpuState as FighterState) === "idle") {
        const attackChance = Math.random()

        if (attackChance < 0.6) {
          // 60% chance to attack when close
          setCpuAttackCooldown(true)
          // Stop walking animation during attack
          setIsCpuWalking(false)

          // Choose attack type
          if (attackChance < 0.3) {
            // Punch
            setCpuState("punch")

            // Check if hit - CANNOT hit jumping player with punch
            // If player is defending, they take reduced damage (1%)
            if (
              Math.abs(cpuCenterX - playerCenterX) < 140 &&
              (playerState as FighterState) !== "jump" &&
              !hitCooldownRef.current &&
              // CPU must be facing the player to hit
              ((cpuCenterX < playerCenterX && isCpuFacingLeft) || (cpuCenterX > playerCenterX && !isCpuFacingLeft))
            ) {
              // If player is defending, they take reduced damage (1%)
              if ((playerState as FighterState) === "defence") {
                setPlayerHealth((prev) => Math.max(0, prev - 1)) // 1% damage when defending
                // Don't set isPlayerHit when defending - keep defense sprite
              } else {
                // Apply difficulty multiplier to damage
                const damageMultiplier = difficulty
                setPlayerHealth((prev) => Math.max(0, prev - Math.round(5 * damageMultiplier))) // Scaled damage
                setIsPlayerHit(true)
                setTimeout(() => setIsPlayerHit(false), 300)
              }

              hitCooldownRef.current = true
              setTimeout(() => {
                hitCooldownRef.current = false
              }, 500)

              if (playerHealth - (playerState === "defence" ? 1 : Math.round(5 * difficulty)) <= 0) {
                endGame("cpu")
              }
            }

            setTimeout(() => {
              setCpuState("idle")
              setTimeout(() => setCpuAttackCooldown(false), 300) // Short cooldown after attack
            }, 300)
          } else if (attackChance < 0.5) {
            // Kick
            setCpuState("kick")

            // Check if hit - CANNOT hit ducking player with kick
            // If player is defending, they take reduced damage (1%)
            if (
              Math.abs(cpuCenterX - playerCenterX) < 170 &&
              (playerState as FighterState) !== "jump" &&
              (playerState as FighterState) !== "duck" && // Added check for ducking
              !hitCooldownRef.current &&
              // CPU must be facing the player to hit
              ((cpuCenterX < playerCenterX && isCpuFacingLeft) || (cpuCenterX > playerCenterX && !isCpuFacingLeft))
            ) {
              // If player is defending, they take reduced damage (1%)
              if ((playerState as FighterState) === "defence") {
                setPlayerHealth((prev) => Math.max(0, prev - 1)) // 1% damage when defending
                // Don't set isPlayerHit when defending - keep defense sprite
              } else {
                // Apply difficulty multiplier to damage
                const damageMultiplier = difficulty
                setPlayerHealth((prev) => Math.max(0, prev - Math.round(10 * damageMultiplier))) // Scaled damage
                setIsPlayerHit(true)
                setTimeout(() => setIsPlayerHit(false), 300)
              }

              hitCooldownRef.current = true
              setTimeout(() => {
                hitCooldownRef.current = false
              }, 500)

              if (playerHealth - (playerState === "defence" ? 1 : Math.round(10 * difficulty)) <= 0) {
                endGame("cpu")
              }
            }

            setTimeout(() => {
              setCpuState("idle")
              setTimeout(() => setCpuAttackCooldown(false), 400) // Medium cooldown after attack
            }, 400)
          } else {
            // Defence - CPU occasionally defends
            setCpuState("defence")
            setTimeout(() => {
              setCpuState("idle")
              setTimeout(() => setCpuAttackCooldown(false), 500)
            }, 500)
          }

          // Reset idle time when attacking
          setCpuIdleTime(0)
          return
        }
      }

      // Increment idle time counter
      setCpuIdleTime((prev) => prev + 1)

      // If CPU has been idle for too long, force movement
      if (cpuIdleTime > 3) {
        // Reduced from 5 to 3 to make CPU move more
        // Move towards player
        setCpuPosition((prev) => {
          const direction = cpuCenterX > playerCenterX ? 1 : -1
          // Set walking animation when moving
          setIsCpuWalking(true)

          // Calculate new position
          const newPosition = Math.max(50, Math.min(window.innerWidth - 150, prev + direction * 15))

          // Check if this movement would cause collision
          const playerRight = playerPosition + FIGHTER_COLLISION_WIDTH
          const cpuLeft = window.innerWidth - newPosition - PLAYER2_FIGHTER_COLLISION_WIDTH

          // Only move if it won't cause collision or CPU is jumping
          if ((cpuState as FighterState) === "jump" || playerRight < cpuLeft) {
            return newPosition
          }
          return prev
        })

        // Reset idle time
        setCpuIdleTime(0)
        return
      }

      // Random movement chance (higher probability - increased from 0.3 to 0.5)
      if (Math.random() < 0.5) {
        // Move towards player
        setCpuPosition((prev) => {
          const direction = cpuCenterX > playerCenterX ? 1 : -1
          // Set walking animation when moving
          setIsCpuWalking(true)

          // Calculate new position
          const newPosition = Math.max(50, Math.min(window.innerWidth - 150, prev + direction * 15))

          // Check if this movement would cause collision
          const playerRight = playerPosition + FIGHTER_COLLISION_WIDTH
          const cpuLeft = window.innerWidth - newPosition - PLAYER2_FIGHTER_COLLISION_WIDTH

          // Only move if it won't cause collision or CPU is jumping
          if ((cpuState as FighterState) === "jump" || playerRight < cpuLeft) {
            return newPosition
          }
          return prev
        })

        // Reset idle time when moving
        setCpuIdleTime(0)
      } else {
        // Stop walking animation when not moving
        setIsCpuWalking(false)
      }

      // Random duck or jump (lower probability)
      if (Math.random() < 0.1 && (cpuState as FighterState) === "idle") {
        // Stop walking animation during action
        setIsCpuWalking(false)

        if (Math.random() < 0.5) {
          setCpuState("duck")
          setTimeout(() => setCpuState("idle"), 400)
        } else {
          setCpuState("jump")
          setTimeout(() => setCpuState("idle"), 500)
        }
        // Reset idle time when performing an action
        setCpuIdleTime(0)
      }

      // Increment movement timer
      setCpuMovementTimer((prev) => prev + 1)
    }, 200) // Check for movement every 200ms

    return () => {
      if (cpuMovementRef.current) clearInterval(cpuMovementRef.current)
    }
  }, [
    cpuState,
    cpuIdleTime,
    gameOver,
    playerState,
    playerHealth,
    cpuAttackCooldown,
    playerPosition,
    cpuPosition,
    isCpuFacingLeft,
    difficulty,
    isPaused,
  ])

  // Game loop for CPU AI decisions
  useEffect(() => {
    if (gameOver || isPaused) return

    // CPU AI
    gameLoopRef.current = window.setInterval(() => {
      // Adjust reaction time based on difficulty (faster reactions at higher difficulty)
      const reactionTime = Math.max(500 - (difficulty - 1) * 100, 200)
      if (Date.now() - lastCpuActionRef.current < reactionTime) return

      // Regular CPU actions
      const action = Math.random()

      // Update CPU facing direction based on player position
      const cpuCenterX = getCpuCenterX()
      const playerCenterX = getPlayerCenterX()

      // CPU should face left when player is to the left
      setIsCpuFacingLeft(cpuCenterX < playerCenterX)

      // React to player's last action
      if ((playerLastAction as FighterState) === "kick" && (cpuState as FighterState) === "idle" && action < 0.7) {
        // Stop walking animation during action
        setIsCpuWalking(false)

        // Duck to dodge kicks
        setCpuState("duck")
        setTimeout(() => setCpuState("idle"), 400)
        lastCpuActionRef.current = Date.now()
        setCpuIdleTime(0) // Reset idle time
        return
      }

      if ((playerLastAction as FighterState) === "punch" && (cpuState as FighterState) === "idle" && action < 0.7) {
        // Stop walking animation during action
        setIsCpuWalking(false)

        // Jump to dodge punches
        setCpuState("jump")
        setTimeout(() => setCpuState("idle"), 500)
        lastCpuActionRef.current = Date.now()
        setCpuIdleTime(0) // Reset idle time
        return
      }

      // Sometimes use defence when player is attacking
      if (((playerLastAction as FighterState) === "punch" || (playerLastAction as FighterState) === "kick") && (cpuState as FighterState) === "idle" && action < 0.4) {
        // Stop walking animation during action
        setIsCpuWalking(false)

        setCpuState("defence")
        setTimeout(() => setCpuState("idle"), 500)
        lastCpuActionRef.current = Date.now()
        setCpuIdleTime(0) // Reset idle time
        return
      }

      lastCpuActionRef.current = Date.now()
    }, 500) // Faster AI thinking

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current)
    }
  }, [
    playerPosition,
    cpuPosition,
    playerState,
    cpuState,
    playerHealth,
    cpuHealth,
    gameOver,
    playerLastAction,
    difficulty,
    isPaused,
  ])

  // Handle continuous movement when keys are held down for player
  useEffect(() => {
    if (gameOver || isPaused) return

    // Clear any existing movement interval
    if (movementIntervalRef.current) {
      clearInterval(movementIntervalRef.current)
      movementIntervalRef.current = null
    }

    // Handle movement and direction
    if ((isKeyDown.ArrowRight || isKeyDown.ArrowLeft) && (playerState as FighterState) !== "duck") {
      // Set walking animation when moving
      if ((playerState as FighterState) === "idle") setIsPlayerWalking(true)

      // Set up continuous movement
      movementIntervalRef.current = window.setInterval(() => {
        if (isKeyDown.ArrowRight && (playerState as FighterState) !== "jump" && (playerState as FighterState) !== "defence" && (playerState as FighterState) !== "duck") {
          // Calculate new position
          const newPosition = Math.min(playerPosition + 10, window.innerWidth - 150)

          // Check if this movement would cause collision
          const playerRight = newPosition + FIGHTER_COLLISION_WIDTH
          const cpuLeft = window.innerWidth - cpuPosition - PLAYER2_FIGHTER_COLLISION_WIDTH

          // Only move if it won't cause collision
          if (playerRight < cpuLeft) {
            setPlayerPosition(newPosition)
          }
        } else if (
          isKeyDown.ArrowLeft &&
          (playerState as FighterState) !== "jump" &&
          (playerState as FighterState) !== "defence" &&
          (playerState as FighterState) !== "duck"
        ) {
          setPlayerPosition((prev) => Math.max(prev - 10, 50))
        }
      }, 50) // Move every 50ms for smoother continuous movement
    } else {
      // Stop walking animation when not moving
      setIsPlayerWalking(false)
    }

    return () => {
      if (movementIntervalRef.current) {
        clearInterval(movementIntervalRef.current)
        movementIntervalRef.current = null
      }
    }
  }, [isKeyDown.ArrowRight, isKeyDown.ArrowLeft, gameOver, playerState, playerPosition, cpuPosition, isPaused])

  // Handle jump with direction - only jump once per key press
  useEffect(() => {
    if (gameOver || isPaused) return

    // Handle jump key press
    if (isKeyDown.ArrowUp && (playerState as FighterState) === "idle" && !jumpKeyPressed) {
      setJumpKeyPressed(true)
      setPlayerLastAction("jump")
      // Stop walking animation during jump
      setIsPlayerWalking(false)

      // Determine jump direction
      let direction: "left" | "right" | null = null

      if (isKeyDown.ArrowLeft) {
        direction = "left"
        setIsPlayerFacingLeft(true)
        // Move left while jumping
        setPlayerPosition((prev) => Math.max(prev - 50, 50))
      } else if (isKeyDown.ArrowRight) {
        direction = "right"
        setIsPlayerFacingLeft(false)
        // Move right while jumping
        setPlayerPosition((prev) => Math.min(prev + 50, window.innerWidth - 150))
      }

      setPlayerJumpDirection(direction)
      setPlayerState("jump")

      setTimeout(() => {
        setPlayerState("idle")
        setPlayerJumpDirection(null)
        setPlayerLastAction("idle")
        setIsPlayerJumpKicking(false)
      }, 500)
    }

    // Reset jump key pressed state when key is released
    if (!isKeyDown.ArrowUp && jumpKeyPressed) {
      setJumpKeyPressed(false)
    }

    if (isKeyDown.ArrowDown && (playerState as FighterState) === "idle") {
      setPlayerState("duck")
      setPlayerLastAction("duck")
      // Stop walking animation during duck
      setIsPlayerWalking(false)
    } else if (!isKeyDown.ArrowDown && (playerState as FighterState) === "duck") {
      setPlayerState("idle")
      setPlayerLastAction("idle")
    }

    if (isKeyDown.d && (playerState as FighterState) === "idle") {
      setPlayerState("punch")
      setPlayerLastAction("punch")
      // Stop walking animation during punch
      setIsPlayerWalking(false)

      // Check if hit - improved hit detection with slightly reduced area
      const cpuCenterX = getCpuCenterX()
      const playerCenterX = getPlayerCenterX()

      // Only allow hits when player is close to CPU and facing the right direction
      if (
        Math.abs(cpuCenterX - playerCenterX) < 140 && // Reduced hit area
        (cpuState as FighterState) !== "jump" && // Can't hit jumping CPU (dodge)
        !hitCooldownRef.current &&
        // Player must be facing the CPU to hit
        ((playerCenterX < cpuCenterX && !isPlayerFacingLeft) || (playerCenterX > cpuCenterX && isPlayerFacingLeft))
      ) {
        // If CPU is defending, they take reduced damage (1%)
        if ((cpuState as FighterState) === "defence") {
          setCpuHealth((prev) => Math.max(0, prev - 1)) // 1% damage when defending
          // Don't set isCpuHit when defending - keep defense sprite
        } else {
          setCpuHealth((prev) => Math.max(0, prev - 5)) // Normal damage
          setIsCpuHit(true)
          setTimeout(() => setIsCpuHit(false), 300)
        }

        hitCooldownRef.current = true
        setTimeout(() => {
          hitCooldownRef.current = false
        }, 500)

        if (cpuHealth - (cpuState === "defence" ? 1 : 5) <= 0) {
          endGame("player")
        }
      }

      setTimeout(() => {
        setPlayerState("idle")
        setPlayerLastAction("idle")
      }, 300)
      resetKeys(["d"])
    }

    // Handle kick - now works both on ground and in air
    if (isKeyDown.a && ((playerState as FighterState) === "idle" || (playerState as FighterState) === "jump")) {
      // If in air, do a jump kick, otherwise do a regular kick
      const isJumpKick = (playerState as FighterState) === "jump"

      if (isJumpKick) {
        setPlayerLastAction("jumpKick")
        setIsPlayerJumpKicking(true)
      } else {
        setPlayerState("kick")
        setPlayerLastAction("kick")
        // Stop walking animation during kick
        setIsPlayerWalking(false)
      }

      // Check if hit - improved hit detection with slightly reduced area
      const cpuCenterX = getCpuCenterX()
      const playerCenterX = getPlayerCenterX()

      // Only allow hits when player is close to CPU and facing the right direction
      if (
        Math.abs(cpuCenterX - playerCenterX) < 170 && // Reduced hit area
        (cpuState as FighterState) !== "jump" && // Can't hit jumping CPU
        (isJumpKick || (cpuState as FighterState) !== "duck") && // Regular kick can't hit ducking CPU, but jump kick can
        !hitCooldownRef.current &&
        // Player must be facing the CPU to hit
        ((playerCenterX < cpuCenterX && !isPlayerFacingLeft) || (playerCenterX > cpuCenterX && isPlayerFacingLeft))
      ) {
        // If CPU is defending, they take reduced damage (1%)
        if ((cpuState as FighterState) === "defence") {
          setCpuHealth((prev) => Math.max(0, prev - 1)) // 1% damage when defending
          // Don't set isCpuHit when defending - keep defense sprite
        } else {
          // Jump kicks do more damage
          const damage = isJumpKick ? 15 : 10
          setCpuHealth((prev) => Math.max(0, prev - damage)) // Normal damage
          setIsCpuHit(true)
          setTimeout(() => setIsCpuHit(false), 300)
        }

        hitCooldownRef.current = true
        setTimeout(() => {
          hitCooldownRef.current = false
        }, 500)

        const damageDealt = (cpuState as FighterState) === "defence" ? 1 : isJumpKick ? 15 : 10
        if (cpuHealth - damageDealt <= 0) {
          endGame("player")
        }
      }

      if (!isJumpKick) {
        setTimeout(() => {
          setPlayerState("idle")
          setPlayerLastAction("idle")
        }, 400)
      }
      resetKeys(["a"])
    }

    // Handle defence with S key
    if (isKeyDown.s && (playerState as FighterState) === "idle") {
      setPlayerState("defence")
      setPlayerLastAction("defence")
      setIsPlayerDefending(true)
      // Stop walking animation during defence
      setIsPlayerWalking(false)

      setTimeout(() => {
        setPlayerState("idle")
        setPlayerLastAction("idle")
        setIsPlayerDefending(false)
      }, 500)
      resetKeys(["s"])
    }
  }, [
    isKeyDown.ArrowUp,
    isKeyDown.ArrowDown,
    isKeyDown.ArrowLeft,
    isKeyDown.ArrowRight,
    isKeyDown.d,
    isKeyDown.a,
    isKeyDown.s,
    playerPosition,
    cpuPosition,
    playerState,
    cpuState,
    playerHealth,
    cpuHealth,
    gameOver,
    resetKeys,
    jumpKeyPressed,
    isPlayerFacingLeft,
  ])

  const endGame = (winner: "player" | "cpu") => {
    setGameOver(true)
    setWinner(winner)
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    if (cpuMovementRef.current) clearInterval(cpuMovementRef.current)
    if (movementIntervalRef.current) clearInterval(movementIntervalRef.current)

    // Navigate to winner screen after a delay
    setTimeout(() => {
      router.push(
        `/winner?winner=${winner}&player=${playerId}&cpu=${cpuFighter.id}&round=${roundCount}&difficulty=${difficulty.toFixed(1)}&prevOpponents=${previousOpponentsParam}`,
      )
    }, 2000)
  }

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={stageBackground || "/placeholder.svg"}
          alt="Fight Stage"
          fill
          className="object-cover pixelated"
          priority
        />
        <div className="absolute bottom-0 w-full h-20 bg-black/50"></div>
      </div>

      {/* Top menu */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex justify-center items-center gap-4">
        <button
          onClick={() => router.push('/select')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded border-2 border-red-800 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            fontFamily: 'monospace',
            textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.3)'
          }}
        >
          ← MENU
        </button>
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded border-2 border-blue-800 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            fontFamily: 'monospace',
            textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.3)'
          }}
        >
          {isPaused ? 'UNPAUSE' : 'PAUSE'}
        </button>
      </div>

      <div className="z-10 flex flex-col items-center justify-start w-full h-full">
        {/* Health bars */}
        <div className="w-full px-8 pt-4 flex justify-between">
          <PowerBar health={playerHealth} name={playerFighter.name} />
          <PowerBar health={cpuHealth} name={cpuFighter.name} reversed />
        </div>

        {/* Fight area */}
        <div className="relative flex-1 w-full">
          {/* Player fighter */}
          <Fighter
            fighter={playerFighter}
            position={playerPosition}
            state={playerState}
            side="left"
            jumpDirection={playerJumpDirection}
            isDefending={isPlayerDefending || (playerState as FighterState) === "defence"}
            isFacingLeft={isPlayerFacingLeft}
            isDefeated={gameOver && winner === "cpu"}
            isVictorious={gameOver && winner === "player"}
            isHit={isPlayerHit}
            isWalking={isPlayerWalking && (playerState as FighterState) === "idle"}
            isJumpKicking={isPlayerJumpKicking}
          />

          {/* CPU fighter */}
          <Fighter
            fighter={cpuFighter}
            position={cpuPosition}
            state={cpuState}
            side="right"
            isFacingLeft={isCpuFacingLeft}
            isDefeated={gameOver && winner === "player"}
            isVictorious={gameOver && winner === "cpu"}
            isHit={isCpuHit}
            isWalking={isCpuWalking && (cpuState as FighterState) === "idle"}
          />
        </div>

        {/* Controls help */}
        <FightControls />
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center">
          <div className="bg-gray-800 border-4 border-gray-600 rounded-lg p-8 text-center shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
              JUEGO PAUSADO
            </h2>
            <div className="space-y-6 text-white" style={{ fontFamily: 'monospace' }}>
              <p className="text-lg">Haz clic en el botón para continuar</p>
              <button
                onClick={() => setIsPaused(false)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg border-4 border-green-800 shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 text-2xl"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.8)',
                  boxShadow: '6px 6px 0px rgba(0,0,0,0.4)'
                }}
              >
                ▶ PLAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
