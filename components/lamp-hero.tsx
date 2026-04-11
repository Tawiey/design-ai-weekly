"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function LampHero({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative z-0 flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden bg-[var(--background)]",
        className
      )}
    >
      {/* Lamp glow effect */}
      <div className="absolute top-0 isolate z-0 flex w-screen flex-1 items-start justify-center">
        <div className="absolute top-0 z-50 h-48 w-screen bg-transparent opacity-10 backdrop-blur-md" />

        {/* Main glow */}
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-[-30%] rounded-full bg-[var(--primary)]/60 opacity-80 blur-3xl" />

        {/* Lamp pulse */}
        <motion.div
          initial={{ width: "8rem" }}
          animate={{ width: "16rem" }}
          transition={{ ease: "easeInOut", duration: 0.8 }}
          className="absolute top-0 z-30 h-36 -translate-y-[20%] rounded-full bg-[var(--primary)]/60 blur-2xl"
        />

        {/* Top line */}
        <motion.div
          initial={{ width: "15rem" }}
          animate={{ width: "30rem" }}
          transition={{ ease: "easeInOut", duration: 0.8 }}
          className="absolute inset-auto z-50 h-0.5 -translate-y-[-10%] bg-[var(--primary)]/60"
        />

        {/* Left gradient cone */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          animate={{ opacity: 1, width: "30rem" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(from 70deg at center top, var(--primary), transparent, transparent)`,
          }}
          className="absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible"
        >
          <div className="absolute w-[100%] left-0 bg-[var(--background)] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-[var(--background)] bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>

        {/* Right gradient cone */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          animate={{ opacity: 1, width: "30rem" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, var(--primary))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem]"
        >
          <div className="absolute w-40 h-[100%] right-0 bg-[var(--background)] bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-[var(--background)] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: "easeInOut", duration: 0.8 }}
        className="relative z-50 flex flex-col items-center justify-center gap-6 px-5"
      >
        {children}
      </motion.div>
    </div>
  )
}
