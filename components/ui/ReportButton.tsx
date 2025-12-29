'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from './Button'

interface ReportButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function ReportButton({ onClick, disabled }: ReportButtonProps) {
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="gap-2"
    >
      <FileText className="w-4 h-4" />
      Generate Report
    </Button>
  )
}
