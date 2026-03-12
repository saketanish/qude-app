import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../utils/constants';
import { queueService } from '../../services/queue.service';
import { useQueueStore } from '../../store/queueStore';

export default function JoinQueueScreen({ navigation, route }) {
  const { queueId, templeName } = route.params;
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const setActiveToken = useQueueStore((s) => s.setActiveToken);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const data = await queueService.getQueue(queueId);
      setQueue(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load queue details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const result = await queueService.joinQueue(queueId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveToken(result.token, queue, result.position, result.waitMinutes);
      navigation.replace('Token', { tokenId: result.token.id, queueId });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to join queue. Please try again.';
      Alert.alert('Could not join', msg);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading queue details...</Text>
      </View>
    );
  }

  const waitMins = (queue?.total_issued - queue?.currentServing) * (queue?.avg_wait_minutes || 5);
  const peopleAhead = Math.max(0, (queue?.totalIssued || queue?.total_issued || 0) - (queue?.currentServing || queue?.current_serving || 0));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Temple header */}
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          style={styles.templeHeader}
        >
          <Text style={styles.templeEmoji}>🛕</Text>
          <Text style={styles.templeName}>{queue?.temple_name || templeName}</Text>
          <Text style={styles.queueName}>{queue?.name}</Text>
          {queue?.city && (
            <Text style={styles.location}>📍 {queue.city}{queue.state ? `, ${queue.state}` : ''}</Text>
          )}
        </LinearGradient>

        {/* Status badge */}
        <View style={styles.statusWrap}>
          <View style={[
            styles.statusBadge,
            queue?.status === 'active' ? styles.statusActive :
            queue?.status === 'paused' ? styles.statusPaused : styles.statusClosed,
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: queue?.status === 'active' ? COLORS.success : COLORS.warning }
            ]} />
            <Text style={styles.statusText}>
              {queue?.status === 'active' ? 'Queue is Open' :
               queue?.status === 'paused' ? 'Queue Paused' : 'Queue Closed'}
            </Text>
          </View>
        </View>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{queue?.total_issued || 0}</Text>
            <Text style={styles.statLabel}>Tokens Issued</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{peopleAhead}</Text>
            <Text style={styles.statLabel}>People Ahead</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>~{Math.max(0, Math.round(waitMins / 60 > 1 ? waitMins : waitMins)}</Text>
            <Text style={styles.statLabel}>{waitMins > 90 ? 'Hours Wait' : 'Min Wait'}</Text>
          </View>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 How it works</Text>
          <View style={styles.stepList}>
            {[
              { icon: '🎫', text: 'You\'ll get a digital token with a unique QR code' },
              { icon: '⏳', text: 'Wait comfortably anywhere nearby — don\'t stand in line' },
              { icon: '📲', text: 'Get SMS/WhatsApp alerts when your turn is near' },
              { icon: '🚪', text: 'Show your QR code at the gate to enter' },
            ].map((step, i) => (
              <View key={i} style={styles.step}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Join button */}
        {queue?.status === 'active' ? (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={handleJoin}
            disabled={joining}
            activeOpacity={0.85}
          >
            {joining ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.joinBtnText}>Join Queue</Text>
                <Text style={styles.joinBtnSub}>Get your token now</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.closedBtn}>
            <Text style={styles.closedBtnText}>
              {queue?.status === 'paused' ? '⏸ Queue is temporarily paused' : '🔒 Queue is closed'}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: SPACING.xxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, backgroundColor: COLORS.bg },
  loadingText: { fontFamily: FONTS.body, color: COLORS.textSecondary },

  templeHeader: {
    alignItems: 'center', paddingTop: SPACING.xxl, paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  templeEmoji: { fontSize: 52, marginBottom: SPACING.sm },
  templeName: { fontFamily: FONTS.display, fontSize: 26, color: '#FFF', textAlign: 'center' },
  queueName: { fontFamily: FONTS.bodyMedium, fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  location: { fontFamily: FONTS.body, fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 8 },

  statusWrap: { alignItems: 'center', marginTop: -18, marginBottom: SPACING.lg },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.lg, paddingVertical: 8,
    borderRadius: RADIUS.full, ...SHADOW.md,
  },
  statusActive: { backgroundColor: COLORS.bgCard },
  statusPaused: { backgroundColor: COLORS.warningBg },
  statusClosed: { backgroundColor: COLORS.errorBg },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.text },

  statsRow: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, padding: SPACING.md,
    alignItems: 'center', ...SHADOW.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statNumber: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.primary },
  statLabel: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },

  infoBox: {
    marginHorizontal: SPACING.lg, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  infoTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.text, marginBottom: SPACING.md },
  stepList: { gap: SPACING.sm },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  stepIcon: { fontSize: 18, width: 28 },
  stepText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, flex: 1, lineHeight: 20 },

  joinBtn: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg, alignItems: 'center',
    gap: 4, ...SHADOW.lg,
  },
  joinBtnText: { fontFamily: FONTS.display, fontSize: 22, color: '#FFF' },
  joinBtnSub: { fontFamily: FONTS.body, fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  closedBtn: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.bgMuted, borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg, alignItems: 'center',
  },
  closedBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.textSecondary },

  cancelBtn: { alignItems: 'center', marginTop: SPACING.md, paddingVertical: SPACING.sm },
  cancelText: { fontFamily: FONTS.bodyMedium, color: COLORS.textMuted, fontSize: 14 },
});
