'use client'

import { ReactNode, useEffect } from 'react'
import { X, FileText, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { pdf } from '@react-pdf/renderer'
import { OverallReportPDF } from './OverallReportPDF'
import { FeedingLog } from '@/lib/types/feeding'
import { SleepLog } from '@/lib/types/sleep'
import { DiaperChange } from '@/lib/types/diaper'
import { PumpingLog } from '@/lib/types/pumping'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  dateRange: { start: Date; end: Date; label: string }
  babyName: string
  children: ReactNode
  // PDF data
  feedings?: FeedingLog[]
  sleeps?: SleepLog[]
  diapers?: DiaperChange[]
  pumpings?: PumpingLog[]
  growths?: any[]
  medications?: any[]
  vaccinations?: any[]
}

export function ReportModal({
  isOpen,
  onClose,
  title,
  dateRange,
  babyName,
  children,
  feedings = [],
  sleeps = [],
  diapers = [],
  pumpings = [],
  growths = [],
  medications = [],
  vaccinations = []
}: ReportModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      // Generate PDF
      const pdfDocument = (
        <OverallReportPDF
          feedings={feedings}
          sleeps={sleeps}
          diapers={diapers}
          pumpings={pumpings}
          growths={growths}
          medications={medications}
          vaccinations={vaccinations}
          dateRange={dateRange}
          babyName={babyName}
        />
      )

      // Create blob
      const blob = await pdf(pdfDocument).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${babyName}-Report-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.pdf`
      link.click()

      // Cleanup
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header - Don't print */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 print:hidden gap-3">
            <div className="flex-1 min-w-0">
              <h2 id="modal-title" className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate">{title}</h2>
              <p id="modal-description" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                {babyName} · {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="text-xs sm:text-sm flex-1 sm:flex-none" aria-label="Download report as PDF">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden xs:inline">Download PDF</span>
                <span className="xs:hidden">PDF</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0" aria-label="Close report modal">
                <X className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Report Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 print:p-8">
            {/* Report Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
