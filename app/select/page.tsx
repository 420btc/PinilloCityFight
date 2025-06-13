"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { fighters } from "@/lib/fighters"

export default function CharacterSelect() {
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          setSelectedIndex((prev) => (prev + 1) % fighters.length)
          break
        case "ArrowLeft":
          setSelectedIndex((prev) => (prev - 1 + fighters.length) % fighters.length)
          break
        case "ArrowUp":
          setSelectedIndex((prev) => {
            // For a 3x2 grid (6 fighters)
            if (prev < 3) {
              return prev + 3
            }
            return prev - 3
          })
          break
        case "ArrowDown":
          setSelectedIndex((prev) => {
            // For a 3x2 grid (6 fighters)
            if (prev >= 3) {
              return prev - 3
            }
            return prev + 3
          })
          break
        case "Enter":
          // Initialize with empty previous opponents
          router.push(`/fight?player=${fighters[selectedIndex].id}&round=1&difficulty=1.0&prevOpponents=`)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, router])

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[#001428] pixelated">
        <div className="absolute inset-0 bg-black/50" /> {/* Made overlay lighter */}
      </div>

      <div className="z-10 flex flex-col items-center justify-center w-full max-w-4xl">
        <h2 className="game-title text-4xl mb-4 brightness-125">Select Your Fighter</h2> {/* Added brightness */}
        <div className="grid grid-cols-3 grid-rows-2 gap-8">
          {fighters.map((fighter, index) => (
            <div
              key={fighter.id}
              className={`relative w-32 h-32 ${
                selectedIndex === index ? "ring-4 ring-orange-500 scale-110 transform transition-all" : ""
              }`}
              onClick={() => {
                setSelectedIndex(index)
              }}
            >
              <Image
                src={fighter.portrait || "/placeholder.svg"}
                alt={fighter.name}
                width={128}
                height={128}
                className="pixelated w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center text-xs py-1 game-text">
                {fighter.name}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 game-text">
          <div className="text-2xl text-center">{fighters[selectedIndex].name}</div>
          <div className="text-sm mt-2 text-gray-400">{fighters[selectedIndex].description}</div>
          <div className="text-sm mt-1 text-orange-500">Special: {fighters[selectedIndex].specialMove}</div>
        </div>
      </div>
    </div>
  )
}
