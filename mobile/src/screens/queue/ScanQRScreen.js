import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.72;

export default function ScanQRScreen({ navigation }) {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cornerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation on scan frame corners
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Parse QR data — temple entrance QR is JSON: { type: 'entrance', queueId, temple }
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'entrance' && parsed.queueId) {
        navigation.replace('JoinQueue', {
          queueId: parsed.queueId,
          templeName: parsed.temple,
        });
      } else {
        // Not a valid entrance QR
        alert('This QR code is not a valid temple entrance QR.');
        setTimeout(() => setScanned(false), 2000);
      }
    } catch {
      alert('Could not read QR code. Please try again.');
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permContainer}>
        <View style={styles.permCard}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permText}>
            Qude needs camera access to scan the temple entrance QR code and get you in the queue.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <Camera
        style={StyleSheet.absoluteFill}
        onBarCodeScanned={handleBarCodeScanned}
        barCodeScannerSettings={{ barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr] }}
        flashMode={torch ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top dark area */}
        <View style={styles.overlayTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>Scan Entrance QR</Text>
          <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch(!torch)}>
            <Text style={styles.torchText}>{torch ? '🔦' : '💡'}</Text>
          </TouchableOpacity>
        </View>

        {/* Middle row: dark | scan box | dark */}
        <View style={styles.middleRow}>
          <View style={styles.overlaySide} />

          {/* Scan frame */}
          <View style={styles.scanFrame}>
            {/* Animated corner brackets */}
            {[
              { top: 0, left: 0 },
              { top: 0, right: 0 },
              { bottom: 0, left: 0 },
              { bottom: 0, right: 0 },
            ].map((pos, i) => (
              <Animated.View
                key={i}
                style={[styles.corner, pos, { opacity: pulseAnim }]}
              />
            ))}

            {/* Scan line */}
            <Animated.View
              style={[styles.scanLine, { opacity: pulseAnim }]}
            />
          </View>

          <View style={styles.overlaySide} />
        </View>

        {/* Bottom dark area */}
        <View style={styles.overlayBottom}>
          <View style={styles.instructionCard}>
            <Text style={styles.instrIcon}>🛕</Text>
            <Text style={styles.instrTitle}>
              {scanned ? 'Processing...' : 'Point at the temple entrance QR code'}
            </Text>
            <Text style={styles.instrSub}>
              Find the QR code display board at the temple entrance
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 28;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  permContainer: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center', padding: SPACING.xl,
  },
  permCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.xl, alignItems: 'center', gap: SPACING.md,
  },
  permIcon: { fontSize: 52 },
  permTitle: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.text, textAlign: 'center' },
  permText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  permBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 14,
    paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full, marginTop: SPACING.sm,
  },
  permBtnText: { fontFamily: FONTS.bodySemiBold, color: '#FFF', fontSize: 15 },

  overlay: { flex: 1 },
  overlayTop: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFF', fontSize: 22, fontFamily: FONTS.bodyBold },
  overlayTitle: { fontFamily: FONTS.display, color: '#FFF', fontSize: 18 },
  torchBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  torchText: { fontSize: 24 },

  middleRow: { flexDirection: 'row', height: SCAN_SIZE },
  overlaySide: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
  },
  scanFrame: {
    width: SCAN_SIZE, height: SCAN_SIZE, position: 'relative',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: COLORS.primaryLight, borderWidth: 3,
  },
  scanLine: {
    position: 'absolute', top: '50%', left: 0, right: 0,
    height: 2, backgroundColor: COLORS.primaryLight,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 6,
  },

  overlayBottom: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: SPACING.lg,
  },
  instructionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    width: '100%',
  },
  instrIcon: { fontSize: 36 },
  instrTitle: { fontFamily: FONTS.bodySemiBold, color: '#FFF', fontSize: 16, textAlign: 'center' },
  instrSub: { fontFamily: FONTS.body, color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' },
});
