'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ReactNode } from 'react'

interface SummaryCardProps {
  href: string
  bgColor: string
  icon: string
  title: string
  children: ReactNode
}

export function SummaryCard({ href, bgColor, icon, title, children }: SummaryCardProps) {
  return (
    <Link href={href}>
      <motion.div
        className={`${bgColor} rounded-2xl p-6 cursor-pointer shadow-soft`}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
      >
        <motion.div
          className="text-3xl mb-2 inline-block"
          whileHover={{
            scale: 1.2,
            rotate: [0, -10, 10, -10, 0],
          }}
          transition={{
            duration: 0.5,
          }}
        >
          {icon}
        </motion.div>
        <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
        {children}
      </motion.div>
    </Link>
  )
}
