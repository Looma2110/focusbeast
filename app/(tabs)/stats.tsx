import React from 'react'
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppStore } from '../../store'
import { DarkColors } from '../../constants/colors'
import { getLast7Days, parseLocalDate } from '../../utils/date'
import { BEAST_DEFS, BeastType } from '../../components/BeastCompanion'

const BEAST_STATS_ICONS: Record<BeastType, any> = {
  dog: require('../../assets/beast/dog/happy.png'),
  cat: require('../../assets/beast/cat/happy.png'),
  monkey: require('../../assets/beast/monkey/happy.png'),
  rabbit: require('../../assets/beast/rabbit/happy.png'),
  fox: require('../../assets/beast/dog/happy.png'),
  lion: require('../../assets/beast/dog/happy.png'),
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets()
  const totalPoints = useAppStore(s => s.totalPoints)
  const totalXP = useAppStore(s => s.totalXP)
  const currentStreak = useAppStore(s => s.currentStreak)
  const longestStreak = useAppStore(s => s.longestStreak)
  const dayLogs = useAppStore(s => s.dayLogs)
  const getBeastState = useAppStore(s => s.getBeastState)
  const activeBeast = useAppStore(s => s.activeBeast)
  const beastNames = useAppStore(s => s.beastNames)
  const unlockedBeasts = useAppStore(s => s.unlockedBeasts)

  const beastState = getBeastState()
  const last7Days = getLast7Days()
  const weeklyData = last7Days.map(d => {
    const log = dayLogs.find(l => l.date === d)
    return { date: d, points: log?.points || 0 }
  })
  const maxPoints = Math.max(...weeklyData.map(d => d.points), 1)
  const totalCompleted = dayLogs.reduce((sum, l) => sum + l.tasksCompleted, 0)
  const totalAdded = dayLogs.reduce((sum, l) => sum + l.tasksAdded, 0)
  const completionRate = totalAdded > 0 ? Math.round((totalCompleted / totalAdded) * 100) : 0
  const activeDays = dayLogs.filter(l => l.tasksCompleted > 0).length
  const perfectDays = dayLogs.filter(l => l.allCompleted).length

  const evoNames: Record<string, string> = { baby: 'Seedling', teen: 'Spark', adult: 'Flux', mega: 'Apex' }
  const weekTotalXP = weeklyData.reduce((sum, d) => sum + d.points, 0)

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}>
      <Text style={styles.title}>Stats</Text>

      <View style={styles.beastHeader}>
        <Image
          source={BEAST_STATS_ICONS[activeBeast]}
          style={styles.beastImage}
          resizeMode="contain"
        />
        <View style={styles.beastInfo}>
          <Text style={styles.beastName}>{beastNames[activeBeast] || BEAST_DEFS[activeBeast].label}</Text>
          <Text style={styles.beastLevel}>LEVEL {beastState.level} · {evoNames[beastState.evolution] || 'Seedling'}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${beastState.xp.percentage}%` }]} />
          </View>
          <Text style={styles.xpText}>{beastState.xp.current} / {beastState.xp.needed} XP</Text>
        </View>
      </View>

      <View style={styles.xpSummary}>
        <View style={styles.xpCard}>
          <Text style={styles.xpValue}>{totalXP}</Text>
          <Text style={styles.xpLabel}>TOTAL XP</Text>
        </View>
        <View style={styles.xpCard}>
          <Text style={styles.xpValue}>{weekTotalXP}</Text>
          <Text style={styles.xpLabel}>THIS WEEK</Text>
        </View>
        <View style={styles.xpCard}>
          <Text style={styles.xpValue}>{unlockedBeasts.length}</Text>
          <Text style={styles.xpLabel}>BEASTS</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>WEEKLY OVERVIEW</Text>
      <View style={styles.chart}>
        {weeklyData.map((day, i) => {
          const height = maxPoints > 0 ? (day.points / maxPoints) * 70 : 0
          const isToday = i === 6
          return (
            <View key={day.date} style={styles.barCol}>
              <Text style={styles.barVal}>{day.points > 0 ? day.points : ''}</Text>
              <View style={styles.barTrack}>
                <View style={[
                  styles.barFill,
                  {
                    height: Math.max(height, 3),
                    backgroundColor: day.points > 0
                      ? isToday ? DarkColors.secondary : DarkColors.primary
                      : DarkColors.border,
                  },
                ]} />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {parseLocalDate(day.date).toLocaleDateString('en', { weekday: 'narrow' })}
              </Text>
            </View>
          )
        })}
      </View>

      <Text style={styles.sectionTitle}>STREAKS</Text>
      <View style={styles.streakCard}>
        <View style={styles.streakRow}>
          <View>
            <Text style={styles.streakValue}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>CURRENT</Text>
          </View>
          <View style={styles.streakDivider} />
          <View>
            <Text style={styles.streakValue}>{longestStreak}</Text>
            <Text style={styles.streakLabel}>BEST</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{totalPoints}</Text>
          <Text style={styles.metricLabel}>POINTS</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{completionRate}%</Text>
          <Text style={styles.metricLabel}>COMPLETION</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{activeDays}</Text>
          <Text style={styles.metricLabel}>ACTIVE DAYS</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{perfectDays}</Text>
          <Text style={styles.metricLabel}>PERFECT DAYS</Text>
        </View>
      </View>

      <Text style={styles.encouragement}>
        {currentStreak > 7 ? 'Streak on fire.' : currentStreak > 3 ? 'Building momentum.' : 'Keep going.'}
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DarkColors.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: DarkColors.textPrimary, marginBottom: 20, letterSpacing: 1 },
  beastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: DarkColors.border,
    marginBottom: 12,
  },
  beastImage: { width: 70, height: 70, marginRight: 16 },
  beastInfo: { flex: 1 },
  beastName: { fontSize: 18, fontWeight: '700', color: DarkColors.textPrimary, letterSpacing: 1 },
  beastLevel: { fontSize: 11, fontWeight: '600', color: DarkColors.textSecondary, letterSpacing: 1.5, marginTop: 2, marginBottom: 8 },
  xpBar: { height: 3, backgroundColor: DarkColors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: '100%', backgroundColor: DarkColors.primary, borderRadius: 2 },
  xpText: { fontSize: 10, color: DarkColors.textSecondary, letterSpacing: 0.5 },
  xpSummary: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  xpCard: {
    flex: 1,
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  xpValue: { fontSize: 18, fontWeight: '700', color: DarkColors.primary, letterSpacing: 0.5 },
  xpLabel: { fontSize: 9, fontWeight: '700', color: DarkColors.textSecondary, letterSpacing: 1.5, marginTop: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: DarkColors.textSecondary, marginBottom: 12, marginTop: 24, letterSpacing: 2 },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: DarkColors.surface,
    borderRadius: 14,
    padding: 18,
    height: 130,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barVal: { fontSize: 9, fontWeight: '600', color: DarkColors.textSecondary, marginBottom: 6, height: 14 },
  barTrack: {
    width: 20,
    height: 65,
    backgroundColor: DarkColors.surfaceElevated,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 6 },
  dayLabel: { fontSize: 10, color: DarkColors.textSecondary, marginTop: 8, fontWeight: '500' },
  dayLabelToday: { color: DarkColors.secondary, fontWeight: '700' },
  streakCard: {
    backgroundColor: DarkColors.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  streakRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  streakDivider: { width: 1, height: 36, backgroundColor: DarkColors.border },
  streakValue: { fontSize: 24, fontWeight: '700', color: DarkColors.textPrimary, textAlign: 'center' },
  streakLabel: { fontSize: 9, fontWeight: '700', color: DarkColors.textSecondary, letterSpacing: 1.5, marginTop: 4, textAlign: 'center' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metric: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  metricValue: { fontSize: 20, fontWeight: '700', color: DarkColors.textPrimary, letterSpacing: 0.5 },
  metricLabel: { fontSize: 9, fontWeight: '700', color: DarkColors.textSecondary, letterSpacing: 1.5, marginTop: 4 },
  encouragement: {
    fontSize: 13,
    color: DarkColors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.5,
  },
})
