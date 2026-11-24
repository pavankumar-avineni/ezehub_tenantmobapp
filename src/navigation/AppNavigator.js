import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { logAction } from '../utils/logger';

import DashboardScreen from '../screens/DashboardScreen';
import ResidentsScreen from '../screens/ResidentsScreen';
import ResidentDetailScreen from '../screens/ResidentDetailScreen';
import AddResidentScreen from '../screens/AddResidentScreen';
import RentScreen from '../screens/RentScreen';
import RentDetailScreen from '../screens/RentDetailScreen';
import PaymentProofsScreen from '../screens/PaymentProofsScreen';
import VisitorsScreen from '../screens/VisitorsScreen';
import MoreScreen from '../screens/MoreScreen';
import BuildingsScreen from '../screens/BuildingsScreen';
import StaffScreen from '../screens/StaffScreen';
import ComplaintsScreen from '../screens/ComplaintsScreen';
import FinanceScreen from '../screens/FinanceScreen';
import InventoryScreen from '../screens/InventoryScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LoginOtpsScreen from '../screens/LoginOtpsScreen';
import DiscountsScreen from '../screens/DiscountsScreen';
import PromotionsScreen from '../screens/PromotionsScreen';
import FoodMenuScreen from '../screens/FoodMenuScreen';
import BedMapScreen from '../screens/BedMapScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function useStackOptions() {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '600' },
  };
}

function DashboardStack() {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DashboardBuildings" component={BuildingsScreen} options={{ title: 'Buildings' }} />
      <Stack.Screen name="DashboardOccupancy" component={BedMapScreen} options={{ title: 'Occupancy & Bed Map' }} />
      <Stack.Screen name="DashboardStaff" component={StaffScreen} options={{ title: 'Staff' }} />
      <Stack.Screen name="DashboardComplaints" component={ComplaintsScreen} options={{ title: 'Complaints' }} />
      <Stack.Screen name="DashboardResidents" component={ResidentsScreen} options={{ title: 'Residents' }} />
      <Stack.Screen name="DashboardResidentDetail" component={ResidentDetailScreen} options={{ title: 'Resident Details' }} />
      <Stack.Screen name="DashboardAddResident" component={AddResidentScreen} options={{ title: 'Add Resident' }} />
      <Stack.Screen name="DashboardRent" component={RentScreen} options={{ title: 'Pending Rent' }} />
      <Stack.Screen name="DashboardRentDetail" component={RentDetailScreen} options={{ title: 'Rent Details' }} />
      <Stack.Screen name="DashboardPaymentProofs" component={PaymentProofsScreen} options={{ title: 'Payment Proofs' }} />
    </Stack.Navigator>
  );
}

function ResidentsStack() {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts}>
      <Stack.Screen name="ResidentsList" component={ResidentsScreen} options={{ title: 'Residents' }} />
      <Stack.Screen name="ResidentDetail" component={ResidentDetailScreen} options={{ title: 'Resident Details' }} />
      <Stack.Screen name="AddResident" component={AddResidentScreen} options={{ title: 'Add Resident' }} />
    </Stack.Navigator>
  );
}

function RentStack() {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts}>
      <Stack.Screen name="RentList" component={RentScreen} options={{ title: 'Rent' }} />
      <Stack.Screen name="RentDetail" component={RentDetailScreen} options={{ title: 'Rent Details' }} />
      <Stack.Screen name="PaymentProofs" component={PaymentProofsScreen} options={{ title: 'Payment Proofs' }} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts}>
      <Stack.Screen name="MoreMenu" component={MoreScreen} options={{ title: 'More' }} />
      <Stack.Screen name="BuildingsPage" component={BuildingsScreen} options={{ title: 'Buildings' }} />
      <Stack.Screen name="StaffPage" component={StaffScreen} options={{ title: 'Staff' }} />
      <Stack.Screen name="ComplaintsPage" component={ComplaintsScreen} options={{ title: 'Complaints' }} />
      <Stack.Screen name="FinancePage" component={FinanceScreen} options={{ title: 'Finance' }} />
      <Stack.Screen name="InventoryPage" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="MaintenancePage" component={MaintenanceScreen} options={{ title: 'Maintenance' }} />
      <Stack.Screen name="DocumentsPage" component={DocumentsScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="NotificationsPage" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="SettingsPage" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="LoginOtpsPage" component={LoginOtpsScreen} options={{ title: 'Login OTPs' }} />
      <Stack.Screen name="DiscountsPage" component={DiscountsScreen} options={{ title: 'Discounts' }} />
      <Stack.Screen name="PromotionsPage" component={PromotionsScreen} options={{ title: 'Promotions' }} />
      <Stack.Screen name="FoodMenuPage" component={FoodMenuScreen} options={{ title: 'Food Menu' }} />
      <Stack.Screen name="BedMapPage" component={BedMapScreen} options={{ title: 'Bed Map' }} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: (e) => {
          logAction('TAB_NAVIGATION', `Bottom tab pressed: ${e.target}`);
        },
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Residents: focused ? 'people' : 'people-outline',
            Rent: focused ? 'wallet' : 'wallet-outline',
            Visitors: focused ? 'person-add' : 'person-add-outline',
            More: focused ? 'menu' : 'menu-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.divider,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} options={{ headerShown: false }} />
      <Tab.Screen name="Residents" component={ResidentsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Rent" component={RentStack} options={{ headerShown: false }} />
      <Tab.Screen name="Visitors" component={VisitorsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="More" component={MoreStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
