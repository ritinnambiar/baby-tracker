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

// PDF Styles - Medical Report Format
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    color: '#000000',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  patientInfo: {
    marginTop: 15,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    width: 120,
    color: '#000000',
  },
  infoValue: {
    fontSize: 9,
    color: '#000000',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
  },
  table: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000000',
  },
  tableCol: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    padding: 4,
  },
  tableColLast: {
    width: '50%',
    padding: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableCell: {
    fontSize: 8,
    padding: 3,
    width: '50%',
  },
  tableCellLabel: {
    fontSize: 8,
    padding: 3,
    width: '50%',
    fontWeight: 'bold',
  },
  observations: {
    marginTop: 8,
  },
  observationItem: {
    fontSize: 9,
    marginBottom: 3,
    paddingLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#000000',
    textAlign: 'center',
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
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BABY CARE REPORT</Text>
          <Text style={styles.subtitle}>Comprehensive Developmental Tracking Summary</Text>
        </View>

        {/* Patient Information */}
        <View style={styles.patientInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Baby Name:</Text>
            <Text style={styles.infoValue}>{babyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Report Period:</Text>
            <Text style={styles.infoValue}>
              {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')} ({daysDiff} days)
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Report Date:</Text>
            <Text style={styles.infoValue}>{format(new Date(), 'MMMM d, yyyy')}</Text>
          </View>
        </View>

        {/* Feeding */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. FEEDING</Text>
          <View style={styles.table}>
            <View style={styles.tableCol}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Total Feedings:</Text>
                <Text style={styles.tableCell}>{totalFeedings}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Average Per Day:</Text>
                <Text style={styles.tableCell}>{avgFeedingsPerDay}</Text>
              </View>
              <View style={styles.tableRowLast}>
                <Text style={styles.tableCellLabel}>Bottle Feedings:</Text>
                <Text style={styles.tableCell}>{bottleFeedings.length}</Text>
              </View>
            </View>
            <View style={styles.tableColLast}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Breast Feedings:</Text>
                <Text style={styles.tableCell}>{breastFeedings.length}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Total Formula:</Text>
                <Text style={styles.tableCell}>{totalBottleMl} ml</Text>
              </View>
              <View style={styles.tableRowLast}>
                <Text style={styles.tableCellLabel}>Total Nursing Time:</Text>
                <Text style={styles.tableCell}>{formatDuration(totalNursingMinutes)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sleep */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. SLEEP</Text>
          <View style={styles.table}>
            <View style={styles.tableCol}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Total Sleep Time:</Text>
                <Text style={styles.tableCell}>{totalSleepHours}h {totalSleepMins}m</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Average Per Day:</Text>
                <Text style={styles.tableCell}>{avgSleepHoursPerDay}h</Text>
              </View>
              <View style={styles.tableRowLast}>
                <Text style={styles.tableCellLabel}>Nap Sessions:</Text>
                <Text style={styles.tableCell}>{naps.length}</Text>
              </View>
            </View>
            <View style={styles.tableColLast}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Night Sleep Sessions:</Text>
                <Text style={styles.tableCell}>{nights.length}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Longest Sleep Period:</Text>
                <Text style={styles.tableCell}>{formatDuration(longestSleep)}</Text>
              </View>
              <View style={styles.tableRowLast}>
                <Text style={styles.tableCellLabel}>Total Sessions:</Text>
                <Text style={styles.tableCell}>{totalSleeps}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Diaper */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. ELIMINATION</Text>
          <View style={styles.table}>
            <View style={styles.tableCol}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Total Changes:</Text>
                <Text style={styles.tableCell}>{totalDiapers}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Average Per Day:</Text>
                <Text style={styles.tableCell}>{avgDiapersPerDay}</Text>
              </View>
              <View style={styles.tableRowLast}>
                <Text style={styles.tableCellLabel}>Wet Only:</Text>
                <Text style={styles.tableCell}>{wetOnly}</Text>
              </View>
            </View>
            <View style={styles.tableColLast}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Soiled Only:</Text>
                <Text style={styles.tableCell}>{dirtyOnly}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Combined:</Text>
                <Text style={styles.tableCell}>{both}</Text>
              </View>
              <View style={styles.tableRowLast}>
                <Text style={styles.tableCellLabel}>Total Wet:</Text>
                <Text style={styles.tableCell}>{wetOnly + both}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pumping (if applicable) */}
        {totalPumpingSessions > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. LACTATION</Text>
            <View style={styles.table}>
              <View style={styles.tableCol}>
                <View style={styles.tableRowLast}>
                  <Text style={styles.tableCellLabel}>Total Sessions:</Text>
                  <Text style={styles.tableCell}>{totalPumpingSessions}</Text>
                </View>
              </View>
              <View style={styles.tableColLast}>
                <View style={styles.tableRowLast}>
                  <Text style={styles.tableCellLabel}>Total Output:</Text>
                  <Text style={styles.tableCell}>{totalPumpedMl} ml ({avgPumpedPerSession} ml avg)</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{totalPumpingSessions > 0 ? '5' : '4'}. QUICK STATS</Text>
          <View style={styles.observations}>
            <Text style={styles.observationItem}>
              • Feeding frequency: {avgFeedingsPerDay} feeds per day
            </Text>
            <Text style={styles.observationItem}>
              • Sleep duration: {avgSleepHoursPerDay} hours per day average
            </Text>
            <Text style={styles.observationItem}>
              • Diaper changes: {avgDiapersPerDay} changes per day
            </Text>
            {longestSleep > 0 && (
              <Text style={styles.observationItem}>
                • Longest sleep: {formatDuration(longestSleep)}
              </Text>
            )}
            {bottleFeedings.length > 0 && (
              <Text style={styles.observationItem}>
                • Average formula intake: {Math.round(totalBottleMl / daysDiff)} ml per day
              </Text>
            )}
            {naps.length > 0 && (
              <Text style={styles.observationItem}>
                • Naps per day: {(naps.length / daysDiff).toFixed(1)}
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This report is computer-generated and contains observational data only. For medical advice, please consult with a qualified healthcare provider.
          </Text>
          <Text style={styles.footerText}>
            Generated: {format(new Date(), 'MMMM d, yyyy')} | Baby Tracker Medical Report System
          </Text>
        </View>
      </Page>
    </Document>
  )
}
