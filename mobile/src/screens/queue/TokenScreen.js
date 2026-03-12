import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../utils/constants';
import { queueService } from '../../services/queue.service';
import { socketService } from '../../services/socket.service';
import { useQueueStore } from '../../store/queueStore';

const { width } = Dimensions.get('window');

const STATUS_CONFIG = {
  waiting: { color: COLORS.waiting, bg: COLORS.waitingBg, label: 'Waiting in Queue', emoji: '⏳' },
  called:  { color: COLORS.called,  bg: COLORS.calledBg,  label: 'Your Turn! Proceed to Gate', emoji: '🔔' },
  entered: { color: COLORS.entered, bg: COLORS.enteredBg, label: 'Entered Successfully', emoji: '✅' },
  expired: { color: COLORS.error,   bg: COLORS.errorBg,   label: 'Token Expired', emoji: '⚠️' },
};

export default function TokenScreen({ navigation, route }) {
  const { tokenId, queueId } = route.params;
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { activeToken, activeQueue, position, waitMinutes, updatePosition, clearActiveToken } = useQueueStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const callAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadToken();
    setupSocket();
    return () => { /* cleanup handled in socketService */ };
  }, []);

  useEffect(() => {
    if (tokenData?.status === 'called') {
      startCallAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [tokenData?.status]);

  const startCallAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(callAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(callAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  };

  const loadToken = async () => {
    try {
      const data = await queueService.getMyToken(queueId);
      setTokenData(data);
    } catch {
      // Use store data as fallback
      if (activeToken) setTokenData({ token: activeToken, position, waitMinutes });
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = socketService.connect();
    socketService.joinQueueRoom(queueId);
    socketService.joinTokenRoom(tokenId);

    const unsubQueue = socketService.onQueueUpdate(({ currentServing }) => {
      updatePosition(currentServing);
      setTokenData((prev) => prev ? {
        ...prev,
        position: Math.max(0, (prev.token?.token_number || 0) - currentServing),
      } : prev);
    });

    const unsubCalled = socketService.onTokenCalled(({ tokenId: calledId }) => {
      if (calledId === tokenId) {
        setTokenData((prev) => prev ? { ...prev, token: { ...prev.token, status: 'called' } } : prev);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        startCallAnimation();
      }
    });
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Queue?',
      'Your token will be cancelled and you will lose your place in the queue.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave Queue',
          style: 'destructive',
          onPress: async () => {
            await queueService.leaveQueue(queueId);
            clearActiveToken();
            navigation.replace('Scan');
          },
        },
      ]
    );
  };

  const token = tokenData?.token || activeToken;
  const currentPosition = tokenData?.position ?? position ?? 0;
  const wait = tokenData?.waitMinutes ?? waitMinutes ?? 0;
  const status = token?.status || 'waiting';
  const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.waiting;
  const isCalled = status === 'called';

  if (!token) return (
    <View style={styles.loadingWrap}>
      <Text style={styles.loadingText}>Loading your token...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={isCalled ? ['#C04E00', '#FF6B00'] : [COLORS.text, '#3D2314']}
          style={styles.header}
        >
          <Text style={styles.headerTemple}>{tokenData?.temple_name || activeQueue?.name || 'Temple Queue'}</Text>
          <Text style={styles.headerQueue}>{tokenData?.queue_name || 'General Darshan'}</Text>

          {/* Token number - big display */}
          <View style={styles.tokenNumberWrap}>
            <Text style={styles.tokenLabel}>TOKEN</Text>
            <Text style={styles.tokenNumber}>#{token.token_number?.toString().padStart(3, '0')}</Text>
          </View>

          {/* Status badge */}
          <Animated.View
            style={[
              styles.statusBadge,
              { backgroundColor: isCalled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)' },
              isCalled && { opacity: callAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
            ]}
          >
            <Text style={styles.statusEmoji}>{statusConf.emoji}</Text>
            <Text style={styles.statusLabel}>{statusConf.label}</Text>
          </Animated.View>
        </LinearGradient>

        {/* Live position tracker */}
        {status === 'waiting' && (
          <View style={styles.positionCard}>
            <View style={styles.positionRow}>
              <View style={styles.positionItem}>
                <Text style={styles.positionNum}>{currentPosition}</Text>
                <Text style={styles.positionItemLabel}>Ahead of you</Text>
              </View>
              <View style={styles.positionDivider} />
              <View style={styles.positionItem}>
                <Text style={styles.positionNum}>
                  {wait >= 60 ? `${Math.round(wait / 60)}h` : `${Math.round(wait)}m`}
                </Text>
                <Text style={styles.positionItemLabel}>Est. wait</Text>
              </View>
              <View style={styles.positionDivider} />
              <View style={styles.positionItem}>
                <Text style={styles.positionNum}>{token.token_number}</Text>
                <Text style={styles.positionItemLabel}>Your number</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, Math.max(5, ((token.token_number - currentPosition) / token.token_number) * 100))}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {token.token_number - currentPosition} of {token.token_number} served
              </Text>
            </View>
          </View>
        )}

        {/* Called to gate - urgent card */}
        {isCalled && (
          <View style={styles.urgentCard}>
            <Text style={styles.urgentEmoji}>🚨</Text>
            <Text style={styles.urgentTitle}>PROCEED TO GATE NOW</Text>
            <Text style={styles.urgentSub}>
              Show your QR code below at the entrance.{'\n'}Valid for the next 10 minutes only!
            </Text>
          </View>
        )}

        {/* QR Code */}
        {(status === 'waiting' || status === 'called') && (
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Your Entry QR Code</Text>
            <Text style={styles.qrSub}>
              {isCalled
                ? 'Show this at the gate to enter'
                : 'Keep this ready — you\'ll need it to enter'}
            </Text>
            <View style={[styles.qrWrap, isCalled && styles.qrWrapCalled]}>
              <QRCode
                value={token.qr_code || `QP-${token.id}`}
                size={200}
                color={isCalled ? COLORS.primaryDark : COLORS.text}
                backgroundColor="transparent"
                logo={{ uri: '' }}
              />
            </View>
            <Text style={styles.qrCode}>{token.qr_code?.substring(0, 20)}...</Text>
          </View>
        )}

        {/* Tips while waiting */}
        {status === 'waiting' && currentPosition > 5 && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>While you wait...</Text>
            {[
              '🍵 Get prasadam or tea at the stalls nearby',
              '🧘 Visit the meditation hall or rest area',
              '📿 Browse the temple market',
              '📲 You\'ll get SMS/WhatsApp alerts when close',
            ].map((tip, i) => (
              <Text key={i} style={styles.tip}>{tip}</Text>
            ))}
          </View>
        )}

        {/* Leave queue button */}
        {(status === 'waiting') && (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.8}>
            <Text style={styles.leaveBtnText}>Leave Queue</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: FONTS.body, color: COLORS.textSecondary },

  header: {
    paddingTop: SPACING.xxl, paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg, alignItems: 'center',
  },
  headerTemple: { fontFamily: FONTS.display, fontSize: 20, color: '#FFF', textAlign: 'center' },
  headerQueue: { fontFamily: FONTS.body, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  tokenNumberWrap: { alignItems: 'center', marginVertical: SPACING.xl },
  tokenLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: 11,
    color: 'rgba(255,255,255,0.6)', letterSpacing: 4,
  },
  tokenNumber: {
    fontFamily: FONTS.display, fontSize: 72, color: '#FFF',
    lineHeight: 80,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  statusEmoji: { fontSize: 16 },
  statusLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: '#FFF' },

  positionCard: {
    margin: SPACING.lg, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    ...SHADOW.md, borderWidth: 1, borderColor: COLORS.border,
  },
  positionRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  positionItem: { alignItems: 'center', flex: 1 },
  positionNum: { fontFamily: FONTS.display, fontSize: 36, color: COLORS.primary },
  positionItemLabel: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  positionDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  progressWrap: { marginTop: SPACING.lg, gap: SPACING.xs },
  progressTrack: {
    height: 6, backgroundColor: COLORS.bgMuted, borderRadius: RADIUS.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
  },
  progressLabel: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },

  urgentCard: {
    margin: SPACING.lg, backgroundColor: COLORS.calledBg,
    borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.called,
  },
  urgentEmoji: { fontSize: 36 },
  urgentTitle: {
    fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.called, letterSpacing: 1, marginTop: SPACING.sm,
  },
  urgentSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 6 },

  qrCard: {
    marginHorizontal: SPACING.lg, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
    ...SHADOW.md, borderWidth: 1, borderColor: COLORS.border,
  },
  qrTitle: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.text },
  qrSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  qrWrap: {
    marginTop: SPACING.lg, padding: SPACING.lg,
    backgroundColor: COLORS.bgMuted, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
  },
  qrWrapCalled: { backgroundColor: COLORS.calledBg, borderColor: COLORS.called },
  qrCode: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textMuted, marginTop: SPACING.sm },

  tipsCard: {
    margin: SPACING.lg, backgroundColor: COLORS.goldGhost,
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.gold, gap: SPACING.sm,
  },
  tipsTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.text, marginBottom: SPACING.xs },
  tip: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },

  leaveBtn: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    paddingVertical: 14, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  leaveBtnText: { fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary, fontSize: 14 },
  bottomPad: { height: SPACING.xl },
});
