import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';

import { LoadingState } from '../components/ui';
import { useAuth, useHousehold, usePushNotifications } from '../hooks';
import { notificationService } from '../services';
import { AdminScreen, AdminUserDetailScreen } from '../screens/admin';
import {
  ForgotPasswordScreen,
  LoginScreen,
  RegisterScreen,
  WelcomeScreen,
} from '../screens/auth';
import { BalancesScreen, SettleUpScreen } from '../screens/balances';
import { AddBillScreen, BillDetailScreen } from '../screens/bills';
import { AddChoreScreen } from '../screens/chores';
import { AddExpenseScreen, ExpenseDetailScreen } from '../screens/expenses';
import { HouseholdScreen } from '../screens/household';
import { NotificationSettingsScreen, NotificationsScreen } from '../screens/notifications';
import {
  CreateHouseholdScreen,
  HouseholdSetupScreen,
  JoinHouseholdScreen,
} from '../screens/onboarding';
import {
  ChangePasswordScreen,
  DeleteAccountScreen,
  EditProfileScreen,
} from '../screens/profile';
import { MainTabNavigator } from './MainTabNavigator';
import { navigationTheme } from './theme';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Bildirime dokunulduğunda ilgili ekrana yönlendirir.
 * Navigasyon hazır değilse sessizce yok sayılır.
 */
const handleNotificationData = (data: Record<string, unknown>) => {
  if (!navigationRef.isReady()) return;
  const billId = typeof data.billId === 'string' ? data.billId : undefined;
  const choreId = typeof data.choreId === 'string' ? data.choreId : undefined;
  const expenseId = typeof data.expenseId === 'string' ? data.expenseId : undefined;

  if (billId) navigationRef.navigate('BillDetail', { billId });
  else if (expenseId) navigationRef.navigate('ExpenseDetail', { expenseId });
  else if (choreId) navigationRef.navigate('AddChore', { choreId });
};

const RootRoutes = () => {
  const { isAuthenticated, initializing } = useAuth();
  const { households, loading } = useHousehold();
  const { permissionGranted, requestPermission } = usePushNotifications();

  // Kullanıcı eve girdikten sonra bildirim izni iste
  useEffect(() => {
    if (isAuthenticated && households.length > 0 && !permissionGranted) {
      requestPermission();
    }
  }, [isAuthenticated, households.length, permissionGranted, requestPermission]);

  useEffect(() => {
    const subscription = notificationService.addResponseListener(handleNotificationData);
    return () => subscription.remove();
  }, []);

  if (initializing) return <LoadingState message="Paydaş açılıyor…" />;
  if (isAuthenticated && loading) return <LoadingState message="Evlerin yükleniyor…" />;

  const needsHousehold = isAuthenticated && households.length === 0;

  /**
   * Tek bir yığın kullanılır; duruma göre yalnızca ilgili grup render edilir.
   *
   * Gruplar arasında rota adları çakışmamalıdır. Ev kurulumundaki ekranlar bu yüzden
   * "Setup" önekiyle tanımlanır: ev oluşturulduğunda o rotalar yapılandırmadan çıkar,
   * React Navigation da kullanıcıyı otomatik olarak yeni grubun ilk ekranına (Tabs) alır.
   * Aynı ad iki grupta birden bulunursa rota korunur ve kullanıcı ekranda takılı kalır.
   */
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      ) : needsHousehold ? (
        <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
          <Stack.Screen name="HouseholdSetup" component={HouseholdSetupScreen} />
          <Stack.Screen name="SetupCreateHousehold" component={CreateHouseholdScreen} />
          <Stack.Screen name="SetupJoinHousehold" component={JoinHouseholdScreen} />
          <Stack.Screen name="SetupAdmin" component={AdminScreen} />
          <Stack.Screen name="SetupAdminUserDetail" component={AdminUserDetailScreen} />
        </Stack.Group>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={MainTabNavigator} />

          <Stack.Group
            screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          >
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen name="AddBill" component={AddBillScreen} />
            <Stack.Screen name="AddChore" component={AddChoreScreen} />
            <Stack.Screen name="SettleUp" component={SettleUpScreen} />
            <Stack.Screen name="CreateHousehold" component={CreateHouseholdScreen} />
            <Stack.Screen name="JoinHousehold" component={JoinHouseholdScreen} />
          </Stack.Group>

          <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
            <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
            <Stack.Screen name="BillDetail" component={BillDetailScreen} />
            <Stack.Screen name="Balances" component={BalancesScreen} />
            <Stack.Screen name="Household" component={HouseholdScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
};

export const RootNavigator = () => (
  <NavigationContainer ref={navigationRef} theme={navigationTheme}>
    <RootRoutes />
  </NavigationContainer>
);
