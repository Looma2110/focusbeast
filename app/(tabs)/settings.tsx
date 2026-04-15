import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, Platform, TextInput, Modal, KeyboardAvoidingView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppStore } from '../../store'
import { DarkColors } from '../../constants/colors'
import { BeastType, BEAST_DEFS } from '../../components/BeastCompanion'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
})

async function scheduleDailyReminder() {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please enable notifications in Settings.')
    return false
  }
  await Notifications.cancelAllScheduledNotificationsAsync()
  await Notifications.scheduleNotificationAsync({
    content: { title: 'FocusBeast', body: 'Time to plan your 3 tasks for today.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour: 9, minute: 0, repeats: true },
  })
  return true
}

async function cancelReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

const BEAST_ICONS: Record<BeastType, any> = {
  dog: require('../../assets/beast/dog/happy.png'),
  cat: require('../../assets/beast/cat/happy.png'),
  rabbit: require('../../assets/beast/dog/happy.png'),
  fox: require('../../assets/beast/dog/happy.png'),
  lion: require('../../assets/beast/dog/happy.png'),
  monkey: require('../../assets/beast/monkey/happy.png'),
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { settings, premium, updateSettings, unlockedBeasts, activeBeast, totalXP, setActiveBeast, beastNames, setBeastName } = useAppStore()

  const [renameBeast, setRenameBeast] = useState<BeastType | null>(null)
  const [renameText, setRenameText] = useState('')

  const handleRename = (beast: BeastType) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename',
        `Enter a name for your ${BEAST_DEFS[beast].label}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: (text: string | undefined) => { if (text?.trim()) setBeastName(beast, text) } },
        ],
        'plain-text',
        beastNames[beast] || BEAST_DEFS[beast].label
      )
    } else {
      setRenameText(beastNames[beast] || BEAST_DEFS[beast].label)
      setRenameBeast(beast)
    }
  }

  const handleSaveRename = () => {
    if (renameBeast && renameText.trim()) {
      setBeastName(renameBeast, renameText)
    }
    setRenameBeast(null)
    setRenameText('')
  }

  const allBeasts: BeastType[] = ['dog', 'cat', 'monkey', 'rabbit', 'fox', 'lion']

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionTitle}>MY BEAST</Text>
      <View style={styles.beastGrid}>
        {allBeasts.map(key => {
          const def = BEAST_DEFS[key]
          const isUnlocked = unlockedBeasts.includes(key)
          const isActive = activeBeast === key
          const isPremiumOnly = def.premiumOnly
          const canUnlock = !def.premiumOnly && totalXP >= def.unlockXP
          const needsPremium = isPremiumOnly && !premium

          return (
            <TouchableOpacity
              key={key}
              style={[styles.beastCard, isActive && styles.beastCardActive, !isUnlocked && styles.beastCardLocked]}
              onPress={() => {
                if (!isUnlocked) return
                if (isActive) {
                  handleRename(key)
                } else {
                  setActiveBeast(key)
                }
              }}
              activeOpacity={isUnlocked ? 0.7 : 1}
              accessibilityRole="button"
              accessibilityLabel={`${beastNames[key] || def.label} beast${isActive ? ', active' : ''}${!isUnlocked ? `, locked, ${needsPremium ? 'premium only' : canUnlock ? 'unlockable' : `${def.unlockXP} XP needed`}` : ''}`}
              accessibilityHint={isActive ? 'Tap to rename' : isUnlocked ? 'Tap to select' : undefined}
            >
              <Image
                source={BEAST_ICONS[key]}
                style={[styles.beastIcon, !isUnlocked && styles.beastIconLocked]}
                resizeMode="contain"
              />
              <Text style={[styles.beastLabel, isActive && styles.beastLabelActive]} numberOfLines={1}>{beastNames[key] || def.label}</Text>
              {!isUnlocked && (
                <Text style={styles.beastLockText}>
                  {needsPremium ? 'PREMIUM' : canUnlock ? 'UNLOCK' : `${def.unlockXP} XP`}
                </Text>
              )}
              {isActive && <Text style={styles.renameHint}>tap to rename</Text>}
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={styles.sectionTitle}>PREFERENCES</Text>
      <TouchableOpacity style={styles.row} onPress={() => {
        const newPremium = !premium
        const current = useAppStore.getState().unlockedBeasts
        const base: BeastType[] = ['dog']
        if (useAppStore.getState().totalXP >= 100) base.push('cat')
        useAppStore.setState({
          premium: newPremium,
          unlockedBeasts: newPremium ? ['dog', 'cat', 'monkey', 'rabbit', 'fox', 'lion'] : base,
        })
      }} accessibilityRole="switch" accessibilityState={{ checked: premium }} accessibilityLabel="Premium debug toggle">
        <Text style={styles.rowLabel}>Premium (debug)</Text>
        <View style={[styles.toggle, premium && styles.toggleOn]}>
          <View style={[styles.toggleDot, premium && styles.toggleDotOn]} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => updateSettings({ soundEnabled: !settings.soundEnabled })} accessibilityRole="switch" accessibilityState={{ checked: settings.soundEnabled }} accessibilityLabel="Sound effects">
        <Text style={styles.rowLabel}>Sound effects</Text>
        <View style={[styles.toggle, settings.soundEnabled && styles.toggleOn]}>
          <View style={[styles.toggleDot, settings.soundEnabled && styles.toggleDotOn]} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={async () => {
        if (!settings.notificationsEnabled) {
          if (Device.isDevice) {
            const ok = await scheduleDailyReminder()
            if (ok) updateSettings({ notificationsEnabled: true })
          } else {
            Alert.alert('Not available', 'Notifications require a physical device.')
          }
        } else {
          await cancelReminder()
          updateSettings({ notificationsEnabled: false })
        }
      }} accessibilityRole="switch" accessibilityState={{ checked: settings.notificationsEnabled }} accessibilityLabel="Reminders">
        <Text style={styles.rowLabel}>Reminders</Text>
        <View style={[styles.toggle, settings.notificationsEnabled && styles.toggleOn]}>
          <View style={[styles.toggleDot, settings.notificationsEnabled && styles.toggleDotOn]} />
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>PREMIUM</Text>
      <View style={styles.premiumCard}>
        <View style={styles.premiumHeader}>
          <View style={[styles.statusDot, { backgroundColor: premium ? DarkColors.secondary : DarkColors.textSecondary }]} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.premiumTitle}>{premium ? 'Premium active' : 'Free plan'}</Text>
            <Text style={styles.premiumSub}>
              {premium ? 'All features unlocked' : 'Upgrade for the full experience'}
            </Text>
          </View>
        </View>
        {!premium && (
          <TouchableOpacity style={styles.upgradeBtn} accessibilityRole="button" accessibilityLabel="Upgrade to premium">
            <Text style={styles.upgradeText}>UPGRADE  |  $39.99/YR</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.restoreBtn} accessibilityRole="button" accessibilityLabel="Restore purchases">
          <Text style={styles.restoreText}>Restore purchases</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>DATA</Text>
      <TouchableOpacity style={styles.dataBtn} onPress={() => Alert.alert('Export', 'Coming soon.')} accessibilityRole="button" accessibilityLabel="Export data">
        <Text style={styles.dataBtnText}>Export data</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dataBtnDanger}
        accessibilityRole="button"
        accessibilityLabel="Reset all data, this cannot be undone"
        onPress={() => {
          Alert.alert('Reset', 'Delete all data? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: () => {
              useAppStore.persist.clearStorage()
              useAppStore.setState({
                tasks: [],
                dayLogs: [],
                totalPoints: 0,
                totalXP: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: null,
                graceDaysUsed: 0,
                beastMood: 'happy',
                premium: false,
                freeFocusUsed: false,
                onboardingCompleted: false,
                confettiVisible: false,
                lastLevelUp: 1,
                unlockedBeasts: ['dog'],
                activeBeast: 'dog',
                newlyUnlockedBeast: null,
                beastNames: { dog: 'Dog', cat: 'Cat', monkey: 'Monkey', rabbit: 'Rabbit', fox: 'Fox', lion: 'Lion' },
                settings: { soundEnabled: true, notificationsEnabled: false, theme: 'auto' },
              })
            }},
          ])
        }}
      >
        <Text style={styles.dataBtnDangerText}>Reset all data</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>ABOUT</Text>
      <View style={styles.aboutCard}>
        <Text style={styles.version}>FocusBeast v1.0.0</Text>
      </View>

      <Modal visible={!!renameBeast} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`Enter a name for your ${renameBeast ? BEAST_DEFS[renameBeast].label : ''}`}
              placeholderTextColor={DarkColors.textSecondary}
              value={renameText}
              onChangeText={setRenameText}
              maxLength={20}
              autoFocus
              onSubmitEditing={handleSaveRename}
              returnKeyType="done"
              selectionColor={DarkColors.primary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setRenameBeast(null); setRenameText('') }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !renameText.trim() && styles.modalSaveBtnDisabled]}
                onPress={handleSaveRename}
                disabled={!renameText.trim()}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DarkColors.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: DarkColors.textPrimary, marginBottom: 24, letterSpacing: 1 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: DarkColors.textSecondary, marginBottom: 10, marginTop: 24, letterSpacing: 2 },
  beastGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  beastCard: {
    width: '31%',
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkColors.border,
    position: 'relative',
  },
  beastCardActive: { borderColor: DarkColors.primary, backgroundColor: 'rgba(184, 170, 255, 0.08)' },
  beastCardLocked: { opacity: 0.45 },
  beastIcon: { width: 50, height: 50, marginBottom: 6 },
  beastIconLocked: { opacity: 0.3 },
  beastLabel: { fontSize: 12, fontWeight: '600', color: DarkColors.textSecondary, letterSpacing: 0.5 },
  beastLabelActive: { color: DarkColors.primary },
  beastLockText: { fontSize: 9, fontWeight: '700', color: DarkColors.accent, letterSpacing: 1, marginTop: 2 },
  renameHint: { fontSize: 9, color: DarkColors.primary, letterSpacing: 0.5, marginTop: 2, fontWeight: '500' },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DarkColors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  rowLabel: { fontSize: 14, color: DarkColors.textPrimary, fontWeight: '400', letterSpacing: 0.3 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: DarkColors.surfaceElevated,
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  toggleOn: { backgroundColor: DarkColors.primary, borderColor: DarkColors.primary },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: DarkColors.textSecondary,
  },
  toggleDotOn: { backgroundColor: '#fff' },
  premiumCard: {
    backgroundColor: DarkColors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  premiumHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  premiumTitle: { fontSize: 15, fontWeight: '600', color: DarkColors.textPrimary, letterSpacing: 0.3 },
  premiumSub: { fontSize: 12, color: DarkColors.textSecondary, marginTop: 2 },
  upgradeBtn: {
    backgroundColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  upgradeText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  restoreBtn: { paddingVertical: 10, alignItems: 'center' },
  restoreText: { color: DarkColors.textSecondary, fontSize: 12, letterSpacing: 0.5 },
  dataBtn: {
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  dataBtnText: { fontSize: 14, color: DarkColors.textPrimary, letterSpacing: 0.3 },
  dataBtnDanger: {
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DarkColors.danger,
  },
  dataBtnDangerText: { fontSize: 14, color: DarkColors.danger, letterSpacing: 0.3 },
  aboutCard: {
    backgroundColor: DarkColors.surface,
    borderRadius: 12,
    padding: 18,
    marginBottom: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  version: { fontSize: 13, fontWeight: '500', color: DarkColors.textSecondary, letterSpacing: 0.5 },
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
  modalInput: {
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: DarkColors.border,
    paddingVertical: 10,
    color: DarkColors.textPrimary,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  modalCancelText: { fontSize: 14, color: DarkColors.textSecondary, fontWeight: '500' },
  modalSaveBtn: { backgroundColor: DarkColors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 28 },
  modalSaveBtnDisabled: { opacity: 0.3 },
  modalSaveText: { fontSize: 14, color: '#fff', fontWeight: '600', letterSpacing: 0.5 },
})
