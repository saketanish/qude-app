import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

const MenuItem = ({ icon, label, onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={[styles.menuLabel, danger && styles.menuDanger]}>{label}</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : user?.phone?.slice(-2) || 'QP';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Devotee'}</Text>
          <Text style={styles.phone}>+91 {user?.phone}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🙏 Verified Devotee</Text>
          </View>
        </LinearGradient>

        {/* Menu sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Queue History</Text>
          <View style={styles.card}>
            <MenuItem icon="🎫" label="My Past Visits" onPress={() => {}} />
            <View style={styles.divider} />
            <MenuItem icon="⭐" label="Favourite Temples" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <MenuItem icon="🔔" label="Notification Settings" onPress={() => {}} />
            <View style={styles.divider} />
            <MenuItem icon="🌐" label="Language" onPress={() => {}} />
            <View style={styles.divider} />
            <MenuItem icon="📞" label="Update Phone Number" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <MenuItem icon="❓" label="Help & FAQ" onPress={() => {}} />
            <View style={styles.divider} />
            <MenuItem icon="📧" label="Contact Support" onPress={() => {}} />
            <View style={styles.divider} />
            <MenuItem icon="📋" label="Terms & Privacy Policy" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <MenuItem icon="🚪" label="Sign Out" onPress={handleLogout} danger />
          </View>
        </View>

        <Text style={styles.version}>Qude v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    alignItems: 'center', paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: SPACING.md,
  },
  avatarText: { fontFamily: FONTS.display, fontSize: 28, color: '#FFF' },
  name: { fontFamily: FONTS.display, fontSize: 22, color: '#FFF' },
  phone: { fontFamily: FONTS.body, fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  badge: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  badgeText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: '#FFF' },

  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold, fontSize: 12,
    color: COLORS.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
    ...SHADOW.sm,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 16, gap: SPACING.sm,
  },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.text },
  menuDanger: { color: COLORS.error },
  menuArrow: { fontFamily: FONTS.body, fontSize: 20, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: SPACING.md + 28 + SPACING.sm },

  version: {
    fontFamily: FONTS.body, fontSize: 12,
    color: COLORS.textMuted, textAlign: 'center',
    marginTop: SPACING.xl, marginBottom: SPACING.xl,
  },
});
