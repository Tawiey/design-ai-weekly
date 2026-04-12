"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SpiralAnimation } from "./spiral-animation"
import { LampHero } from "./lamp-hero"
import { DigestCardStack, type DigestCardData } from "./digest-card-stack"

export function Hero({ digests }: { digests: DigestCardData[] }) {
  const [phase, setPhase] = useState<"spiral" | "lamp">("spiral")
  const textRef = useRef<HTMLDivElement>(null)

  const handleSpiralComplete = useCallback(() => {
    setPhase("lamp")
  }, [])

  // Fade in text during the last ~25% of the spiral (progress 0.7 → 0.95)
  const handleProgress = useCallback((progress: number) => {
    if (!textRef.current) return
    const fadeStart = 0.7
    const fadeEnd = 0.92
    if (progress < fadeStart) {
      textRef.current.style.opacity = "0"
      textRef.current.style.transform = "translateY(20px)"
    } else if (progress >= fadeEnd) {
      textRef.current.style.opacity = "1"
      textRef.current.style.transform = "translateY(0px)"
    } else {
      const t = (progress - fadeStart) / (fadeEnd - fadeStart)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      textRef.current.style.opacity = String(eased)
      textRef.current.style.transform = `translateY(${20 * (1 - eased)}px)`
    }
  }, [])

  return (
    <section className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "spiral" && (
          <motion.div
            key="spiral"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative h-[100vh] min-h-[500px]"
          >
            <SpiralAnimation
              onComplete={handleSpiralComplete}
              onProgress={handleProgress}
            />

            {/* Title overlay — starts invisible, fades in near end of spiral */}
            <div
              ref={textRef}
              style={{ opacity: 0, transform: "translateY(20px)" }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-none"
            >
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3 text-center px-6">
                Design × AI Weekly
              </h1>
              <p className="text-base sm:text-lg text-neutral-400 text-center max-w-md px-6">
                A curated digest at the intersection of design and artificial
                intelligence
              </p>
            </div>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-950 to-transparent" />
          </motion.div>
        )}

        {phase === "lamp" && (
          <motion.div
            key="lamp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <LampHero>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center text-[var(--foreground)]">
                Design × AI Weekly
              </h1>
              <p className="text-lg text-[var(--muted-foreground)] text-center max-w-md">
                A curated digest at the intersection of design and artificial
                intelligence
              </p>
              <DigestCardStack digests={digests} />
            </LampHero>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
