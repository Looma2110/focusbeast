import React, { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppStore, TaskCategory } from '../../store'
import { TaskSlot } from '../../components/TaskSlot'
import { BeastCompanion, BEAST_DEFS, BEAST_IMAGES } from '../../components/BeastCompanion'
import { DarkColors } from '../../constants/colors'
import { TASK_SUGGESTIONS } from '../../constants/messages'
import { getToday } from '../../utils/date'

const CATEGORIES: { key: TaskCategory; label: string }[] = [
  { key: 'work', label: 'Work' },
  { key: 'sport', label: 'Sport' },
  { key: 'craft', label: 'Craft' },
  { key: 'study', label: 'Study' },
  { key: 'yoga', label: 'Yoga' },
]

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const totalPoints = useAppStore(s => s.totalPoints)
  const currentStreak = useAppStore(s => s.currentStreak)
  const beastMood = useAppStore(s => s.beastMood)
  const addTask = useAppStore(s => s.addTask)
  const completeTask = useAppStore(s => s.completeTask)
  const uncompleteTask = useAppStore(s => s.uncompleteTask)
  const updateTask = useAppStore(s => s.updateTask)
  const splitTask = useAppStore(s => s.splitTask)
  const deleteTask = useAppStore(s => s.deleteTask)
  const getBeastState = useAppStore(s => s.getBeastState)
  const tasks = useAppStore(s => s.tasks)
  const getGraceDaysLeft = useAppStore(s => s.getGraceDaysLeft)
  const activeBeast = useAppStore(s => s.activeBeast)
  const beastNames = useAppStore(s => s.beastNames)
  const newlyUnlockedBeast = useAppStore(s => s.newlyUnlockedBeast)
  const dismissUnlock = useAppStore(s => s.dismissUnlock)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('work')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [splittingTaskId, setSplittingTaskId] = useState<string | null>(null)
  const [sub1, setSub1] = useState('')
  const [sub2, setSub2] = useState('')
  const [sub3, setSub3] = useState('')

  const today = getToday()
  const todayTasks = tasks.filter(t => t.date === today)
  const beastState = getBeastState()
  const completedCount = todayTasks.filter(t => t.completed).length
  const graceDaysLeft = getGraceDaysLeft()

  const handleAddTask = () => {
    if (newTaskText.trim() && todayTasks.length < 3) {
      addTask(newTaskText, newTaskCategory)
      setNewTaskText('')
      setNewTaskCategory('work')
      setShowAddModal(false)
    }
  }

  const handleQuickAdd = (text: string) => {
    if (todayTasks.length < 3) {
      addTask(text, newTaskCategory)
      setNewTaskText('')
      setNewTaskCategory('work')
      setShowAddModal(false)
    }
  }

  const handleEdit = (id: string, text: string) => {
    setEditingTaskId(id)
    setEditText(text)
  }

  const handleSaveEdit = () => {
    if (editingTaskId && editText.trim()) {
      updateTask(editingTaskId, editText)
      setEditingTaskId(null)
      setEditText('')
    }
  }

  const handleSplit = (id: string) => {
    const task = todayTasks.find(t => t.id === id)
    setSplittingTaskId(id)
    if (task && task.subtasks.length > 0) {
      setSub1(task.subtasks[0]?.text || '')
      setSub2(task.subtasks[1]?.text || '')
      setSub3(task.subtasks[2]?.text || '')
    } else {
      setSub1('')
      setSub2('')
      setSub3('')
    }
  }

  const handleSaveSplit = () => {
    if (splittingTaskId) {
      const subs = sub3.trim() ? [sub1, sub2, sub3] : [sub1, sub2]
      splitTask(splittingTaskId, subs)
      setSplittingTaskId(null)
      setSub1('')
      setSub2('')
      setSub3('')
    }
  }

  const suggestions = useMemo(
    () => [...TASK_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 3),
    [today]
  )

  const allDone = completedCount === todayTasks.length && todayTasks.length > 0

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakCount}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>STREAK</Text>
          </View>
          {graceDaysLeft > 0 && currentStreak > 0 && (
            <Text style={styles.graceText}>{graceDaysLeft} grace</Text>
          )}
        </View>
        <Text style={styles.logo}>FOCUSBEAST</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsCount}>{totalPoints}</Text>
          <Text style={styles.pointsLabel}>PTS</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY</Text>
            <Text style={styles.sectionMeta}>{completedCount}/{todayTasks.length}</Text>
          </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: todayTasks.length > 0 ? `${(completedCount / todayTasks.length) * 100}%` : '0%' }]} />
            </View>

          {todayTasks.map(task => (
            <TaskSlot
              key={task.id}
              text={task.text}
              completed={task.completed}
              subtasks={task.subtasks}
              locked={task.locked}
              onComplete={() => completeTask(task.id)}
              onUncomplete={() => uncompleteTask(task.id)}
              onEdit={task.completed || task.locked ? undefined : () => handleEdit(task.id, task.text)}
              onSplit={task.completed || task.locked ? undefined : () => handleSplit(task.id)}
              onDelete={task.completed || task.locked ? undefined : () => deleteTask(task.id)}
            />
          ))}

          {todayTasks.length < 3 && !allDone && (
            <TouchableOpacity style={styles.addSlot} onPress={() => { setNewTaskText(''); setShowAddModal(true) }} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Add a new task" accessibilityHint="Opens a form to add a new task for today">
              <Text style={styles.addSlotText}>+ Add task ({3 - todayTasks.length} left)</Text>
            </TouchableOpacity>
          )}
        </View>

        {todayTasks.length > 0 && !allDone && (
          <TouchableOpacity style={styles.focusCtaBtn} onPress={() => router.push('/focus')} accessibilityRole="button" accessibilityLabel="Start focus session" accessibilityHint="Opens focus timer mode">
            <Text style={styles.focusCtaText}>START FOCUS SESSION</Text>
          </TouchableOpacity>
        )}

        {todayTasks.length === 0 && (
          <Text style={styles.hintText}>Add tasks to get started</Text>
        )}

        <View style={styles.beastSection}>
          <BeastCompanion
            mood={beastMood}
            message={allDone ? "Great work today." : todayTasks.length >= 3 ? "Ready to focus?" : "Add your tasks to begin."}
            level={beastState.level}
            evolution={beastState.evolution}
            xpPercentage={beastState.xp.percentage}
            completedCount={completedCount}
            beastType={activeBeast}
            beastName={beastNames[activeBeast]}
          />
        </View>
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New task</Text>
            <TextInput
              style={styles.input}
              placeholder="What will you focus on?"
              placeholderTextColor={DarkColors.textSecondary}
              value={newTaskText}
              onChangeText={setNewTaskText}
              maxLength={50}
              autoFocus
              onSubmitEditing={handleAddTask}
              returnKeyType="done"
              selectionColor={DarkColors.primary}
            />
            <Text style={styles.charCount}>{newTaskText.length}/50</Text>
            <Text style={styles.suggestionTitle}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.categoryChip, newTaskCategory === c.key && styles.categoryChipActive]}
                  onPress={() => setNewTaskCategory(c.key)}
                >
                  <Text style={[styles.categoryChipText, newTaskCategory === c.key && styles.categoryChipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.suggestionTitle}>Suggestions</Text>
            <View style={styles.suggestionRow}>
              {suggestions.map(s => (
                <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => handleQuickAdd(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, !newTaskText.trim() && styles.addButtonDisabled]}
                onPress={handleAddTask}
                disabled={!newTaskText.trim()}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!editingTaskId} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit task</Text>
            <TextInput
              style={styles.input}
              placeholder="Modify your task"
              placeholderTextColor={DarkColors.textSecondary}
              value={editText}
              onChangeText={setEditText}
              maxLength={50}
              autoFocus
              onSubmitEditing={handleSaveEdit}
              returnKeyType="done"
              selectionColor={DarkColors.primary}
            />
            <Text style={styles.charCount}>{editText.length}/50</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setEditingTaskId(null); setEditText('') }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, !editText.trim() && styles.addButtonDisabled]}
                onPress={handleSaveEdit}
                disabled={!editText.trim()}
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!splittingTaskId} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Split into steps</Text>
            <TextInput
              style={styles.input}
              placeholder="Step 1"
              placeholderTextColor={DarkColors.textSecondary}
              value={sub1}
              onChangeText={setSub1}
              maxLength={50}
              autoFocus
              selectionColor={DarkColors.primary}
            />
            <TextInput
              style={styles.input}
              placeholder="Step 2"
              placeholderTextColor={DarkColors.textSecondary}
              value={sub2}
              onChangeText={setSub2}
              maxLength={50}
              selectionColor={DarkColors.primary}
            />
            <TextInput
              style={styles.input}
              placeholder="Step 3 (optional)"
              placeholderTextColor={DarkColors.textSecondary}
              value={sub3}
              onChangeText={setSub3}
              maxLength={50}
              selectionColor={DarkColors.primary}
              onSubmitEditing={handleSaveSplit}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSplittingTaskId(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, !(sub1.trim() && sub2.trim()) && styles.addButtonDisabled]}
                onPress={handleSaveSplit}
                disabled={!(sub1.trim() && sub2.trim())}
              >
                <Text style={styles.addButtonText}>Split</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={!!newlyUnlockedBeast} animationType="fade" transparent>
        <View style={styles.unlockOverlay}>
          <View style={styles.unlockContent}>
            <Image
              source={newlyUnlockedBeast ? BEAST_IMAGES[newlyUnlockedBeast].celebrating : require('../../assets/beast/dog/celebrating.png')}
              style={styles.unlockImage}
              resizeMode="contain"
            />
            <Text style={styles.unlockTitle}>NEW BEAST UNLOCKED!</Text>
            <Text style={styles.unlockName}>{newlyUnlockedBeast ? BEAST_DEFS[newlyUnlockedBeast].label : ''}</Text>
            <Text style={styles.unlockSub}>You earned this through your dedication.</Text>
            <TouchableOpacity style={styles.unlockBtn} onPress={dismissUnlock}>
              <Text style={styles.unlockBtnText}>AWESOME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DarkColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 14,
    backgroundColor: DarkColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DarkColors.border,
  },
  headerRow: { flexDirection: 'column', alignItems: 'flex-start' },
  streakBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  streakCount: { fontSize: 20, fontWeight: '700', color: DarkColors.textPrimary },
  streakLabel: { fontSize: 9, fontWeight: '700', color: DarkColors.textSecondary, letterSpacing: 1.5 },
  graceText: { fontSize: 10, color: DarkColors.accent, fontWeight: '500', marginTop: 2, letterSpacing: 0.5 },
  logo: { fontSize: 13, fontWeight: '800', color: DarkColors.primary, letterSpacing: 3 },
  pointsBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  pointsCount: { fontSize: 20, fontWeight: '700', color: DarkColors.textPrimary },
  pointsLabel: { fontSize: 9, fontWeight: '700', color: DarkColors.textSecondary, letterSpacing: 1.5 },
  scrollContent: { flex: 1 },
  scrollInner: { paddingBottom: 40 },
  tasksSection: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: DarkColors.textSecondary, letterSpacing: 2 },
  sectionMeta: { fontSize: 12, fontWeight: '600', color: DarkColors.primary, letterSpacing: 1 },
  progressTrack: {
    height: 2,
    backgroundColor: DarkColors.border,
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: { height: '100%', backgroundColor: DarkColors.primary, borderRadius: 1 },
  addSlot: {
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkColors.border,
    borderStyle: 'dashed',
  },
  addSlotText: { fontSize: 13, color: DarkColors.textSecondary, fontWeight: '400', letterSpacing: 0.5 },
  focusCtaBtn: {
    backgroundColor: DarkColors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginTop: 20,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  focusCtaText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  hintText: {
    fontSize: 12,
    color: DarkColors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  beastSection: { alignItems: 'center', justifyContent: 'center', paddingBottom: 20, paddingTop: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: {
    backgroundColor: DarkColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderTopColor: DarkColors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: DarkColors.textPrimary, marginBottom: 16, letterSpacing: 0.5 },
  input: {
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: DarkColors.border,
    paddingVertical: 10,
    color: DarkColors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  charCount: { fontSize: 11, color: DarkColors.textSecondary, textAlign: 'right', marginBottom: 18, letterSpacing: 0.5 },
  suggestionTitle: { fontSize: 11, fontWeight: '600', color: DarkColors.textSecondary, marginBottom: 10, letterSpacing: 1 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryChip: {
    backgroundColor: DarkColors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  categoryChipActive: { borderColor: DarkColors.primary, backgroundColor: 'rgba(184, 170, 255, 0.12)' },
  categoryChipText: { fontSize: 12, color: DarkColors.textSecondary, letterSpacing: 0.3 },
  categoryChipTextActive: { color: DarkColors.primary, fontWeight: '600' },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  suggestionChip: {
    backgroundColor: DarkColors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  suggestionText: { fontSize: 12, color: DarkColors.textSecondary, letterSpacing: 0.3 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelText: { fontSize: 14, color: DarkColors.textSecondary, fontWeight: '500' },
  addButton: { backgroundColor: DarkColors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 28 },
  addButtonDisabled: { opacity: 0.3 },
  addButtonText: { fontSize: 14, color: '#fff', fontWeight: '600', letterSpacing: 0.5 },
  unlockOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  unlockContent: {
    backgroundColor: DarkColors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: DarkColors.primary,
  },
  unlockImage: { width: 120, height: 120, marginBottom: 20 },
  unlockTitle: { fontSize: 13, fontWeight: '700', color: DarkColors.primary, letterSpacing: 2, marginBottom: 8 },
  unlockName: { fontSize: 26, fontWeight: '700', color: DarkColors.textPrimary, letterSpacing: 1, marginBottom: 8 },
  unlockSub: { fontSize: 13, color: DarkColors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  unlockBtn: { backgroundColor: DarkColors.primary, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 40 },
  unlockBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },
})
