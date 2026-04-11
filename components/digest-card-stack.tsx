"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export type DigestCardData = {
  id: string
  title: string
  slug: string
  dateFormatted: string
}

interface CardEntry {
  key: number
  digestIndex: number
}

const positionStyles = [
  { scale: 1, y: 12 },
  { scale: 0.95, y: -16 },
  { scale: 0.9, y: -44 },
]

const exitAnimation = {
  y: 340,
  scale: 1,
  zIndex: 10,
}

const enterAnimation = {
  y: -16,
  scale: 0.9,
}

function DigestCardContent({ digest }: { digest: DigestCardData }) {
  return (
    <div className="flex h-full w-full flex-col justify-between p-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono text-[var(--muted-foreground)]">
          {digest.dateFormatted}
        </span>
        <h3 className="text-lg font-semibold text-[var(--foreground)] leading-snug">
          {digest.title}
        </h3>
      </div>
      <div className="flex w-full items-center justify-between gap-2 pt-4">
        <span className="text-sm text-[var(--muted-foreground)]">
          Weekly digest
        </span>
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
  card,
  digest,
  index,
  isAnimating,
}: {
  card: CardEntry
  digest: DigestCardData
  index: number
  isAnimating: boolean
}) {
  const { scale, y } = positionStyles[index] ?? positionStyles[2]
  const zIndex = index === 0 && isAnimating ? 10 : 3 - index

  const exitAnim = index === 0 ? exitAnimation : undefined
  const initialAnim = index === 2 ? enterAnimation : undefined

  return (
    <motion.div
      key={card.key}
      initial={initialAnim}
      animate={{ y, scale }}
      exit={exitAnim}
      transition={{
        type: "spring",
        duration: 1,
        bounce: 0,
      }}
      style={{
        zIndex,
        left: "50%",
        x: "-50%",
        bottom: 0,
      }}
      className="absolute flex h-[200px] w-[324px] items-center justify-center overflow-hidden rounded-t-xl border-x border-t border-[var(--border)] bg-[var(--card)] p-1 shadow-lg will-change-transform sm:w-[480px]"
    >
      <DigestCardContent digest={digest} />
    </motion.div>
  )
}

export function DigestCardStack({ digests }: { digests: DigestCardData[] }) {
  const [nextKey, setNextKey] = useState(digests.length)
  const [isAnimating, setIsAnimating] = useState(false)

  // Build initial visible card entries (up to 3)
  const [visibleCards, setVisibleCards] = useState<CardEntry[]>(() =>
    digests.slice(0, 3).map((_, i) => ({ key: i, digestIndex: i }))
  )

  const handleNext = () => {
    if (isAnimating || digests.length <= 1) return
    setIsAnimating(true)

    const nextDigestIndex =
      ((visibleCards[visibleCards.length - 1]?.digestIndex ?? 0) + 1) % digests.length

    setVisibleCards([
      ...visibleCards.slice(1),
      { key: nextKey, digestIndex: nextDigestIndex },
    ])
    setNextKey((prev) => prev + 1)

    // Reset animating state after spring finishes
    setTimeout(() => setIsAnimating(false), 100)
  }

  if (digests.length === 0) return null

  return (
    <div className="flex w-full flex-col items-center justify-center pt-2">
      <div className="relative h-[280px] w-full overflow-hidden sm:w-[544px]">
        <AnimatePresence initial={false}>
          {visibleCards.slice(0, 3).map((card, index) => (
            <AnimatedCard
              key={card.key}
              card={card}
              digest={digests[card.digestIndex]}
              index={index}
              isAnimating={isAnimating}
            />
          ))}
        </AnimatePresence>
      </div>

      {digests.length > 1 && (
        <div className="relative z-10 -mt-px flex w-full items-center justify-center border-t border-[var(--border)] py-4">
          <button
            onClick={handleNext}
            className="flex h-9 cursor-pointer select-none items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--secondary)] active:scale-[0.98]"
          >
            Next issue
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
            >
              <path d="M6 9L12 15L18 9" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
