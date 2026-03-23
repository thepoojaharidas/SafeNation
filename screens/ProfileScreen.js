import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppSettings } from "../context/AppSettingsContext";
import { getCurrentUser, logoutUser } from "../services/AuthService";
import {
  disableSafetyReminders,
  enableSafetyReminders,
  getNotificationsEnabled,
} from "../services/notificationService";

// keys used for storing user progress, streak, and preferences
const STORAGE_KEY = "preparedness_tasks";
const STREAK_COUNT_KEY = "prep_streak_count";
const LAST_COMPLETION_DATE_KEY = "prep_last_completion";
const DAILY_MISSION_DATE_KEY = "daily_mission_date";
const DAILY_MISSION_COMPLETED_KEY = "daily_mission_completed";
const LOCATION_KEY = "profile_location_enabled";

// default list of preparedness tasks used to calculate progress
const BASE_TASKS = [
  {
    id: 1,
    title: "Prepare an emergency kit",
    points: 20,
    completed: false,
  },
  {
    id: 2,
    title: "Save emergency contact numbers",
    points: 10,
    completed: false,
  },
  {
    id: 3,
    title: "Learn flood safety steps",
    points: 15,
    completed: false,
  },
  {
    id: 4,
    title: "Review haze protection guide",
    points: 15,
    completed: false,
  },
  {
    id: 5,
    title: "Locate nearest shelter",
    points: 20,
    completed: false,
  },
  {
    id: 6,
    title: "Complete the disaster quiz",
    points: 25,
    completed: false,
  },
];

export default function ProfileScreen({ onLogout }) {
  // store notification settings, location preference, and user data
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [user, setUser] = useState(null);

  // store calculated stats like readiness %, streak, badges, and reminder text
  const [profileStats, setProfileStats] = useState({
    readinessPercent: 0,
    completedTasks: 0,
    totalTasks: BASE_TASKS.length,
    unlockedBadges: 0,
    streak: 0,
    reminderTitle: "Safety Reminder",
    reminderText:
      "Review your emergency contacts and emergency kit regularly so you are ready when unexpected situations happen.",
  });

  // get current theme setting and toggle function
  const { darkModeEnabled, setDarkModeEnabled } = useAppSettings();

  // reload profile data whenever the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadScreenData = async () => {
        await loadUserDetails();
        await loadNotificationPreference();
        await loadLocationPreference();
        await loadProfileStats();
      };

      loadScreenData();
    }, []),
  );

  // generate a unique identifier for storing user-specific data
  const getUserScope = async () => {
    try {
      const currentUser = await getCurrentUser();
      return (
        currentUser?.email?.trim().toLowerCase() ||
        currentUser?.name?.trim().toLowerCase().replace(/\s+/g, "_") ||
        "guest"
      );
    } catch (error) {
      return "guest";
    }
  };

  // attach user-specific scope to storage keys
  const getScopedKey = async (baseKey) => {
    const scope = await getUserScope();
    return `${baseKey}_${scope}`;
  };

  // extract initials from user's name for avatar display
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";

    const parts = name.trim().split(" ").filter(Boolean).slice(0, 2);

    if (parts.length === 0) return "U";

    return parts.map((part) => part[0].toUpperCase()).join("");
  };

  // calculate number of badges unlocked based on completed tasks
  const getBadgeCount = (tasks) => {
    const completedTasks = tasks.filter((task) => task.completed).length;

    const task1Done = tasks.find((task) => task.id === 1)?.completed ?? false;
    const task2Done = tasks.find((task) => task.id === 2)?.completed ?? false;
    const task3Done = tasks.find((task) => task.id === 3)?.completed ?? false;
    const task4Done = tasks.find((task) => task.id === 4)?.completed ?? false;
    const task5Done = tasks.find((task) => task.id === 5)?.completed ?? false;
    const task6Done = tasks.find((task) => task.id === 6)?.completed ?? false;

    const badgeChecks = [
      completedTasks >= 1,
      completedTasks >= 3,
      completedTasks >= 4,
      completedTasks === tasks.length && tasks.length > 0,
      task1Done,
      task2Done,
      task3Done,
      task4Done,
      task5Done,
      task6Done,
    ];

    return badgeChecks.filter(Boolean).length;
  };

  // generate personalized reminder based on user progress
  const getDynamicReminder = (tasks, readinessPercent, streak) => {
    const task1Done = tasks.find((task) => task.id === 1)?.completed ?? false;
    const task2Done = tasks.find((task) => task.id === 2)?.completed ?? false;
    const task5Done = tasks.find((task) => task.id === 5)?.completed ?? false;
    const task6Done = tasks.find((task) => task.id === 6)?.completed ?? false;
    const completedTasks = tasks.filter((task) => task.completed).length;

    if (completedTasks === 0) {
      return {
        reminderTitle: "Good Place to Start",
        reminderText:
          "Begin with your emergency kit. It is one of the fastest ways to improve your overall preparedness.",
      };
    }

    if (!task2Done) {
      return {
        reminderTitle: "Contact Check",
        reminderText:
          "Update your emergency contacts so the right people can be reached quickly when needed.",
      };
    }

    if (!task1Done) {
      return {
        reminderTitle: "Kit Check",
        reminderText:
          "Build or review your emergency kit and make sure essential items like water, medication, and a flashlight are included.",
      };
    }

    if (!task5Done) {
      return {
        reminderTitle: "Shelter Reminder",
        reminderText:
          "Knowing your nearest safe shelter in advance can save valuable time during an emergency.",
      };
    }

    if (!task6Done) {
      return {
        reminderTitle: "Final Review",
        reminderText:
          "Try the disaster quiz to test what you have learned and strengthen your readiness.",
      };
    }

    if (readinessPercent === 100) {
      return {
        reminderTitle: "Excellent Work",
        reminderText:
          streak > 0
            ? `You have completed all preparedness tasks. Keep your ${streak}-day ready streak going with today’s mission.`
            : "You have completed all preparedness tasks. Keep checking in daily to maintain your readiness habits.",
      };
    }

    return {
      reminderTitle: "Keep Building",
      reminderText:
        "You are making progress. Completing one more task today will push your readiness even higher.",
    };
  };

  // fetch user details from auth service
  const loadUserDetails = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log("User load error:", error);
      setUser(null);
    }
  };

  // retrieve saved notification preference
  const loadNotificationPreference = async () => {
    try {
      const enabled = await getNotificationsEnabled();
      setNotificationsEnabled(enabled);
    } catch (error) {
      console.log("Error loading notification preference:", error);
      setNotificationsEnabled(false);
    }
  };

  // retrieve saved location toggle state
  const loadLocationPreference = async () => {
    try {
      const scopedLocationKey = await getScopedKey(LOCATION_KEY);
      const savedLocation = await AsyncStorage.getItem(scopedLocationKey);

      if (savedLocation !== null) {
        setLocationEnabled(savedLocation === "true");
      }
    } catch (error) {
      console.log("Error loading location preference:", error);
    }
  };

  // calculate and load readiness stats from stored task data
  const loadProfileStats = async () => {
    try {
      const scopedStorageKey = await getScopedKey(STORAGE_KEY);
      const scopedStreakKey = await getScopedKey(STREAK_COUNT_KEY);

      const savedTasks = await AsyncStorage.getItem(scopedStorageKey);
      const savedStreak = await AsyncStorage.getItem(scopedStreakKey);

      const tasks = savedTasks ? JSON.parse(savedTasks) : BASE_TASKS;
      const completedTasks = tasks.filter((task) => task.completed).length;
      const totalTasks = tasks.length;
      const readinessPercent =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const unlockedBadges = getBadgeCount(tasks);
      const streak = savedStreak ? parseInt(savedStreak, 10) : 0;

      const dynamicReminder = getDynamicReminder(
        tasks,
        readinessPercent,
        streak,
      );

      setProfileStats({
        readinessPercent,
        completedTasks,
        totalTasks,
        unlockedBadges,
        streak,
        ...dynamicReminder,
      });
    } catch (error) {
      console.log("Error loading profile stats:", error);
      setProfileStats({
        readinessPercent: 0,
        completedTasks: 0,
        totalTasks: BASE_TASKS.length,
        unlockedBadges: 0,
        streak: 0,
        reminderTitle: "Safety Reminder",
        reminderText:
          "Review your emergency contacts and emergency kit regularly so you are ready when unexpected situations happen.",
      });
    }
  };

  // enable or disable safety reminder notifications
  const handleToggleNotifications = async (value) => {
    try {
      if (value) {
        const enabled = await enableSafetyReminders();

        if (!enabled) {
          Alert.alert(
            "Permission needed",
            "Please allow notifications in your device settings to receive reminders.",
          );
          setNotificationsEnabled(false);
          return;
        }

        setNotificationsEnabled(true);
        Alert.alert(
          "Notifications enabled",
          "Daily mission reminder is set for 8:00 PM and streak warning is set for 10:00 PM.",
        );
      } else {
        await disableSafetyReminders();
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.log("Notification toggle error:", error);
      Alert.alert("Error", "Unable to update notification settings.");
    }
  };

  // update and store location preference
  const handleLocationToggle = async (value) => {
    try {
      setLocationEnabled(value);
      const scopedLocationKey = await getScopedKey(LOCATION_KEY);
      await AsyncStorage.setItem(scopedLocationKey, String(value));
    } catch (error) {
      console.log("Error saving location setting:", error);
      setLocationEnabled(!value);
    }
  };

  // reset all user progress including tasks and streak
  const handleResetProgress = async () => {
    Alert.alert(
      "Reset Progress",
      "Are you sure you want to reset all your preparedness progress?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const scopedStorageKey = await getScopedKey(STORAGE_KEY);
              const scopedStreakKey = await getScopedKey(STREAK_COUNT_KEY);
              const scopedLastCompletionKey = await getScopedKey(
                LAST_COMPLETION_DATE_KEY,
              );
              const scopedDailyMissionDateKey = await getScopedKey(
                DAILY_MISSION_DATE_KEY,
              );
              const scopedDailyMissionCompletedKey = await getScopedKey(
                DAILY_MISSION_COMPLETED_KEY,
              );

              await AsyncStorage.multiSet([
                [scopedStorageKey, JSON.stringify(BASE_TASKS)],
                [scopedStreakKey, "0"],
              ]);

              await AsyncStorage.multiRemove([
                scopedLastCompletionKey,
                scopedDailyMissionDateKey,
                scopedDailyMissionCompletedKey,
              ]);

              await loadProfileStats();

              Alert.alert(
                "Progress Reset",
                "Your preparedness progress has been reset successfully.",
              );
            } catch (error) {
              console.log("Error resetting progress:", error);
              Alert.alert(
                "Error",
                "Unable to reset your progress. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  // log user out and trigger parent logout handler
  const handleLogout = async () => {
    const result = await logoutUser();

    if (result.success) {
      if (onLogout) {
        onLogout();
      }
    } else {
      Alert.alert("Error", "Unable to log out. Please try again.");
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[
        styles.safeArea,
        darkModeEnabled && { backgroundColor: "#0F172A" },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.headerCard,
            darkModeEnabled && { backgroundColor: "#1E293B" },
          ]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>

          <View style={styles.headerTextWrap}>
            <Text
              style={[styles.name, darkModeEnabled && { color: "#FFFFFF" }]}
            >
              {user?.name ? user.name : "User"}
            </Text>

            <Text
              style={[styles.tagline, darkModeEnabled && { color: "#CBD5E1" }]}
            >
              Stay prepared, stay safe
            </Text>

            {user?.email ? (
              <Text
                style={[
                  styles.emailText,
                  darkModeEnabled && { color: "#94A3B8" },
                ]}
              >
                {user.email}
              </Text>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.progressCard,
            darkModeEnabled && { backgroundColor: "#1E293B" },
          ]}
        >
          <View style={styles.progressHeaderRow}>
            <Text
              style={[
                styles.sectionTitle,
                darkModeEnabled && { color: "#FFFFFF" },
              ]}
            >
              Preparedness Overview
            </Text>

            <View style={styles.streakPill}>
              <Ionicons name="flame" size={14} color="#FFFFFF" />
              <Text style={styles.streakPillText}>
                {profileStats.streak}-Day Streak
              </Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${profileStats.readinessPercent}%` },
              ]}
            />
          </View>

          <Text
            style={[
              styles.progressHint,
              darkModeEnabled && { color: "#CBD5E1" },
            ]}
          >
            {profileStats.completedTasks} of {profileStats.totalTasks} tasks
            completed
          </Text>

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statBox,
                darkModeEnabled && { backgroundColor: "#334155" },
              ]}
            >
              <Text style={styles.statNumber}>
                {profileStats.readinessPercent}%
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  darkModeEnabled && { color: "#CBD5E1" },
                ]}
              >
                Readiness
              </Text>
            </View>

            <View
              style={[
                styles.statBox,
                darkModeEnabled && { backgroundColor: "#334155" },
              ]}
            >
              <Text style={styles.statNumber}>
                {profileStats.completedTasks}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  darkModeEnabled && { color: "#CBD5E1" },
                ]}
              >
                Tasks Done
              </Text>
            </View>

            <View
              style={[
                styles.statBox,
                darkModeEnabled && { backgroundColor: "#334155" },
              ]}
            >
              <Text style={styles.statNumber}>
                {profileStats.unlockedBadges}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  darkModeEnabled && { color: "#CBD5E1" },
                ]}
              >
                Badges
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={[styles.groupTitle, darkModeEnabled && { color: "#FFFFFF" }]}
        >
          Settings
        </Text>

        <View
          style={[
            styles.settingCard,
            darkModeEnabled && { backgroundColor: "#1E293B" },
          ]}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color="#1E88E5" />
            <Text
              style={[
                styles.settingText,
                darkModeEnabled && { color: "#FFFFFF" },
              ]}
            >
              Push Notifications
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />
        </View>

        <View
          style={[
            styles.settingCard,
            darkModeEnabled && { backgroundColor: "#1E293B" },
          ]}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="location-outline" size={20} color="#1E88E5" />
            <Text
              style={[
                styles.settingText,
                darkModeEnabled && { color: "#FFFFFF" },
              ]}
            >
              Location Services
            </Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={handleLocationToggle}
          />
        </View>

        <View
          style={[
            styles.settingCard,
            darkModeEnabled && { backgroundColor: "#1E293B" },
          ]}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="moon-outline" size={20} color="#1E88E5" />
            <Text
              style={[
                styles.settingText,
                darkModeEnabled && { color: "#FFFFFF" },
              ]}
            >
              Dark Mode
            </Text>
          </View>
          <Switch value={darkModeEnabled} onValueChange={setDarkModeEnabled} />
        </View>

        <Text
          style={[styles.groupTitle, darkModeEnabled && { color: "#FFFFFF" }]}
        >
          Preparedness Tools
        </Text>

        <TouchableOpacity
          style={[
            styles.resetCard,
            darkModeEnabled && { backgroundColor: "#3B1F1F" },
          ]}
          onPress={handleResetProgress}
          activeOpacity={0.85}
        >
          <View style={styles.resetLeft}>
            <View style={styles.resetIconWrap}>
              <Ionicons name="refresh-outline" size={20} color="#EF4444" />
            </View>

            <View style={styles.resetTextWrap}>
              <Text
                style={[
                  styles.resetTitle,
                  darkModeEnabled && { color: "#FFFFFF" },
                ]}
              >
                Reset Progress
              </Text>
              <Text
                style={[
                  styles.resetSubtitle,
                  darkModeEnabled && { color: "#CBD5E1" },
                ]}
              >
                Clear completed tasks and restart your preparedness journey.
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <View
          style={[
            styles.tipCard,
            darkModeEnabled && { backgroundColor: "#3F2A14" },
          ]}
        >
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={20} color="#D97706" />
            <Text style={styles.tipTitle}>{profileStats.reminderTitle}</Text>
          </View>
          <Text
            style={[styles.tipText, darkModeEnabled && { color: "#FDE68A" }]}
          >
            {profileStats.reminderText}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            darkModeEnabled && { backgroundColor: "#DC2626" },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8FC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  headerCard: {
    backgroundColor: "#EAF4FF",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#1E88E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerTextWrap: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: "#475569",
  },
  emailText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 5,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1E88E5",
    borderRadius: 999,
  },
  progressHint: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    width: "31%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E88E5",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    marginLeft: 10,
  },
  resetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  resetLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  resetIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resetTextWrap: {
    flex: 1,
  },
  resetTitle: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    marginBottom: 4,
  },
  resetSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  tipCard: {
    marginTop: 8,
    backgroundColor: "#FFF7ED",
    borderRadius: 18,
    padding: 16,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9A3412",
    marginLeft: 8,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#7C2D12",
  },
  logoutButton: {
    marginTop: 18,
    backgroundColor: "#EF4444",
    borderRadius: 18,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
});
