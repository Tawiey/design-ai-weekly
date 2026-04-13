"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { SpiralAnimation } from "./spiral-animation"
import { LampGlow } from "./lamp-hero"
import { DigestCardStack, type DigestCardData } from "./digest-card-stack"
import { pickRandomLampColor } from "@/lib/lamp-colors"

export function Hero({ digests }: { digests: DigestCardData[] }) {
  // Single source of truth: the spiral's progress (0 → 1).
  // Every other animated property in the hero derives from this.
  const progress = useMotionValue(0)
  const lockedRef = useRef(false)

  // Pick a random lamp color client-side only — avoids SSR/CSR hydration
  // mismatch. The lamp glow is invisible (opacity 0) until ~88% of the
  // spiral, so the user never sees the initial unmounted state.
  const [lampColor, setLampColor] = useState<string | null>(null)
  useEffect(() => {
    setLampColor(pickRandomLampColor())
  }, [])

  // Spiral keeps looping — clamp progress at 1 once the first cycle ends
  // so the choreography doesn't reset.
  const handleProgress = useCallback(
    (p: number) => {
      if (lockedRef.current) return
      progress.set(p)
      if (p >= 0.995) {
        lockedRef.current = true
        progress.set(1)
      }
    },
    [progress]
  )

  // Title + subtitle: hidden early, fade in mid-spiral, then slide up + shrink slightly
  const titleOpacity = useTransform(progress, [0, 0.7, 0.85, 1], [0, 0, 1, 1])
  const titleY = useTransform(progress, [0.85, 1], ["0vh", "-30vh"])
  const titleScale = useTransform(progress, [0.85, 1], [1, 0.78])

  // Spiral fades out at the very end
  const spiralOpacity = useTransform(progress, [0.92, 1], [1, 0])

  // Lamp glow grows in just before spiral fully disappears
  const lampOpacity = useTransform(progress, [0.88, 1], [0, 1])
  const lampScaleX = useTransform(progress, [0.88, 1], [0.4, 1])

  // Card stack rises from below at the end
  const cardsOpacity = useTransform(progress, [0.93, 1], [0, 1])
  const cardsY = useTransform(progress, [0.93, 1], [120, 0])

  return (
    <section className="relative h-[100vh] min-h-[600px] w-full overflow-hidden bg-[var(--background)]">
      {/* Layer 1: Spiral canvas */}
      <motion.div
        style={{ opacity: spiralOpacity }}
        className="absolute inset-0 z-0"
      >
        <SpiralAnimation onProgress={handleProgress} />
      </motion.div>

      {/* Layer 2: Lamp glow (fades in late, mounted only on client) */}
      {lampColor && (
        <LampGlow color={lampColor} opacity={lampOpacity} scaleX={lampScaleX} />
      )}

      {/* Layer 3: Persistent title + subtitle (centred → slides to top) */}
      <motion.div
        style={{ opacity: titleOpacity, y: titleY, scale: titleScale }}
        className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center px-6"
      >
        <h1 className="mb-3 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Design × AI Weekly
        </h1>
        <p className="max-w-md text-center text-base text-neutral-300 sm:text-lg">
          A curated digest at the intersection of design and artificial
          intelligence
        </p>
      </motion.div>

      {/* Layer 4: Card stack (rises from below at end) */}
      <motion.div
        style={{ opacity: cardsOpacity, y: cardsY }}
        className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-6 pb-8 sm:pb-12"
      >
        <DigestCardStack digests={digests} />
      </motion.div>

      {/* Bottom fade so cards meet the page background cleanly */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
    </section>
  )
}
