'use client'

import { useState, useEffect, useRef } from 'react'
import { format, parseISO, startOfDay, differenceInMinutes, addDays, isSameDay } from 'date-fns'
import { Card } from './Card'

interface TimelineEvent {
  id: string
  startTime: string // ISO string
  endTime?: string // ISO string
  title: string
  subtitle?: string
  color: string
  icon?: string
}

interface TimelineCalendarProps {
  events: TimelineEvent[]
  dateRange: { start: Date; end: Date }
  onEventClick?: (event: TimelineEvent) => void
  onDateClick?: (date: Date) => void
}

export function TimelineCalendar({ events, dateRange, onEventClick, onDateClick }: TimelineCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  // Generate date range: From Jan 1, 2025 to 1 year in the future
  const getDatesInRange = () => {
    const dates: Date[] = []
    const startDate = new Date(2025, 0, 1) // January 1, 2025
    const today = startOfDay(new Date())
    const endDate = addDays(today, 365) // 1 year from today

    // Generate all dates from start to end
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }

    return dates // Chronological order (Jan 1, 2025 onwards)
  }

  const dates = getDatesInRange()

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }

  // Calculate total width needed for all columns
  const totalWidth = dates.length * 150 + 64 // 150px per date + 64px for time column

  // Scroll to today's date on mount (only once)
  useEffect(() => {
    if (todayRef.current && scrollContainerRef.current && !hasScrolledToToday) {
      const todayElement = todayRef.current
      const container = scrollContainerRef.current

      // Calculate scroll position to center today in the viewport
      const todayLeft = todayElement.offsetLeft
      const containerWidth = container.clientWidth
      const scrollPosition = todayLeft - containerWidth / 2 + 75 // 75 = half of column width (150px)

      container.scrollLeft = scrollPosition
      setHasScrolledToToday(true)
    }
  }, [dates, hasScrolledToToday])

  // Time slots for y-axis (every 2 hours)
  const timeSlots = Array.from({ length: 12 }, (_, i) => i * 2) // 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.startTime)
      return isSameDay(eventDate, date)
    })
  }

  // Calculate position of event on timeline (as percentage of day)
  const getEventPosition = (event: TimelineEvent) => {
    const eventTime = parseISO(event.startTime)
    const dayStart = startOfDay(eventTime)
    const minutesFromStart = differenceInMinutes(eventTime, dayStart)
    const percentage = (minutesFromStart / 1440) * 100 // 1440 minutes in a day
    return percentage
  }

  // Calculate height of event block (based on duration)
  const getEventHeight = (event: TimelineEvent) => {
    if (!event.endTime) return 1.5 // Small height for instant events (bottle feeds)

    const start = parseISO(event.startTime)
    const end = parseISO(event.endTime)
    const durationMinutes = differenceInMinutes(end, start)

    // Scale duration more aggressively for visibility:
    // 10 min = ~3%, 20 min = ~6%, 30 min = ~9%, 60 min = ~18%
    const percentage = (durationMinutes / 1440) * 100 * 3 // 3x multiplier for better visibility
    return Math.min(Math.max(percentage, 2), 25) // Min 2%, max 25% of timeline
  }

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event)
    onEventClick?.(event)
  }

  return (
    <div className="space-y-4">
      {/* Timeline Container */}
      <div className="relative">
        {/* Horizontal scroll wrapper */}
        <div ref={scrollContainerRef} className="overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex" style={{ minWidth: `${totalWidth}px` }}>
            {/* Time labels column (fixed) */}
            <div className="sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ width: '64px' }}>
              <div className="w-full h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500">Time</span>
              </div>
              <div className="relative" style={{ height: '600px' }}>
                {timeSlots.map(hour => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
                    style={{ top: `${(hour / 24) * 100}%` }}
                  >
                    <span className="text-xs text-gray-500 px-2">
                      {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Date columns */}
            {dates.map((date, dateIndex) => {
                const dateEvents = getEventsForDate(date)
                const isToday = isSameDay(date, new Date())
                const isSelected = selectedDate && isSameDay(date, selectedDate)

                return (
                  <div
                    key={dateIndex}
                    ref={isToday ? todayRef : null}
                    className={`flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${
                      isToday ? 'bg-baby-blue/20' : ''
                    } ${isSelected ? 'bg-baby-yellow/30' : ''}`}
                    style={{ width: '150px' }}
                  >
                    {/* Date header */}
                    <button
                      onClick={() => handleDateClick(date)}
                      className={`w-full h-16 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center transition-all hover:shadow-md ${
                        isToday ? 'bg-primary-500 text-white' : isSelected ? 'bg-accent-500 text-white' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>
                      <span className={`text-xs font-medium ${isToday || isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                        {format(date, 'MMM')}
                      </span>
                      <span className={`text-sm font-medium ${isToday || isSelected ? '' : 'text-gray-700 dark:text-gray-300'}`}>
                        {format(date, 'EEE')}
                      </span>
                      <span className={`text-lg font-bold ${isToday || isSelected ? '' : 'text-gray-800 dark:text-gray-200'}`}>
                        {format(date, 'd')}
                      </span>
                    </button>

                    {/* Timeline column */}
                    <div className="relative" style={{ height: '600px' }}>
                      {/* Hour grid lines */}
                      {timeSlots.map(hour => (
                        <div
                          key={hour}
                          className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
                          style={{ top: `${(hour / 24) * 100}%` }}
                        />
                      ))}

                      {/* Events */}
                      {dateEvents.map(event => {
                        const topPosition = getEventPosition(event)
                        const height = getEventHeight(event)
                        const isDarkBackground = event.color.includes('gray-8') || event.color.includes('gray-9')

                        return (
                          <div
                            key={event.id}
                            className={`absolute left-1 right-1 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-xl hover:scale-105 hover:z-10 border-2 border-white ${event.color}`}
                            style={{
                              top: `${topPosition}%`,
                              height: `${height}%`,
                              minHeight: event.endTime ? '40px' : '28px', // Bigger for duration events
                            }}
                            onClick={() => handleEventClick(event)}
                            title={`${event.subtitle} - ${format(parseISO(event.startTime), 'h:mm a')}`}
                          >
                            <div className="p-2 overflow-hidden h-full flex flex-col justify-center">
                              <div className="flex items-center gap-1">
                                {event.icon && <span className="text-base">{event.icon}</span>}
                                <span className={`text-xs font-bold truncate ${isDarkBackground ? 'text-white' : 'text-gray-800'}`}>
                                  {format(parseISO(event.startTime), 'h:mm')}
                                </span>
                              </div>
                              <div className={`text-xs font-semibold truncate ${isDarkBackground ? 'text-white' : 'text-gray-700'}`}>
                                {event.title}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Event Detail Card */}
      {selectedEvent && (
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {selectedEvent.icon && <span className="text-2xl">{selectedEvent.icon}</span>}
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {selectedEvent.title}
                </h3>
              </div>
              {selectedEvent.subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {selectedEvent.subtitle}
                </p>
              )}
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Time: </span>
                {format(parseISO(selectedEvent.startTime), 'MMM d, h:mm a')}
                {selectedEvent.endTime && (
                  <span> - {format(parseISO(selectedEvent.endTime), 'h:mm a')}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
