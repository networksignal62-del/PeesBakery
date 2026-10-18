"use client"

import { useEffect, useState } from "react"

interface ConfettiProps {
  trigger: boolean
}

interface Particle {
  id: number
  x: number
  color: string
  delay: number
  rotation: number
}

export function Confetti({ trigger }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (trigger) {

      const colors = ["#014325", "#fd4d00", "#10b981", "#0284c7"]
      const newParticles: Particle[] = []

      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: i * 50,
          rotation: Math.random() * 360,
        })
      }

      setParticles(newParticles)

      setTimeout(() => {
        setParticles([])
      }, 3000)
    }
  }, [trigger])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-0 w-3 h-3 animate-[confetti-fall_3s_ease-in_forwards]"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}
