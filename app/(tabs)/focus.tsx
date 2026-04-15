import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated, Easing } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppStore, TaskCategory } from '../../store'
import { TaskSlot } from '../../components/TaskSlot'
import { BeastCompanion, BeastType } from '../../components/BeastCompanion'
import { ConfettiOverlay } from '../../components/ConfettiOverlay'
import { DarkColors } from '../../constants/colors'
import { getToday } from '../../utils/date'
import * as Haptics from 'expo-haptics'
import { Audio } from 'expo-av'

const AMBIENT_SOUNDS = [
  { key: 'none', label: 'None', file: null, premium: false },
  { key: 'fire', label: 'Fire', file: require('../../assets/sounds/fire.mp3'), premium: false },
  { key: 'water', label: 'Water', file: require('../../assets/sounds/water.mp3'), premium: false },
  { key: 'bubble', label: 'Bubble', file: require('../../assets/sounds/bubble.mp3'), premium: false },
  { key: 'bird', label: 'Bird', file: require('../../assets/sounds/bird.mp3'), premium: false },
  { key: 'scratching', label: 'Scratching', file: require('../../assets/sounds/scratching.mp3'), premium: false },
  { key: 'spiritual', label: 'Spiritual', file: require('../../assets/sounds/spiritual.mp3'), premium: true },
  { key: 'meditative', label: 'Meditative', file: require('../../assets/sounds/meditative.mp3'), premium: true },
  { key: 'asmr_meditation', label: 'ASMR Meditation', file: require('../../assets/sounds/asmr meditation.mp3'), premium: true },
]

function CompletionScreen({ xpEarned, beastState, activeBeast, beastName, onNewSession }: {
  xpEarned: number
  beastState: { level: number; xp: { percentage: number }; evolution: string }
  activeBeast: BeastType
  beastName: string
  onNewSession: () => void
}) {
  const [displayedXP, setDisplayedXP] = useState(0)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 8, useNativeDriver: true }),
    ]).start()

    let current = 0
    const step = Math.max(1, Math.floor(xpEarned / 30))
    const interval = setInterval(() => {
      current = Math.min(current + step, xpEarned)
      setDisplayedXP(current)
      if (current >= xpEarned) clearInterval(interval)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  return (
    <View style={styles.container}>
      <ConfettiOverlay visible={true} message="SESSION COMPLETE" />
      <Animated.View style={[styles.completionContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <BeastCompanion
          mood="celebrating"
          message="Great focus session!"
          level={beastState.level}
          evolution={beastState.evolution}
          xpPercentage={beastState.xp.percentage}
          completedCount={3}
          beastType={activeBeast}
          beastName={beastName}
        />
        <View style={styles.xpEarnedBadge}>
          <Text style={styles.xpEarnedText}>+{displayedXP} XP</Text>
        </View>
        <Text style={styles.completedSub}>Deep work accomplished.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onNewSession}>
          <Text style={styles.doneBtnText}>NEW SESSION</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

export default function FocusScreen() {
  const insets = useSafeAreaInsets()
  const premium = useAppStore(s => s.premium)
  const freeFocusUsed = useAppStore(s => s.freeFocusUsed)
  const useFreeFocus = useAppStore(s => s.useFreeFocus)
  const addFocusXP = useAppStore(s => s.addFocusXP)
  const completeTask = useAppStore(s => s.completeTask)
  const completeSubTask = useAppStore(s => s.completeSubTask)
  const tasks = useAppStore(s => s.tasks)
  const confettiVisible = useAppStore(s => s.confettiVisible)
  const dismissConfetti = useAppStore(s => s.dismissConfetti)
  const getBeastState = useAppStore(s => s.getBeastState)
  const activeBeast = useAppStore(s => s.activeBeast)
  const beastNames = useAppStore(s => s.beastNames)
  const soundEnabled = useAppStore(s => s.settings.soundEnabled)

  const today = getToday()
  const todayTasks = tasks.filter(t => t.date === today)
  const incompleteTasks = todayTasks.filter(t => !t.completed)
  const completedCount = todayTasks.filter(t => t.completed).length
  const allDone = completedCount === todayTasks.length && todayTasks.length === 3
  const beastState = getBeastState()

  const [duration, setDuration] = useState(25)
  const [actualDuration, setActualDuration] = useState(25)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [showPaywall, setShowPaywall] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'task' | 'sub' | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [selectedSound, setSelectedSound] = useState('none')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const soundRef = useRef<Audio.Sound | null>(null)
  const completedSentRef = useRef(false)

  const stopAmbientSound = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync() } catch {}
      soundRef.current = null
    }
  }, [])

  const playAmbientSound = useCallback(async () => {
    await stopAmbientSound()
    if (!soundEnabled) return
    const soundDef = AMBIENT_SOUNDS.find(s => s.key === selectedSound)
    if (!soundDef?.file) return
    if (soundDef.premium && !premium) return
    try {
      const { sound } = await Audio.Sound.createAsync(soundDef.file, { isLooping: true, volume: 0.5 })
      soundRef.current = sound
      await sound.playAsync()
    } catch {}
    }, [selectedSound, premium, stopAmbientSound, soundEnabled])

  useEffect(() => { return () => { stopAmbientSound() } }, [])

  const selectedTaskCategory = useMemo<TaskCategory>(() => {
    if (selectedType === 'task' && selectedId) {
      return todayTasks.find(t => t.id === selectedId)?.category || 'work'
    }
    if (selectedType === 'sub' && selectedParentId) {
      return todayTasks.find(t => t.id === selectedParentId)?.category || 'work'
    }
    return 'work'
  }, [selectedId, selectedType, selectedParentId, todayTasks])

  const progress = Math.min(100, Math.max(0, actualDuration > 0 ? ((actualDuration * 60 - timeLeft) / (actualDuration * 60)) * 100 : 0))

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStart = useCallback(() => {
    if (!premium && freeFocusUsed) {
      setShowPaywall(true)
      return
    }

    completedSentRef.current = false

    let sessionDuration = duration
    if (!premium && !freeFocusUsed) {
      useFreeFocus()
      sessionDuration = 5
    }

    setActualDuration(sessionDuration)
    setTimeLeft(sessionDuration * 60)
    setIsRunning(true)
    setIsPaused(false)
    setIsCompleted(false)
    setXpEarned(0)

    playAmbientSound()
  }, [premium, freeFocusUsed, duration, useFreeFocus, playAmbientSound])

  const handlePause = () => {
    setIsPaused(!isPaused)
    if (!isPaused) stopAmbientSound()
    else playAmbientSound()
  }

  const handleStop = () => {
    Alert.alert('Stop session?', 'Your progress will be lost.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => {
        stopAmbientSound()
        setIsRunning(false)
        setIsPaused(false)
        setTimeLeft(actualDuration * 60)
      }},
    ])
  }

  const selectedIdRef = useRef(selectedId)
  const selectedTypeRef = useRef(selectedType)
  const selectedParentIdRef = useRef(selectedParentId)
  selectedIdRef.current = selectedId
  selectedTypeRef.current = selectedType
  selectedParentIdRef.current = selectedParentId

  const handleComplete = useCallback(() => {
    if (completedSentRef.current) return
    completedSentRef.current = true
    stopAmbientSound()
    const d = actualDuration
    const earned = Math.floor(d / 5) * 5
    setXpEarned(earned)
    setIsCompleted(true)
    setIsRunning(false)
    const sId = selectedIdRef.current
    const sType = selectedTypeRef.current
    const sParentId = selectedParentIdRef.current
    if (sType === 'task' && sId) {
      completeTask(sId)
    } else if (sType === 'sub' && sParentId && sId) {
      completeSubTask(sParentId, sId)
    } else {
      addFocusXP(earned)
    }
  }, [actualDuration, addFocusXP, completeTask, completeSubTask])

  const resetFocus = () => {
    setIsCompleted(false)
    setShowPaywall(false)
    setIsRunning(false)
    setIsPaused(false)
    setTimeLeft(duration * 60)
    setActualDuration(duration)
    setXpEarned(0)
    setSelectedId(null)
    setSelectedType(null)
    setSelectedParentId(null)
    dismissConfetti()
  }

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) return 0
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, isPaused])

  useEffect(() => {
    if (timeLeft === 0 && isRunning && !completedSentRef.current) {
      handleComplete()
    }
  }, [timeLeft, isRunning, handleComplete])

  useEffect(() => {
    if (confettiVisible) {
      const timer = setTimeout(dismissConfetti, 3500)
      return () => clearTimeout(timer)
    }
  }, [confettiVisible, dismissConfetti])

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
  }, [])

  const playCompletionSound = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/sounds/complete.wav'))
      await sound.playAsync()
      setTimeout(() => { sound.stopAsync(); sound.unloadAsync() }, 2000)
    } catch (e) {
      if (__DEV__) console.log('Sound error:', e)
    }
  }, [])

  useEffect(() => {
    if (isCompleted && soundEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTimeout(() => playCompletionSound(), 300)
    } else if (isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }, [isCompleted, soundEnabled, playCompletionSound])

  if (allDone && !isRunning && !isCompleted && todayTasks.length > 0 && selectedType === null) {
    return (
      <View style={styles.container}>
        <ConfettiOverlay visible={confettiVisible} message="ALL DONE" />
        <BeastCompanion
          mood="celebrating"
          message="All tasks complete!"
          level={beastState.level}
          evolution={beastState.evolution}
          xpPercentage={beastState.xp.percentage}
          completedCount={3}
          beastType={activeBeast}
          beastName={beastNames[activeBeast]}
        />
        <Text style={styles.allDoneSub}>Start a free session for bonus XP, or come back tomorrow.</Text>
        <TouchableOpacity style={styles.startBtn} onPress={() => { setSelectedType(null); setSelectedId(null); handleStart() }}>
          <Text style={styles.startBtnText}>FREE FOCUS SESSION</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isCompleted) {
    return <CompletionScreen xpEarned={xpEarned} beastState={beastState} activeBeast={activeBeast} beastName={beastNames[activeBeast]} onNewSession={resetFocus} />
  }

  if (showPaywall) {
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}>
        <View style={styles.closeRow}>
          <TouchableOpacity onPress={() => setShowPaywall(false)} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.paywallTitle}>Focus Mode</Text>
        <Text style={styles.paywallSub}>You've used your free session. Upgrade for unlimited focus.</Text>

        <View style={styles.featuresList}>
          {['Unlimited sessions', 'Custom duration (5-60 min)', 'Full beast evolution', 'Advanced stats', 'Ambient sounds'].map(f => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.yearlyBtn}>
          <Text style={styles.yearlyBtnText}>$39.99 / YEAR</Text>
          <Text style={styles.yearlyBtnSub}>7-day free trial  |  Save 33%</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.monthlyBtn}>
          <Text style={styles.monthlyBtnText}>$4.99 / MONTH</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowPaywall(false)} style={styles.laterBtn}>
          <Text style={styles.laterLink}>Not now</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  return (
    <View style={styles.container}>
      <ConfettiOverlay visible={confettiVisible} message={allDone ? 'ALL DONE' : undefined} />

      {!isRunning ? (
        <ScrollView contentContainerStyle={[styles.setupContent, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.title}>Focus</Text>
          <Text style={styles.subtitle}>Select a task and start</Text>

          {incompleteTasks.length > 0 && (
            <View style={styles.tasksPreview}>
              <Text style={styles.tasksPreviewTitle}>SELECT A TASK</Text>
              {incompleteTasks.map(task => {
                const isTaskSelected = selectedId === task.id && selectedType === 'task'
                const isSubInThisTask = selectedParentId === task.id && selectedType === 'sub'
                const showBorder = isTaskSelected || isSubInThisTask

                return (
                  <View key={task.id} style={showBorder ? styles.selectedWrapper : styles.taskCardWrapper}>
                    <TaskSlot
                      text={task.text}
                      completed={false}
                      subtasks={task.subtasks.length > 0 ? task.subtasks : undefined}
                      selectedSubtaskId={selectedParentId === task.id ? selectedId : null}
                      noMargin={true}
                      onComplete={() => {
                        setSelectedId(task.id)
                        setSelectedType('task')
                        setSelectedParentId(null)
                      }}
                      onSubtaskComplete={(subId) => {
                        setSelectedId(subId)
                        setSelectedType('sub')
                        setSelectedParentId(task.id)
                      }}
                    />
                  </View>
                )
              })}
            </View>
          )}

          <View style={styles.durationSection}>
            <Text style={styles.durationLabel}>DURATION</Text>
            <View style={styles.durationRow}>
              {[5, 15, 25, 45].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.durationChip, duration === d && styles.durationChipActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.durationChipText, duration === d && styles.durationChipTextActive]}>{d}m</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.soundSection}>
            <Text style={styles.soundLabel}>AMBIENT SOUND</Text>
            <View style={styles.soundRow}>
              {AMBIENT_SOUNDS.map(s => {
                const isLocked = s.premium && !premium
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.soundChip, selectedSound === s.key && styles.soundChipActive, isLocked && styles.soundChipLocked]}
                    onPress={() => !isLocked ? setSelectedSound(s.key) : setShowPaywall(true)}
                  >
                    <Text style={[styles.soundChipText, selectedSound === s.key && styles.soundChipTextActive, isLocked && styles.soundChipTextLocked]}>
                      {isLocked ? 'PRO' : s.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {!premium && !freeFocusUsed && (
            <Text style={styles.freeHint}>First session free (5 min)</Text>
          )}

          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStart}
          >
            <Text style={styles.startBtnText}>BEGIN</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={[styles.runningContainer, { paddingTop: insets.top + 24 }]}>
          <View style={styles.timerContainer}>
            <View style={styles.timerRing}>
              <View style={[styles.timerProgress, { height: `${progress}%` }]} />
            </View>
            <View style={styles.timerInner}>
              <Text style={styles.timerDisplay}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerTotal}>{actualDuration} min session</Text>
            </View>
          </View>

          <View style={styles.runningControls}>
            <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
              <Text style={styles.pauseBtnText}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.stopBtnText}>STOP</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.xpHint}>+{Math.floor(actualDuration / 5) * 5} XP</Text>

          <BeastCompanion
            mood="work"
            message="Stay focused."
            level={beastState.level}
            evolution={beastState.evolution}
            xpPercentage={progress}
            category={selectedTaskCategory}
            beastType={activeBeast}
            beastName={beastNames[activeBeast]}
          />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scrollContainer: { flex: 1, backgroundColor: DarkColors.background },
  scrollContent: { padding: 24, paddingTop: 60, alignItems: 'center' },
  setupContent: { alignItems: 'center', paddingBottom: 40 },
  runningContainer: { alignItems: 'center', paddingBottom: 40, paddingTop: 60 },
  allDoneSub: {
    fontSize: 14,
    color: DarkColors.textSecondary,
  },
  completionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedSub: {
    fontSize: 14,
    color: DarkColors.textSecondary,
    marginBottom: 24,
  },
  xpEarnedBadge: {
    backgroundColor: DarkColors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 36,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  xpEarnedText: { fontSize: 18, fontWeight: '700', color: DarkColors.primary, letterSpacing: 1 },
  doneBtn: {
    backgroundColor: DarkColors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  doneBtnText: { fontSize: 14, fontWeight: '600', color: DarkColors.textPrimary, letterSpacing: 1.5 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: DarkColors.textPrimary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: DarkColors.textSecondary,
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  durationSection: { width: '100%', alignItems: 'center', marginBottom: 24 },
  durationLabel: { fontSize: 10, fontWeight: '700', color: DarkColors.textSecondary, letterSpacing: 2, marginBottom: 14 },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: DarkColors.surface,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  durationChipActive: { backgroundColor: DarkColors.primary, borderColor: DarkColors.primary },
  durationChipText: { fontSize: 14, fontWeight: '600', color: DarkColors.textSecondary, letterSpacing: 0.5 },
  durationChipTextActive: { color: '#fff' },
  soundSection: { width: '100%', alignItems: 'center', marginBottom: 24 },
  soundLabel: { fontSize: 10, fontWeight: '700', color: DarkColors.textSecondary, letterSpacing: 2, marginBottom: 14 },
  soundRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  soundChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: DarkColors.surface,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  soundChipActive: { borderColor: DarkColors.primary, backgroundColor: 'rgba(184, 170, 255, 0.12)' },
  soundChipLocked: { opacity: 0.4 },
  soundChipText: { fontSize: 11, fontWeight: '500', color: DarkColors.textSecondary, letterSpacing: 0.3 },
  soundChipTextActive: { color: DarkColors.primary, fontWeight: '700' },
  soundChipTextLocked: { color: DarkColors.accent, fontWeight: '700' },
  freeHint: {
    fontSize: 12,
    color: DarkColors.secondary,
    fontWeight: '500',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  tasksPreview: {
    width: '100%',
    marginBottom: 24,
  },
  tasksPreviewTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: DarkColors.textSecondary,
    letterSpacing: 2,
    marginBottom: 10,
  },
  startBtn: {
    backgroundColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 56,
  },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  taskCardWrapper: {
    marginBottom: 8,
  },
  selectedWrapper: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DarkColors.primary,
    marginBottom: 8,
  },
  timerContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: DarkColors.surface,
    borderWidth: 1,
    borderColor: DarkColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  timerRing: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, justifyContent: 'flex-end' },
  timerProgress: { width: '100%', backgroundColor: DarkColors.primary },
  timerInner: { alignItems: 'center', zIndex: 1 },
  timerDisplay: { fontSize: 36, fontWeight: '700', color: DarkColors.textPrimary, letterSpacing: 2, fontVariant: ['tabular-nums'] },
  timerTotal: { fontSize: 12, color: '#FFFFFF', letterSpacing: 0.5, marginTop: 4 },
  runningControls: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  pauseBtn: {
    backgroundColor: DarkColors.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  pauseBtnText: { fontSize: 13, fontWeight: '700', color: DarkColors.textPrimary, letterSpacing: 1 },
  stopBtn: {
    backgroundColor: DarkColors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: DarkColors.danger,
  },
  stopBtnText: { fontSize: 13, fontWeight: '700', color: DarkColors.danger, letterSpacing: 1 },
  xpHint: { fontSize: 12, color: DarkColors.accent, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  closeRow: { width: '100%', alignItems: 'flex-end', marginBottom: 20 },
  closeBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  closeText: { fontSize: 14, fontWeight: '600', color: DarkColors.textSecondary, letterSpacing: 0.5 },
  paywallTitle: { fontSize: 22, fontWeight: '700', color: DarkColors.textPrimary, marginBottom: 8, letterSpacing: 0.5 },
  paywallSub: { fontSize: 13, color: DarkColors.textSecondary, textAlign: 'center', marginBottom: 28, maxWidth: '85%', lineHeight: 20 },
  featuresList: { alignSelf: 'flex-start', marginBottom: 32, gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: DarkColors.primary },
  featureText: { fontSize: 14, color: DarkColors.textPrimary, fontWeight: '400', letterSpacing: 0.3 },
  yearlyBtn: { backgroundColor: DarkColors.primary, borderRadius: 10, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 10 },
  yearlyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  yearlyBtnSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4, letterSpacing: 0.5 },
  monthlyBtn: { borderWidth: 1, borderColor: DarkColors.border, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 20, backgroundColor: DarkColors.surface },
  monthlyBtnText: { color: DarkColors.textPrimary, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  laterBtn: { paddingVertical: 12 },
  laterLink: { fontSize: 14, color: DarkColors.textSecondary, fontWeight: '500', letterSpacing: 0.5 },
})
