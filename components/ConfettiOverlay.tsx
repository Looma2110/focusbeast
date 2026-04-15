import React, { useEffect, useRef, useMemo } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { DarkColors } from '../constants/colors'

const CONFETTI_COLORS = ['#8B7CF6', '#3ECFA0', '#F0C56D', '#EF6B6B', '#6C5CE7', '#A29BFE']

interface ParticleProps {
  delay: number
  color: string
  startX: number
  active: boolean
}

function Particle({ delay, color, startX, active }: ParticleProps) {
  const translateY = useRef(new Animated.Value(-20)).current
  const translateX = useRef(new Animated.Value(startX)).current
  const rotate = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0)).current
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animsRef = useRef<Animated.CompositeAnimation[]>([])

  useEffect(() => {
    if (!active) return
    timerRef.current = setTimeout(() => {
      const a1 = Animated.timing(translateY, { toValue: 400, duration: 2000, easing: Easing.linear, useNativeDriver: true })
      const a2 = Animated.sequence([
        Animated.timing(translateX, { toValue: startX + 30, duration: 1000, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: startX - 20, duration: 1000, useNativeDriver: true }),
      ])
      const a3 = Animated.timing(rotate, { toValue: 1, duration: 2000, useNativeDriver: true })
      const a4 = Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
      const a5 = Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
      ])
      animsRef.current = [a1, a2, a3, a4, a5]
      a1.start(); a2.start(); a3.start(); a4.start(); a5.start()
    }, delay)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      animsRef.current.forEach(a => a.stop())
    }
  }, [active])

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] })

  return (
    <Animated.View style={[styles.particle, { backgroundColor: color, transform: [{ translateY }, { translateX }, { rotate: spin }, { scale }], opacity }]} />
  )
}

interface ConfettiOverlayProps {
  visible: boolean
  message?: string
}

export function ConfettiOverlay({ visible, message }: ConfettiOverlayProps) {
  const particles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      delay: i * 60,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      startX: (i % 6) * 60 - 150,
    })), []
  )

  if (!visible) return null

  return (
  <View style={styles.container} pointerEvents="none">
    <View style={styles.particleContainer} pointerEvents="none">
        {particles.map(p => (
          <Particle key={p.id} delay={p.delay} color={p.color} startX={p.startX} active={visible} />
        ))}
      </View>
      {message ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  particleContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  particle: {
    position: 'absolute',
    top: -10,
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  messageContainer: {
    position: 'absolute',
    top: '40%',
    backgroundColor: DarkColors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
  },
})
