import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { DarkColors } from '../constants/colors'
import { SubTask } from '../store'

interface TaskSlotProps {
  text?: string
  completed: boolean
  subtasks?: SubTask[]
  onAdd?: () => void
  onComplete?: () => void
  onUncomplete?: () => void
  onEdit?: () => void
  onSplit?: () => void
  onDelete?: () => void
  onSubtaskComplete?: (subtaskId: string) => void
  selectedSubtaskId?: string | null
  noMargin?: boolean
  isSubtaskView?: boolean
  locked?: boolean
}

export function TaskSlot({ text, completed, subtasks, onAdd, onComplete, onUncomplete, onEdit, onSplit, onDelete, onSubtaskComplete, selectedSubtaskId, noMargin, isSubtaskView, locked }: TaskSlotProps) {
  if (!text) {
    return (
      <TouchableOpacity style={styles.slotEmpty} onPress={onAdd} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Add a task">
        <View style={styles.plusCircle}>
          <Text style={styles.plusIcon}>+</Text>
        </View>
        <Text style={styles.placeholder}>Add a task</Text>
      </TouchableOpacity>
    )
  }

  const hasSubtasks = subtasks && subtasks.length > 0
  const completedSubs = subtasks?.filter(s => s.completed).length || 0

  return (
    <View style={[styles.slot, completed && styles.slotCompleted, noMargin ? null : styles.slotMargin]}>
      <TouchableOpacity
        style={styles.mainRow}
        onPress={completed && onUncomplete ? onUncomplete : !completed && onComplete ? onComplete : undefined}
        activeOpacity={0.7}
        onLongPress={onDelete}
        delayLongPress={500}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={`${completed ? 'Completed' : 'Incomplete'} task: ${text}${hasSubtasks ? `, ${completedSubs} of ${subtasks!.length} steps done` : ''}`}
        accessibilityHint={completed && onUncomplete ? 'Double tap to mark as incomplete' : !completed && onComplete ? 'Double tap to complete' : undefined}
      >
        <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
          {completed && <Text style={styles.checkmark}>&#10003;</Text>}
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.taskText, completed && styles.taskTextCompleted]} numberOfLines={1}>
            {text}
          </Text>
          {hasSubtasks && (
            <Text style={styles.subCount}>{completedSubs}/{subtasks!.length} done</Text>
          )}
        </View>
        {!completed && !locked && (
          <View style={styles.actions}>
            {!hasSubtasks && onSplit && (
              <TouchableOpacity onPress={onSplit} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={`Split ${text} into steps`}>
                <Text style={styles.splitIcon}>Split</Text>
              </TouchableOpacity>
            )}
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={`Edit task: ${text}`}>
                <Text style={styles.editIcon}>Edit</Text>
              </TouchableOpacity>
            )}
            <View style={styles.taskPoints}><Text style={styles.taskPointsText}>+{isSubtaskView ? 5 : 10}</Text></View>
          </View>
        )}
      </TouchableOpacity>

      {hasSubtasks && !completed && (
        <View style={styles.subtasksList}>
          {subtasks!.map(sub => {
            const isSubSelected = selectedSubtaskId === sub.id
            return (
              <TouchableOpacity
                key={sub.id}
                style={[styles.subtaskRow, isSubSelected && styles.subtaskRowSelected]}
                onPress={() => onSubtaskComplete?.(sub.id)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sub.completed }}
                accessibilityLabel={`${sub.completed ? 'Completed' : 'Incomplete'} step: ${sub.text}`}
                accessibilityHint={sub.completed ? 'Step completed' : 'Double tap to complete this step'}
              >
                <View style={[styles.subCheckbox, sub.completed && styles.subCheckboxDone, isSubSelected && !sub.completed && styles.subCheckboxSelected]}>
                  {sub.completed && <Text style={styles.subCheck}>&#10003;</Text>}
                </View>
                <Text style={[styles.subtaskText, sub.completed && styles.subtaskTextDone, isSubSelected && !sub.completed && styles.subtaskTextSelected]} numberOfLines={1}>
                  {sub.text}
                </Text>
              </TouchableOpacity>
            )
          })}
          {onSplit && (
            <TouchableOpacity style={styles.editStepsBtn} onPress={onSplit} accessibilityRole="button" accessibilityLabel="Edit steps">
              <Text style={styles.editStepsText}>Edit steps</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  slotEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DarkColors.border,
    borderStyle: 'dashed',
  },
  plusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DarkColors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  plusIcon: { fontSize: 16, color: DarkColors.textSecondary, fontWeight: '300', marginTop: -2 },
  placeholder: { fontSize: 14, color: DarkColors.textSecondary, fontWeight: '400', letterSpacing: 0.3 },
  slot: {
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  slotMargin: {
    marginBottom: 8,
  },
  slotCompleted: { opacity: 0.6, borderColor: DarkColors.secondary },
  mainRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: DarkColors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: { backgroundColor: DarkColors.secondary, borderColor: DarkColors.secondary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '600' },
  textCol: { flex: 1 },
  taskText: { fontSize: 14, color: DarkColors.textPrimary, fontWeight: '400', letterSpacing: 0.2 },
  taskTextCompleted: { textDecorationLine: 'line-through', color: DarkColors.textSecondary },
  subCount: { fontSize: 10, color: DarkColors.textSecondary, marginTop: 2, letterSpacing: 0.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  splitIcon: { fontSize: 11, fontWeight: '600', color: DarkColors.accent, letterSpacing: 0.5 },
  editIcon: { fontSize: 11, fontWeight: '600', color: DarkColors.textSecondary, letterSpacing: 0.5 },
  taskPoints: {
    backgroundColor: DarkColors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  taskPointsText: { fontSize: 10, fontWeight: '600', color: DarkColors.primary, letterSpacing: 0.5 },
  subtasksList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DarkColors.border,
    marginLeft: 34,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  subtaskRowSelected: {
    backgroundColor: DarkColors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  subCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: DarkColors.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCheckboxDone: { backgroundColor: DarkColors.primary, borderColor: DarkColors.primary },
  subCheckboxSelected: { borderColor: DarkColors.primary, borderWidth: 2 },
  subCheck: { color: '#fff', fontSize: 9, fontWeight: '600' },
  subtaskText: { fontSize: 13, color: DarkColors.textPrimary, flex: 1, letterSpacing: 0.2 },
  subtaskTextDone: { textDecorationLine: 'line-through', color: DarkColors.textSecondary },
  subtaskTextSelected: { color: DarkColors.primary, fontWeight: '600' },
  editStepsBtn: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  editStepsText: {
    fontSize: 11,
    fontWeight: '600',
    color: DarkColors.textSecondary,
    letterSpacing: 0.5,
  },
})
