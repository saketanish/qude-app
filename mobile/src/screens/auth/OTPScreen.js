import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../utils/constants';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }) {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRef = useRef(null);
  const successAnim = useRef(new Animated.Value(0)).current;
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    inputRef.current?.focus();
    const interval = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) return;
    setLoading(true);
    try {
      const { token, user } = await authService.verifyOTP(phone, otp);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate success
      Animated.spring(successAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start();

      await login(token, user);
      // Navigation handled by auth state change
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid OTP', err?.response?.data?.message || 'Incorrect code. Try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await authService.sendOTP(phone);
      setResendTimer(30);
      setOtp('');
      Alert.alert('Sent!', 'A new OTP has been sent to your phone.');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  // Visual OTP digit boxes
  const digits = Array(OTP_LENGTH).fill('').map((_, i) => otp[i] || '');

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🔐</Text>
        </View>
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phone}>+91 {phone}</Text>
        </Text>
      </View>

      {/* OTP Boxes */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={styles.otpContainer}
      >
        {digits.map((digit, i) => (
          <View
            key={i}
            style={[
              styles.digitBox,
              digit && styles.digitBoxFilled,
              i === otp.length && styles.digitBoxActive,
            ]}
          >
            <Text style={styles.digitText}>{digit || ''}</Text>
            {i === otp.length && !digit && <View style={styles.cursor} />}
          </View>
        ))}
        {/* Hidden real input */}
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={(val) => {
            const nums = val.replace(/[^0-9]/g, '').substring(0, OTP_LENGTH);
            setOtp(nums);
            if (nums.length === OTP_LENGTH) {
              setTimeout(() => handleVerify(), 200);
            }
          }}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          style={styles.hiddenInput}
          caretHidden
        />
      </TouchableOpacity>

      {/* Verify button */}
      <TouchableOpacity
        style={[styles.btn, otp.length !== OTP_LENGTH && styles.btnDisabled]}
        onPress={handleVerify}
        disabled={otp.length !== OTP_LENGTH || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnText}>Verify & Continue →</Text>
        )}
      </TouchableOpacity>

      {/* Resend */}
      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>Didn't receive the code? </Text>
        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
          <Text style={[styles.resendLink, resendTimer > 0 && styles.resendDisabled]}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: SPACING.lg },
  backBtn: { paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  backText: { fontFamily: FONTS.bodyMedium, color: COLORS.primary, fontSize: 15 },

  header: { alignItems: 'center', paddingTop: SPACING.xl },
  iconCircle: {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryGhost,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  icon: { fontSize: 36 },
  title: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.text, textAlign: 'center' },
  subtitle: {
    fontFamily: FONTS.body, fontSize: 14,
    color: COLORS.textSecondary, textAlign: 'center',
    marginTop: SPACING.sm, lineHeight: 22,
  },
  phone: { fontFamily: FONTS.bodySemiBold, color: COLORS.primary },

  otpContainer: {
    flexDirection: 'row', justifyContent: 'center',
    gap: SPACING.sm, marginTop: SPACING.xxl, position: 'relative',
  },
  digitBox: {
    width: 48, height: 60, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.sm,
  },
  digitBoxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGhost },
  digitBoxActive: { borderColor: COLORS.primary, borderWidth: 2 },
  digitText: { fontFamily: FONTS.bodyBold, fontSize: 24, color: COLORS.text },
  cursor: {
    width: 2, height: 24, backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute', opacity: 0, width: 1, height: 1,
  },

  btn: {
    backgroundColor: COLORS.primary, paddingVertical: 18,
    borderRadius: RADIUS.full, alignItems: 'center',
    marginTop: SPACING.xxl, ...SHADOW.md,
  },
  btnDisabled: { backgroundColor: COLORS.border },
  btnText: { fontFamily: FONTS.bodySemiBold, fontSize: 17, color: '#FFF', letterSpacing: 0.3 },

  resendRow: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: SPACING.lg, alignItems: 'center',
  },
  resendLabel: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textSecondary },
  resendLink: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.primary },
  resendDisabled: { color: COLORS.textMuted },
});
