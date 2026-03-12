import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';

const { width, height } = Dimensions.get('window');

// Sacred geometry decorative element
const MandalaDecor = () => (
  <View style={styles.mandalaWrap}>
    {[80, 100, 120, 140].map((size, i) => (
      <View
        key={i}
        style={[
          styles.mandalaRing,
          {
            width: size, height: size,
            borderRadius: size / 2,
            opacity: 0.15 - i * 0.02,
            borderWidth: 1.5,
          },
        ]}
      />
    ))}
    <View style={styles.mandalaCenter} />
  </View>
);

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#C04E00', '#E8620A', '#FF8C38']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Decorative top pattern */}
        <View style={styles.topDecor}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={[styles.decoDot, { opacity: 0.2 + (i % 3) * 0.1 }]} />
          ))}
        </View>

        {/* Logo & mandala */}
        <Animated.View
          style={[styles.heroSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <MandalaDecor />
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>🛕</Text>
          </View>
        </Animated.View>

        {/* Text */}
        <Animated.View
          style={[styles.textSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.appName}>QueuePass</Text>
          <Text style={styles.tagline}>Skip the line.{'\n'}Preserve the divine.</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            Digital queue management for temples,{'\n'}shrines & sacred spaces
          </Text>
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Phone')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Phone')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom wave */}
        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>🙏 Darshan made simple</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg },

  topDecor: {
    flexDirection: 'row', gap: 12, marginTop: SPACING.md, opacity: 0.6,
  },
  decoDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF',
  },

  heroSection: {
    alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.xl, position: 'relative',
  },
  mandalaWrap: {
    alignItems: 'center', justifyContent: 'center',
    width: 160, height: 160, position: 'absolute',
  },
  mandalaRing: {
    position: 'absolute', borderColor: '#FFF',
  },
  mandalaCenter: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  iconWrap: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  iconEmoji: { fontSize: 52 },

  textSection: { alignItems: 'center', paddingHorizontal: SPACING.md },
  appName: {
    fontSize: 42, color: '#FFF',
    fontFamily: FONTS.display,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 22, color: 'rgba(255,255,255,0.92)',
    fontFamily: FONTS.displayMedium,
    textAlign: 'center', lineHeight: 32, marginTop: SPACING.xs,
  },
  divider: {
    width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1, marginVertical: SPACING.md,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)',
    fontFamily: FONTS.body,
    textAlign: 'center', lineHeight: 22,
  },

  actions: { width: '100%', gap: SPACING.sm, paddingBottom: SPACING.lg },
  btnPrimary: {
    backgroundColor: '#FFF',
    paddingVertical: 18, borderRadius: RADIUS.full,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  btnPrimaryText: {
    color: COLORS.primaryDark, fontSize: 17,
    fontFamily: FONTS.bodySemiBold, letterSpacing: 0.3,
  },
  btnSecondary: {
    paddingVertical: 16, borderRadius: RADIUS.full,
    alignItems: 'center', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  btnSecondaryText: {
    color: 'rgba(255,255,255,0.9)', fontSize: 15,
    fontFamily: FONTS.bodyMedium,
  },

  bottomNote: { paddingBottom: SPACING.sm },
  bottomNoteText: {
    color: 'rgba(255,255,255,0.55)', fontSize: 12,
    fontFamily: FONTS.body, letterSpacing: 0.5,
  },
});
