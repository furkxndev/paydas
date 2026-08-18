import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useHouseholdData } from '../hooks';
import { BillsScreen } from '../screens/bills';
import { ChoresScreen } from '../screens/chores';
import { ExpensesScreen } from '../screens/expenses';
import { HomeScreen } from '../screens/home';
import { ProfileScreen } from '../screens/profile';
import { colors, layout, typography } from '../theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<
  keyof MainTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Expenses: { active: 'wallet', inactive: 'wallet-outline' },
  Bills: { active: 'receipt', inactive: 'receipt-outline' },
  Chores: { active: 'checkmark-done-circle', inactive: 'checkmark-done-circle-outline' },
  Profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export const MainTabNavigator = () => {
  const { summary } = useHouseholdData();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color, size }) => {
          const icon = ICONS[route.name];
          return (
            <View style={styles.iconWrapper}>
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={size - 2}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Özet' }} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Giderler' }} />
      <Tab.Screen
        name="Bills"
        component={BillsScreen}
        options={{
          title: 'Faturalar',
          tabBarBadge: summary.overdueBillsCount > 0 ? summary.overdueBillsCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen
        name="Chores"
        component={ChoresScreen}
        options={{
          title: 'Ev işleri',
          tabBarBadge:
            summary.myPendingChoresCount > 0 ? summary.myPendingChoresCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 88 : layout.tabBarHeight + 8,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  tabItem: { paddingVertical: 2 },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.danger,
    fontSize: 10,
    lineHeight: 14,
  },
});
