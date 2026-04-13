"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { gradientMeshFor } from "@/lib/gradient-mesh"
import { cn } from "@/lib/utils"

export type DigestCardData = {
  id: string
  title: string
  slug: string
  dateFormatted: string
}

const positionStyles = [
  { scale: 1, y: 12 },
  { scale: 0.95, y: -16 },
  { scale: 0.9, y: -44 },
]

function GradientMesh({ slug }: { slug: string }) {
  return (
    <div
      aria-hidden
      className="h-full w-full rounded-lg"
      style={{ backgroundImage: gradientMeshFor(slug) }}
    />
  )
}

function DigestCardContent({ digest }: { digest: DigestCardData }) {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-3">
      {/* Image area */}
      <div className="h-[170px] w-full overflow-hidden rounded-lg">
        <GradientMesh slug={digest.slug} />
      </div>

      {/* Content area */}
      <div className="flex flex-1 items-end justify-between gap-3 px-2 pb-1">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">
            {digest.dateFormatted}
          </span>
          <h3 className="truncate text-sm font-semibold text-[var(--foreground)] leading-snug">
            {digest.title}
          </h3>
        </div>
        <Link
          href={`/digest/${digest.slug}`}
          className="flex h-10 shrink-0 items-center gap-0.5 rounded-full bg-[var(--foreground)] pl-4 pr-3 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
        >
          Read
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
          >
            <path d="M9.5 18L15.5 12L9.5 6" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

function AnimatedCard({
  digest,
  index,
  direction,
  cardKey,
}: {
  digest: DigestCardData
  index: number
  direction: "next" | "prev"
  cardKey: string
}) {
  const { scale, y } = positionStyles[index] ?? positionStyles[2]
  const zIndex = 3 - index

  // Direction-aware exit & enter animations
  // Next: top card slides DOWN off-screen, new back card appears scaled in from above
  // Prev: top card slides UP off-screen, returning card appears from above (scale 0.85)
  const exitAnim =
    index === 0
      ? direction === "next"
        ? { y: 340, scale: 1, zIndex: 10 }
        : { y: -340, scale: 1, zIndex: 10, opacity: 0 }
      : undefined

  const initialAnim =
    index === 2
      ? direction === "next"
        ? { y: -16, scale: 0.9 }
        : { y: -16, scale: 0.9, opacity: 0 }
      : undefined

  return (
    <motion.div
      key={cardKey}
      initial={initialAnim}
      animate={{ y, scale, opacity: 1 }}
      exit={exitAnim}
      transition={{
        type: "spring",
        duration: 0.7,
        bounce: 0,
      }}
      style={{
        zIndex,
        left: "50%",
        x: "-50%",
        bottom: 0,
      }}
      className="absolute flex h-[300px] w-[324px] items-center justify-center overflow-hidden rounded-t-xl border-x border-t border-[var(--border)] bg-[var(--card)] shadow-lg will-change-transform sm:w-[480px]"
    >
      <DigestCardContent digest={digest} />
    </motion.div>
  )
}

export function DigestCardStack({ digests }: { digests: DigestCardData[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<"next" | "prev">("next")

  const total = digests.length
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < total - 1

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => {
      if (i >= total - 1) return i
      setDirection("next")
      return i + 1
    })
  }, [total])

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => {
      if (i <= 0) return i
      setDirection("prev")
      return i - 1
    })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleNext, handlePrev])

  if (total === 0) return null

  // Build the visible card window — up to 3 cards starting from currentIndex
  const visibleCards = digests.slice(currentIndex, currentIndex + 3)

  return (
    <div className="flex w-full flex-col items-center justify-center pt-2">
      <div className="relative h-[320px] w-full overflow-hidden sm:w-[544px]">
        <AnimatePresence initial={false} mode="popLayout">
          {visibleCards.map((digest, index) => (
            <AnimatedCard
              key={digest.id}
              cardKey={digest.id}
              digest={digest}
              index={index}
              direction={direction}
            />
          ))}
        </AnimatePresence>
      </div>

      {total > 1 && (
        <div className="relative z-10 -mt-px flex w-full flex-col items-center gap-2 border-t border-[var(--border)] py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous issue"
              className={cn(
                "flex h-9 select-none items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--secondary)] active:scale-[0.98]",
                !canGoPrev && "cursor-not-allowed opacity-40 hover:bg-[var(--background)]"
              )}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              >
                <path d="M15 18L9 12L15 6" />
              </svg>
              Previous
            </button>
            <span className="font-mono text-xs text-[var(--muted-foreground)]">
              {currentIndex + 1} / {total}
            </span>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next issue"
              className={cn(
                "flex h-9 select-none items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--secondary)] active:scale-[0.98]",
                !canGoNext && "cursor-not-allowed opacity-40 hover:bg-[var(--background)]"
              )}
            >
              Next
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              >
                <path d="M9 18L15 12L9 6" />
              </svg>
            </button>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] opacity-60">
            Use ← → keys to navigate
          </p>
        </div>
      )}
    </div>
  )
}
