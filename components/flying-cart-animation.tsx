"use client"

import { useEffect, useState } from "react"

interface FlyingCartAnimationProps {
  trigger: boolean
  startPosition: { x: number; y: number }
  onComplete: () => void
}

export function FlyingCartAnimation({ trigger, startPosition, onComplete }: FlyingCartAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (trigger) {
      setIsAnimating(true)

      setTimeout(() => {
        setIsAnimating(false)
        onComplete()
      }, 800)
    }
  }, [trigger, onComplete])

  if (!isAnimating) return null

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: startPosition.x,
        top: startPosition.y,
      }}
    >
      <div className="animate-[fly-to-cart_0.8s_ease-in-out_forwards]">
        <div className="bg-[#fd4d00] text-white px-3 py-1 rounded-lg font-bold text-sm shadow-lg">+1</div>
      </div>
    </div>
  )
}
