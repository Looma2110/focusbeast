import React from 'react'
import { Stack } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useAppStore } from '../store'
import { DarkColors } from '../constants/colors'

export default function RootLayout() {
  const onboardingCompleted = useAppStore(s => s.onboardingCompleted)
  const checkStreak = useAppStore(s => s.checkStreak)
  const refreshWeek = useAppStore(s => s.refreshWeek)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true))
    if (useAppStore.persist.hasHydrated()) setHydrated(true)
    const timeout = setTimeout(() => setHydrated(true), 5000)
    return () => { unsub(); clearTimeout(timeout) }
  }, [])

  React.useEffect(() => {
    if (hydrated && onboardingCompleted) {
      checkStreak()
      refreshWeek()
    }
  }, [hydrated, onboardingCompleted])

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={DarkColors.primary} size="large" />
        <StatusBar style="light" />
      </View>
    )
  }

  if (!onboardingCompleted) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </>
    )
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: DarkColors.background, alignItems: 'center', justifyContent: 'center' },
})
