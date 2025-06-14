"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function IntroScreen() {
  const router = useRouter()
  const [showStart, setShowStart] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        router.push(`/select`)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-400 via-blue-300 to-orange-200">
      {/* Background with Berlin skyline */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <Image
          src="/images/berlin-skyline.png"
          alt="Berlin Skyline Background"
          fill
          className="object-cover w-full h-full pixelated"
          style={{ objectPosition: 'center 15%' }}
          priority
        />
      </div>
    </div>
  )
}
