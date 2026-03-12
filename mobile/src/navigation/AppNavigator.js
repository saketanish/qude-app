import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneScreen from '../screens/auth/PhoneScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import ScanQRScreen from '../screens/queue/ScanQRScreen';
import JoinQueueScreen from '../screens/queue/JoinQueueScreen';
import TokenScreen from '../screens/queue/TokenScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

import { useAuthStore } from '../store/authStore';
import { COLORS, FONTS } from '../utils/constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator (after login)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontFamily: FONTS.bodySemiBold,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Scan"
        component={ScanQRScreen}
        options={{
          tabBarLabel: 'Scan QR',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📷</Text>,
        }}
      />
      <Tab.Screen
        name="MyToken"
        component={ActiveTokenTab}
        options={{
          tabBarLabel: 'My Token',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🎫</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// Placeholder for active token tab
function ActiveTokenTab({ navigation }) {
  const { activeToken } = require('../store/queueStore').useQueueStore.getState();
  React.useEffect(() => {
    if (activeToken) {
      navigation.navigate('Token', { tokenId: activeToken.id, queueId: activeToken.queue_id });
    }
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🎫</Text>
      <Text style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.text }}>No Active Token</Text>
      <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
        Scan a temple QR code to join a queue and get your token
      </Text>
    </View>
  );
}

// Auth stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
    </Stack.Navigator>
  );
}

// Main app stack (authenticated)
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="JoinQueue" component={JoinQueueScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Token" component={TokenScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>🛕</Text>
        <Text style={styles.splashTitle}>QueuePass</Text>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  splashEmoji: { fontSize: 64 },
  splashTitle: {
    fontFamily: FONTS.display, fontSize: 36, color: '#FFF',
    marginTop: 16,
  },
});
