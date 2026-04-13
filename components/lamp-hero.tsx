"use client"

import { motion, MotionValue } from "framer-motion"

export function LampGlow({
  color,
  opacity,
  scaleX,
}: {
  color: string
  opacity: MotionValue<number>
  scaleX: MotionValue<number>
}) {
  // Slightly transparent versions of the chosen color, mixed inline.
  // Using `color-mix` keeps things in HSL space without parsing.
  const glow60 = `color-mix(in oklab, ${color} 60%, transparent)`

  return (
    <motion.div
      style={{ opacity, scaleX, transformOrigin: "center top" }}
      className="pointer-events-none absolute inset-0 isolate flex w-full items-start justify-center"
    >
      {/* Soft top blur band */}
      <div className="absolute top-0 z-50 h-48 w-screen bg-transparent opacity-10 backdrop-blur-md" />

      {/* Main glow */}
      <div
        className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-[-30%] rounded-full opacity-80 blur-3xl"
        style={{ backgroundColor: glow60 }}
      />

      {/* Lamp pulse */}
      <div
        className="absolute top-0 z-30 h-36 w-64 -translate-y-[20%] rounded-full blur-2xl"
        style={{ backgroundColor: glow60 }}
      />

      {/* Top hairline */}
      <div
        className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[-10%]"
        style={{ backgroundColor: glow60 }}
      />

      {/* Left gradient cone */}
      <div
        style={{
          backgroundImage: `conic-gradient(from 70deg at center top, ${color}, transparent, transparent)`,
        }}
        className="absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible"
      >
        <div className="absolute bottom-0 left-0 z-20 h-40 w-full bg-[var(--background)] [mask-image:linear-gradient(to_top,white,transparent)]" />
        <div className="absolute bottom-0 left-0 z-20 h-full w-40 bg-[var(--background)] [mask-image:linear-gradient(to_right,white,transparent)]" />
      </div>

      {/* Right gradient cone */}
      <div
        style={{
          backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, ${color})`,
        }}
        className="absolute inset-auto left-1/2 h-56 w-[30rem]"
      >
        <div className="absolute bottom-0 right-0 z-20 h-full w-40 bg-[var(--background)] [mask-image:linear-gradient(to_left,white,transparent)]" />
        <div className="absolute bottom-0 right-0 z-20 h-40 w-full bg-[var(--background)] [mask-image:linear-gradient(to_top,white,transparent)]" />
      </div>
    </motion.div>
  )
}
