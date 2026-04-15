import React, { useEffect, useRef } from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native'
import { DarkColors } from '../constants/colors'

export type BeastType = 'dog' | 'cat' | 'rabbit' | 'fox' | 'lion' | 'monkey'

export const BEAST_DEFS: Record<BeastType, { label: string; unlockXP: number; premiumOnly: boolean }> = {
  dog: { label: 'Dog', unlockXP: 0, premiumOnly: false },
  cat: { label: 'Cat', unlockXP: 100, premiumOnly: false },
  monkey: { label: 'Monkey', unlockXP: 300, premiumOnly: true },
  rabbit: { label: 'Rabbit', unlockXP: 600, premiumOnly: true },
  fox: { label: 'Fox', unlockXP: 1200, premiumOnly: true },
  lion: { label: 'Lion', unlockXP: 2400, premiumOnly: true },
}

export type MoodKey = 'sad' | 'happy' | 'very-happy' | 'celebrating' | 'work' | 'sport' | 'craft' | 'study' | 'yoga'

export const BEAST_IMAGES: Record<BeastType, Record<MoodKey, any>> = {
  dog: {
    sad: require('../assets/beast/dog/sad.png'),
    happy: require('../assets/beast/dog/happy.png'),
    'very-happy': require('../assets/beast/dog/very-happy.png'),
    celebrating: require('../assets/beast/dog/celebrating.png'),
    work: require('../assets/beast/dog/work.png'),
    sport: require('../assets/beast/dog/sport.png'),
    craft: require('../assets/beast/dog/craft.png'),
    study: require('../assets/beast/dog/study.png'),
    yoga: require('../assets/beast/dog/yoga.png'),
  },
  cat: {
    sad: require('../assets/beast/cat/sad.png'),
    happy: require('../assets/beast/cat/happy.png'),
    'very-happy': require('../assets/beast/cat/very-happy.png'),
    celebrating: require('../assets/beast/cat/celebrating.png'),
    work: require('../assets/beast/cat/work.png'),
    sport: require('../assets/beast/cat/sport.png'),
    craft: require('../assets/beast/cat/craft.png'),
    study: require('../assets/beast/cat/study.png'),
    yoga: require('../assets/beast/cat/yoga.png'),
  },
  rabbit: {
    sad: require('../assets/beast/rabbit/sad.png'),
    happy: require('../assets/beast/rabbit/happy.png'),
    'very-happy': require('../assets/beast/rabbit/very-happy.png'),
    celebrating: require('../assets/beast/rabbit/celebrating.png'),
    work: require('../assets/beast/rabbit/work.png'),
    sport: require('../assets/beast/rabbit/sport.png'),
    craft: require('../assets/beast/rabbit/craft.png'),
    study: require('../assets/beast/rabbit/study.png'),
    yoga: require('../assets/beast/rabbit/yoga.png'),
  },
  fox: {
    sad: require('../assets/beast/dog/sad.png'),
    happy: require('../assets/beast/dog/happy.png'),
    'very-happy': require('../assets/beast/dog/very-happy.png'),
    celebrating: require('../assets/beast/dog/celebrating.png'),
    work: require('../assets/beast/dog/work.png'),
    sport: require('../assets/beast/dog/sport.png'),
    craft: require('../assets/beast/dog/craft.png'),
    study: require('../assets/beast/dog/study.png'),
    yoga: require('../assets/beast/dog/yoga.png'),
  },
  lion: {
    sad: require('../assets/beast/dog/sad.png'),
    happy: require('../assets/beast/dog/happy.png'),
    'very-happy': require('../assets/beast/dog/very-happy.png'),
    celebrating: require('../assets/beast/dog/celebrating.png'),
    work: require('../assets/beast/dog/work.png'),
    sport: require('../assets/beast/dog/sport.png'),
    craft: require('../assets/beast/dog/craft.png'),
    study: require('../assets/beast/dog/study.png'),
    yoga: require('../assets/beast/dog/yoga.png'),
  },
  monkey: {
    sad: require('../assets/beast/monkey/sad.png'),
    happy: require('../assets/beast/monkey/happy.png'),
    'very-happy': require('../assets/beast/monkey/very-happy.png'),
    celebrating: require('../assets/beast/monkey/celebrating.png'),
    work: require('../assets/beast/monkey/work.png'),
    sport: require('../assets/beast/monkey/sport.png'),
    craft: require('../assets/beast/monkey/craft.png'),
    study: require('../assets/beast/monkey/study.png'),
    yoga: require('../assets/beast/monkey/yoga.png'),
  },
}

function getBeastMood(completedCount: number, category?: string): MoodKey {
  if (completedCount >= 3) return 'celebrating'
  if (category && ['work', 'sport', 'craft', 'study', 'yoga'].includes(category)) return category as MoodKey
  if (completedCount === 0) return 'sad'
  if (completedCount === 1) return 'happy'
  return 'very-happy'
}

interface BeastCompanionProps {
  mood: string
  message: string
  level: number
  evolution: string
  xpPercentage: number
  completedCount?: number
  category?: string
  beastType?: BeastType
  beastName?: string
  onFocusPress?: () => void
}

const STAGE_CONFIG: Record<string, { name: string; size: number }> = {
  baby: { name: 'Seedling', size: 140 },
  teen: { name: 'Spark', size: 160 },
  adult: { name: 'Flux', size: 180 },
  mega: { name: 'Apex', size: 200 },
}

export function BeastCompanion({ mood, message, level, evolution, xpPercentage, completedCount = 0, category, beastType = 'dog', beastName, onFocusPress }: BeastCompanionProps) {
  const stage = STAGE_CONFIG[evolution] || STAGE_CONFIG.baby
  const floatY = useRef(new Animated.Value(0)).current
  const breathe = useRef(new Animated.Value(1)).current
  const moodBounce = useRef(new Animated.Value(0)).current
  const moodKey = (['sad', 'happy', 'very-happy', 'celebrating', 'work', 'sport', 'craft', 'study', 'yoga', 'anxious'].includes(mood)
    ? mood === 'anxious' ? 'sad' : mood
    : getBeastMood(completedCount, category)) as MoodKey
  const imageSource = BEAST_IMAGES[beastType][moodKey]

  useEffect(() => {
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    floatAnim.start()
    return () => { floatAnim.stop(); floatY.setValue(0) }
  }, [])

  useEffect(() => {
    const breatheAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.04, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    breatheAnim.start()
    return () => { breatheAnim.stop(); breathe.setValue(1) }
  }, [])

  useEffect(() => {
    moodBounce.setValue(0)
    if (mood === 'celebrating') {
      Animated.sequence([
        Animated.spring(moodBounce, { toValue: 1, speed: 20, bounciness: 16, useNativeDriver: true }),
        Animated.timing(moodBounce, { toValue: 0, duration: 800, delay: 400, useNativeDriver: true }),
      ]).start()
    }
  }, [mood])

  const bounceScale = moodBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  })

  return (
    <View style={styles.wrapper}>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {onFocusPress ? (
        <TouchableOpacity onPress={onFocusPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`${beastName || BEAST_DEFS[beastType].label} companion. Tap to start focus.`}>
          <Animated.View style={[styles.beastContainer, {
            transform: [
              { translateY: floatY },
              { scale: bounceScale },
            ],
          }]}>
            <Animated.View style={{ transform: [{ scale: breathe }] }}>
              <Image
                source={imageSource}
                style={[styles.beastImage, { width: stage.size, height: stage.size }]}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <Animated.View style={[styles.beastContainer, {
          transform: [
            { translateY: floatY },
            { scale: bounceScale },
          ],
        }]}>
          <Animated.View style={{ transform: [{ scale: breathe }] }}>
            <Image
              source={imageSource}
              style={[styles.beastImage, { width: stage.size, height: stage.size }]}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      )}

      <Text style={styles.beastName}>{beastName || BEAST_DEFS[beastType].label}</Text>
      <Text style={styles.beastLevel}>LVL {level}</Text>

      <View style={styles.xpTrack}>
        <View style={[styles.xpFill, { width: `${xpPercentage}%` }]} />
      </View>
      <Text style={styles.xpLabel}>{Math.round(xpPercentage)}%</Text>

      {onFocusPress && (
        <TouchableOpacity style={styles.focusBtn} onPress={onFocusPress} accessibilityRole="button" accessibilityLabel="Start focus session">
          <Text style={styles.focusBtnText}>START FOCUS</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  messageContainer: {
    backgroundColor: DarkColors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DarkColors.border,
    maxWidth: '85%',
  },
  messageText: {
    fontSize: 13,
    color: DarkColors.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  beastContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  beastImage: {
    alignSelf: 'center',
  },
  beastName: {
    fontSize: 15,
    fontWeight: '700',
    color: DarkColors.textPrimary,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  beastLevel: {
    fontSize: 11,
    fontWeight: '600',
    color: DarkColors.textSecondary,
    letterSpacing: 2,
    marginTop: 2,
    marginBottom: 8,
  },
  xpTrack: {
    width: 120,
    height: 3,
    backgroundColor: DarkColors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: DarkColors.primary,
  },
  xpLabel: {
    fontSize: 10,
    color: DarkColors.textSecondary,
    letterSpacing: 1,
  },
  focusBtn: {
    marginTop: 10,
    backgroundColor: DarkColors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  focusBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
})
