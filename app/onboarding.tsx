import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Image } from 'react-native'
import { useAppStore } from '../store'
import { DarkColors } from '../constants/colors'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    title: 'Three tasks a day.',
    body: 'No overwhelm. Just pick up to 3 things that matter and commit. That is enough.',
    image: require('../assets/beast/dog/sad.png'),
  },
  {
    title: 'Your Beast grows\nwith you.',
    body: 'Complete tasks, build streaks, earn XP. Your companion evolves as you build consistency.',
    image: require('../assets/beast/dog/very-happy.png'),
  },
  {
    title: 'Focus together.',
    body: 'Use Focus Mode to do deep work alongside your Beast. Body doubling, reimagined for your pocket.',
    image: require('../assets/beast/dog/work.png'),
  },
]

export default function OnboardingScreen() {
  const [slide, setSlide] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const completeOnboarding = useAppStore(s => s.completeOnboarding)

  const goTo = (i: number) => {
    setSlide(i)
    scrollRef.current?.scrollTo({ x: i * width, animated: true })
  }

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      goTo(slide + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleSkip = () => completeOnboarding()

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        {slide < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={true}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x
          const i = Math.round(x / width)
          if (i !== slide) setSlide(i)
        }}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.slider}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={styles.slide}>
            <Image source={s.image} style={styles.slideImage} resizeMode="contain" />
            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, slide === i && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: slide === SLIDES.length - 1 ? DarkColors.primary : DarkColors.surfaceElevated }]}
          onPress={handleNext}
        >
          <Text style={[styles.nextBtnText, { color: slide === SLIDES.length - 1 ? '#fff' : DarkColors.textPrimary }]}>
            {slide === SLIDES.length - 1 ? 'GET STARTED' : 'NEXT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DarkColors.background },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 60 },
  skipText: { fontSize: 14, color: DarkColors.textSecondary, fontWeight: '500', letterSpacing: 0.5 },
  slider: { flex: 1 },
  slide: {
    width,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideImage: {
    width: 160,
    height: 160,
    marginBottom: 36,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkColors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    lineHeight: 32,
  },
  slideBody: {
    fontSize: 15,
    color: DarkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '85%',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DarkColors.border,
  },
  dotActive: {
    backgroundColor: DarkColors.primary,
    width: 20,
  },
  nextBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkColors.border,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
})
