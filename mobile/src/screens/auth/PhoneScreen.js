import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../utils/constants';
import { authService } from '../../services/auth.service';

export default function PhoneScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 10) { shake(); return; }

    setLoading(true);
    try {
      await authService.sendOTP(cleaned);
      navigation.navigate('OTP', { phone: cleaned });
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send OTP. Try again.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const isValid = phone.replace(/\s/g, '').length >= 10;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📱</Text>
          </View>
          <Text style={styles.title}>Enter your{'\n'}phone number</Text>
          <Text style={styles.subtitle}>
            We'll send you a one-time password to verify your identity
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <Animated.View
            style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}
          >
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.code}>+91</Text>
            </View>
            <View style={styles.dividerV} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="98765 43210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              maxLength={12}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
            />
          </Animated.View>
          <Text style={styles.hint}>
            💬 OTP will be sent via SMS & WhatsApp
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.btn, !isValid && styles.btnDisabled]}
          onPress={handleSendOTP}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>Send OTP →</Text>
          )}
        </TouchableOpacity>

        {/* Footer note */}
        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'space-between', paddingBottom: SPACING.xl },

  backBtn: { paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  backText: { fontFamily: FONTS.bodyMedium, color: COLORS.primary, fontSize: 15 },

  header: { alignItems: 'center', paddingTop: SPACING.lg },
  iconCircle: {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryGhost,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  iconText: { fontSize: 36 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 30, color: COLORS.text,
    textAlign: 'center', lineHeight: 40,
  },
  subtitle: {
    fontFamily: FONTS.body, fontSize: 14,
    color: COLORS.textSecondary, textAlign: 'center',
    marginTop: SPACING.sm, lineHeight: 22,
  },

  inputSection: { marginTop: SPACING.xl },
  inputLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: 13,
    color: COLORS.textSecondary, marginBottom: SPACING.sm,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, overflow: 'hidden',
    ...SHADOW.sm,
  },
  countryCode: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, gap: SPACING.xs,
  },
  flag: { fontSize: 20 },
  code: { fontFamily: FONTS.bodySemiBold, color: COLORS.text, fontSize: 16 },
  dividerV: { width: 1, height: 28, backgroundColor: COLORS.border },
  input: {
    flex: 1, paddingHorizontal: SPACING.md,
    paddingVertical: 18, fontSize: 18,
    fontFamily: FONTS.bodyMedium, color: COLORS.text,
    letterSpacing: 1,
  },
  hint: {
    fontFamily: FONTS.body, fontSize: 12,
    color: COLORS.textMuted, marginTop: SPACING.sm,
    textAlign: 'center',
  },

  btn: {
    backgroundColor: COLORS.primary, paddingVertical: 18,
    borderRadius: RADIUS.full, alignItems: 'center',
    ...SHADOW.md,
  },
  btnDisabled: { backgroundColor: COLORS.border },
  btnText: { fontFamily: FONTS.bodySemiBold, fontSize: 17, color: '#FFF', letterSpacing: 0.3 },

  terms: {
    fontFamily: FONTS.body, fontSize: 11,
    color: COLORS.textMuted, textAlign: 'center', lineHeight: 18,
  },
});
