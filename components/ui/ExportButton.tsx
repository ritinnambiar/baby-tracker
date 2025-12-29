'use client'

import { Download } from 'lucide-react'
import { Button } from './Button'
import { exportToCsv, ExportData } from '@/lib/utils/exportToCsv'
import toast from 'react-hot-toast'

interface ExportButtonProps {
  data: ExportData[]
  filename: string
  disabled?: boolean
}

export function ExportButton({ data, filename, disabled }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }

    try {
      exportToCsv(data, filename)
      toast.success('Data exported successfully!')
    } catch (error) {
      toast.error('Failed to export data')
      console.error('Export error:', error)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </Button>
  )
}
