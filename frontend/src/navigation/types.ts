import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * Uygulamadaki tüm rotalar tek bir yığında tanımlıdır.
 * Oturum ve ev durumuna göre RootNavigator yalnızca ilgili grubu render eder;
 * navigatörün tamamı değiştirilmez (React Navigation'ın önerdiği desen).
 */
export type RootStackParamList = {
  // --- Kimlik doğrulama ---
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // --- Ev kurulumu ---
  // Bu rota adları uygulama grubundakilerden FARKLI olmak zorunda: aynı ad iki grupta
  // birden tanımlıysa, grup değiştiğinde React Navigation rotayı koruyor ve kullanıcı
  // ekranda takılı kalıyor.
  HouseholdSetup: undefined;
  SetupCreateHousehold: undefined;
  SetupJoinHousehold: undefined;
  SetupAdmin: undefined;
  SetupAdminUserDetail: { userId: string };

  // --- Uygulama ---
  Tabs: NavigatorScreenParams<MainTabParamList>;
  AddExpense: { expenseId?: string; billId?: string } | undefined;
  ExpenseDetail: { expenseId: string };
  Balances: undefined;
  SettleUp: { toUserId?: string; amount?: number } | undefined;
  AddBill: { billId?: string } | undefined;
  BillDetail: { billId: string };
  AddChore: { choreId?: string } | undefined;
  Household: undefined;
  CreateHousehold: undefined;
  JoinHousehold: undefined;
  Invite: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  Admin: undefined;
  AdminUserDetail: { userId: string };
};

/** Geriye dönük uyumluluk için takma adlar */
export type AuthStackParamList = RootStackParamList;
export type OnboardingStackParamList = RootStackParamList;
export type AppStackParamList = RootStackParamList;

export type MainTabParamList = {
  Home: undefined;
  Expenses: undefined;
  Bills: undefined;
  Chores: undefined;
  Profile: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthScreenProps<T extends keyof RootStackParamList> = RootScreenProps<T>;
export type OnboardingScreenProps<T extends keyof RootStackParamList> = RootScreenProps<T>;
export type AppScreenProps<T extends keyof RootStackParamList> = RootScreenProps<T>;

export type TabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    // React Navigation global tip birleştirmesi bu boş arayüzü gerektirir
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
