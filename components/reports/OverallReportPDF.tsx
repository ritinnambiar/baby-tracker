'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { FeedingLog } from '@/lib/types/feeding'
import { SleepLog } from '@/lib/types/sleep'
import { DiaperChange } from '@/lib/types/diaper'
import { PumpingLog } from '@/lib/types/pumping'
import { format } from 'date-fns'

interface OverallReportPDFProps {
  feedings: FeedingLog[]
  sleeps: SleepLog[]
  diapers: DiaperChange[]
  pumpings: PumpingLog[]
  dateRange: { start: Date; end: Date }
  babyName: string
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#14141e',
    padding: 30,
    color: '#dcdcf0',
  },
  // Page 1
  titleSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dcdcf0',
    marginBottom: 16,
    textAlign: 'center',
  },
  babyInfo: {
    backgroundColor: '#3c2832',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  babyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 18,
    marginBottom: 4,
  },
  trackingDays: {
    fontSize: 14,
    color: '#a0a0b4',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#3c2832',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff6b8a',
  },
  cardNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff6b8a',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#dcdcf0',
    fontWeight: 'bold',
  },
  // Page 2 & 3
  pageHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsContainer: {
    backgroundColor: '#2d2d39',
    padding: 12,
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    width: '31%',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 9,
    color: '#a0a0b4',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightsContainer: {
    backgroundColor: '#3c2832',
    padding: 12,
    borderRadius: 8,
  },
  insightItem: {
    fontSize: 11,
    marginBottom: 8,
    paddingLeft: 12,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#464650',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#a0a0b4',
  },
})

export function OverallReportPDF({ feedings, sleeps, diapers, pumpings, dateRange, babyName }: OverallReportPDFProps) {
  // Calculate statistics
  const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) || 1

  const totalFeedings = feedings.length
  const bottleFeedings = feedings.filter(f => f.feeding_type === 'bottle')
  const breastFeedings = feedings.filter(f => f.feeding_type === 'breast')
  const totalBottleMl = bottleFeedings.reduce((sum, f) => sum + (f.amount_ml || 0), 0)
  const totalNursingMinutes = breastFeedings.reduce((sum, f) =>
    sum + (f.left_duration_minutes || 0) + (f.right_duration_minutes || 0), 0
  )
  const avgFeedingsPerDay = (totalFeedings / daysDiff).toFixed(1)

  const totalSleeps = sleeps.length
  const naps = sleeps.filter(s => s.sleep_type === 'nap')
  const nights = sleeps.filter(s => s.sleep_type === 'night')
  const totalSleepMinutes = sleeps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const totalSleepHours = Math.floor(totalSleepMinutes / 60)
  const totalSleepMins = totalSleepMinutes % 60
  const avgSleepHoursPerDay = (totalSleepMinutes / daysDiff / 60).toFixed(1)
  const longestSleep = sleeps.reduce((max, s) => Math.max(max, s.duration_minutes || 0), 0)

  const totalDiapers = diapers.length
  const wetOnly = diapers.filter(d => d.is_wet && !d.is_dirty).length
  const dirtyOnly = diapers.filter(d => d.is_dirty && !d.is_wet).length
  const both = diapers.filter(d => d.is_wet && d.is_dirty).length
  const avgDiapersPerDay = (totalDiapers / daysDiff).toFixed(1)

  const totalPumpingSessions = pumpings.length
  const totalPumpedMl = pumpings.reduce((sum, p) => sum + (p.total_amount_ml || 0), 0)
  const avgPumpedPerSession = totalPumpingSessions > 0 ? Math.round(totalPumpedMl / totalPumpingSessions) : 0

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  return (
    <Document>
      {/* PAGE 1: Title & Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Overall Baby Care Report</Text>
          <View style={styles.babyInfo}>
            <Text style={styles.babyName}>{babyName}</Text>
            <Text style={styles.dateRange}>
              {format(dateRange.start, 'MMMM d, yyyy')} - {format(dateRange.end, 'MMMM d, yyyy')}
            </Text>
            <Text style={styles.trackingDays}>
              {daysDiff} day{daysDiff !== 1 ? 's' : ''} of tracking data
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.cardNumber}>{totalFeedings}</Text>
            <Text style={styles.cardLabel}>FEEDINGS</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardNumber}>{totalSleeps}</Text>
            <Text style={styles.cardLabel}>SLEEP SESSIONS</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardNumber}>{totalDiapers}</Text>
            <Text style={styles.cardLabel}>DIAPER CHANGES</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardNumber}>{totalPumpingSessions}</Text>
            <Text style={styles.cardLabel}>PUMPING SESSIONS</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2: Detailed Statistics */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageHeader}>Detailed Statistics</Text>

        {/* Feeding Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feeding Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Feedings</Text>
                <Text style={styles.statValue}>{totalFeedings}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg. Per Day</Text>
                <Text style={styles.statValue}>{avgFeedingsPerDay}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Bottle Feedings</Text>
                <Text style={styles.statValue}>{bottleFeedings.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Breast Feedings</Text>
                <Text style={styles.statValue}>{breastFeedings.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Bottle</Text>
                <Text style={styles.statValue}>{totalBottleMl} ml</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Nursing</Text>
                <Text style={styles.statValue}>{formatDuration(totalNursingMinutes)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sleep Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Sleep</Text>
                <Text style={styles.statValue}>{totalSleepHours}h {totalSleepMins}m</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg. Per Day</Text>
                <Text style={styles.statValue}>{avgSleepHoursPerDay}h</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Naps</Text>
                <Text style={styles.statValue}>{naps.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Night Sleeps</Text>
                <Text style={styles.statValue}>{nights.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Longest Sleep</Text>
                <Text style={styles.statValue}>{formatDuration(longestSleep)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Sessions</Text>
                <Text style={styles.statValue}>{totalSleeps}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Diaper Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diaper Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Changes</Text>
                <Text style={styles.statValue}>{totalDiapers}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg. Per Day</Text>
                <Text style={styles.statValue}>{avgDiapersPerDay}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Wet Only</Text>
                <Text style={styles.statValue}>{wetOnly}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Dirty Only</Text>
                <Text style={styles.statValue}>{dirtyOnly}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Both</Text>
                <Text style={styles.statValue}>{both}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Wet</Text>
                <Text style={styles.statValue}>{wetOnly + both}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pumping Stats */}
        {totalPumpingSessions > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pumping Statistics</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Sessions</Text>
                  <Text style={styles.statValue}>{totalPumpingSessions}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Pumped</Text>
                  <Text style={styles.statValue}>{totalPumpedMl} ml</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Avg. Per Session</Text>
                  <Text style={styles.statValue}>{avgPumpedPerSession} ml</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </Page>

      {/* PAGE 3: Key Insights */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageHeader}>Key Insights</Text>

        <View style={styles.insightsContainer}>
          <Text style={styles.insightItem}>
            - Your baby averaged {avgFeedingsPerDay} feedings per day and {avgSleepHoursPerDay} hours of sleep per day
          </Text>

          {bottleFeedings.length > 0 && (
            <Text style={styles.insightItem}>
              - Consumed an average of {Math.round(totalBottleMl / daysDiff)} ml of formula/milk per day
            </Text>
          )}

          <Text style={styles.insightItem}>
            - Required {avgDiapersPerDay} diaper changes per day on average
          </Text>

          {longestSleep > 0 && (
            <Text style={styles.insightItem}>
              - Longest sleep stretch was {formatDuration(longestSleep)}
            </Text>
          )}

          {naps.length > 0 && (
            <Text style={styles.insightItem}>
              - Took an average of {(naps.length / daysDiff).toFixed(1)} naps per day
            </Text>
          )}

          {totalPumpingSessions > 0 && (
            <Text style={styles.insightItem}>
              - Average pumping output was {avgPumpedPerSession} ml per session
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Baby Tracker - Comprehensive Care Report</Text>
          <Text style={styles.footerText}>
            Generated on {format(new Date(), 'MMMM d, yyyy')} at {format(new Date(), 'h:mm a')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
