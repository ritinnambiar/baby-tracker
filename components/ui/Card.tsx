'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <motion.div
      className={cn(
        'bg-white rounded-3xl shadow-soft p-6',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02, y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn('text-xl font-bold text-gray-800', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  )
}
