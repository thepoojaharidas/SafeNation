import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  useNavigation,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AppSettingsProvider,
  useAppSettings,
} from "../context/AppSettingsContext";
import { isUserLoggedIn } from "../services/AuthService";
import { checkAndNotifyEnvironmentalAlerts } from "../services/notificationService";
import { darkTheme, lightTheme } from "../theme/colors";

import AlertsScreen from "../screens/AlertsScreen";
import DisasterGuidesScreen from "../screens/DisasterGuidesScreen";
import DisasterQuizGame from "../screens/DisasterQuizGame";
import EmergencyContactsGame from "../screens/EmergencyContactsGame";
import EmergencyContactsScreen from "../screens/EmergencyContactsScreen";
import EmergencyKitGame from "../screens/EmergencyKitGame";
import EmergencyKitScreen from "../screens/EmergencyKitScreen";
import EvacuationGuideScreen from "../screens/EvacuationGuideScreen";
import FamilySafetyPlanScreen from "../screens/FamilySafetyPlanScreen";
import FirstAidBasicsScreen from "../screens/FirstAidBasicsScreen";
import FlashFloodsScreen from "../screens/FlashFloodsScreen";
import FloodSafetyGame from "../screens/FloodSafetyGame";
import HazeSafetyGame from "../screens/HazeSafetyGame";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ResourcesScreen from "../screens/ResourcesScreen";
import ShelterGame from "../screens/ShelterGame";
import SignupScreen from "../screens/SignupScreen";
import SOSScreen from "../screens/SOSScreen";
import TasksScreen from "../screens/TasksScreen";

// configure how notifications behave when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// floating dock with quick SOS access across all screens
function GlobalActionDock() {
  const navigation = useNavigation();
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  const [expanded, setExpanded] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // animate dock expand/collapse for better UX
  const toggleDock = () => {
    Animated.timing(slideAnim, {
      toValue: expanded ? 62 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();

    setExpanded(!expanded);
  };

  return (
    <Animated.View
      style={[
        styles.dockOuter,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.dockHandle,
          {
            backgroundColor: darkModeEnabled ? colors.cardMuted : "#FDE2E2",
          },
        ]}
        onPress={toggleDock}
        activeOpacity={0.85}
      >
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-up"}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <View
        style={[
          styles.dockContent,
          {
            backgroundColor: darkModeEnabled ? colors.card : "#FDECEC",
            borderColor: darkModeEnabled ? colors.border : "#F8D7DA",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.dockSOS}
          onPress={() => navigation.navigate("SOS")}
          activeOpacity={0.85}
        >
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={styles.dockText}>SOS</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// bottom tab navigation for main app sections
function TabNavigator({ onLogout }) {
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlobalActionDock />

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            marginBottom: 4,
          },
          tabBarStyle: {
            height: 75,
            paddingBottom: 12,
            paddingTop: 8,
            paddingHorizontal: 10,
            zIndex: 10,
            elevation: 10,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
          sceneStyle: {
            backgroundColor: colors.background,
          },
          // assign icons based on route name
          tabBarIcon: ({ color }) => {
            let iconName;

            if (route.name === "Home") iconName = "home";
            else if (route.name === "Alerts") iconName = "warning";
            else if (route.name === "Tasks") iconName = "checkmark-circle";
            else if (route.name === "Resources") iconName = "book";
            else if (route.name === "Profile") iconName = "person";

            return <Ionicons name={iconName} size={24} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Alerts" component={AlertsScreen} />
        <Tab.Screen name="Tasks" component={TasksScreen} />
        <Tab.Screen name="Resources" component={ResourcesScreen} />
        <Tab.Screen name="Profile">
          {() => <ProfileScreen onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

// stack navigator for main app screens and game routes
function MainAppStack({ onLogout }) {
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerBackTitle: "",
        headerBackButtonDisplayMode: "minimal",
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: "700",
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
        {() => <TabNavigator onLogout={onLogout} />}
      </Stack.Screen>

      <Stack.Screen
        name="SOS"
        component={SOSScreen}
        options={{ title: "SOS Emergency Help" }}
      />
      <Stack.Screen
        name="EmergencyKitGame"
        component={EmergencyKitGame}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FloodSafetyGame"
        component={FloodSafetyGame}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EmergencyContactsGame"
        component={EmergencyContactsGame}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HazeSafetyGame"
        component={HazeSafetyGame}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShelterGame"
        component={ShelterGame}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DisasterQuizGame"
        component={DisasterQuizGame}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FlashFloods"
        component={FlashFloodsScreen}
        options={{ title: "Flash Floods" }}
      />
      <Stack.Screen
        name="EmergencyContacts"
        component={EmergencyContactsScreen}
        options={{ title: "Emergency Contacts" }}
      />
      <Stack.Screen
        name="DisasterGuides"
        component={DisasterGuidesScreen}
        options={{ title: "Disaster Guides" }}
      />
      <Stack.Screen
        name="EmergencyKit"
        component={EmergencyKitScreen}
        options={{ title: "Emergency Kit" }}
      />
      <Stack.Screen
        name="EvacuationGuide"
        component={EvacuationGuideScreen}
        options={{ title: "Evacuation Guide" }}
      />
      <Stack.Screen
        name="FirstAidBasics"
        component={FirstAidBasicsScreen}
        options={{ title: "First Aid Basics" }}
      />
      <Stack.Screen
        name="FamilySafetyPlan"
        component={FamilySafetyPlanScreen}
        options={{ title: "Family Safety Plan" }}
      />
    </Stack.Navigator>
  );
}

// stack navigator for login and signup flow
function AuthStack({ onLoginSuccess, onSignupSuccess }) {
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="Signup">
        {(props) => (
          <SignupScreen {...props} onSignupSuccess={onSignupSuccess} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function AppNavigatorContent() {
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // track login state and loading status
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);

  // check login status and trigger environmental alerts on app load
  useEffect(() => {
    checkLoginStatus();
    checkAndNotifyEnvironmentalAlerts();
  }, []);

  // verify if user is logged in from storage/session
  const checkLoginStatus = async () => {
    const status = await isUserLoggedIn();
    setLoggedIn(status);
    setCheckingLogin(false);
  };

  // dynamically switch navigation theme based on dark mode
  const navigationTheme = darkModeEnabled
    ? {
        ...NavigationDarkTheme,
        colors: {
          ...NavigationDarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
      }
    : {
        ...NavigationDefaultTheme,
        colors: {
          ...NavigationDefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
      };

  // show loading indicator while checking login state
  if (checkingLogin) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar
          barStyle={darkModeEnabled ? "light-content" : "dark-content"}
          backgroundColor={colors.card}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={darkModeEnabled ? "light-content" : "dark-content"}
        backgroundColor={colors.card}
      />

      {loggedIn ? (
        <MainAppStack onLogout={() => setLoggedIn(false)} />
      ) : (
        <AuthStack
          onLoginSuccess={() => setLoggedIn(true)}
          onSignupSuccess={() => setLoggedIn(true)}
        />
      )}
    </NavigationContainer>
  );
}

// wrap app with settings provider and navigator
export default function AppNavigator() {
  return (
    <AppSettingsProvider>
      <AppNavigatorContent />
    </AppSettingsProvider>
  );
}

const styles = StyleSheet.create({
  dockOuter: {
    position: "absolute",
    bottom: 74,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 1,
  },

  dockHandle: {
    width: 48,
    height: 24,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    zIndex: 2,
  },

  dockContent: {
    marginTop: -2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  dockSOS: {
    backgroundColor: "#E53935",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  dockText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
