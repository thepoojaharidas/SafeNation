import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getCurrentUser } from "./AuthService";

// keys used to store notification preferences and scheduled IDs
export const NOTIFICATIONS_ENABLED_KEY = "notifications_enabled";

const DAILY_REMINDER_NOTIFICATION_ID_KEY = "daily_reminder_notification_id";
const STREAK_WARNING_NOTIFICATION_ID_KEY = "streak_warning_notification_id";

// keys used to track daily mission completion status
const DAILY_MISSION_DATE_KEY = "daily_mission_date";
const DAILY_MISSION_COMPLETED_KEY = "daily_mission_completed";

// scheduled times for daily reminder and streak warning
const DAILY_REMINDER_HOUR = 20; // 8:00 PM
const STREAK_WARNING_HOUR = 22; // 10:00 PM

// get today's date string for tracking daily missions
const getTodayString = () => {
  return new Date().toISOString().split("T")[0];
};

// generate user-specific identifier for scoped storage
const getUserScope = async () => {
  try {
    const user = await getCurrentUser();
    return (
      user?.email?.trim().toLowerCase() ||
      user?.name?.trim().toLowerCase().replace(/\s+/g, "_") ||
      "guest"
    );
  } catch (error) {
    return "guest";
  }
};

// attach user scope to storage keys
const getScopedKey = async (baseKey) => {
  const scope = await getUserScope();
  return `${baseKey}_${scope}`;
};

// configure notification channel for Android devices
export const setupNotificationChannel = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1E88E5",
    });
  }
};

// request notification permission from user
export const requestNotificationPermission = async () => {
  await setupNotificationChannel();

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;

  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  return finalStatus === "granted";
};

// retrieve whether notifications are enabled
export const getNotificationsEnabled = async () => {
  try {
    const saved = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return saved === "true";
  } catch (error) {
    console.log("Error loading notifications preference:", error);
    return false;
  }
};

// store notification enabled/disabled preference
const setNotificationsEnabledPreference = async (value) => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATIONS_ENABLED_KEY,
      value ? "true" : "false",
    );
  } catch (error) {
    console.log("Error saving notifications preference:", error);
  }
};

// cancel scheduled notification using stored ID
const cancelScheduledByStorageKey = async (storageKey) => {
  try {
    const notificationId = await AsyncStorage.getItem(storageKey);

    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(storageKey);
    }
  } catch (error) {
    console.log("Error cancelling scheduled notification:", error);
  }
};

// cancel daily reminder and streak warning notifications
export const cancelDailyMissionReminder = async () => {
  await cancelScheduledByStorageKey(DAILY_REMINDER_NOTIFICATION_ID_KEY);
};

export const cancelTodayStreakWarning = async () => {
  await cancelScheduledByStorageKey(STREAK_WARNING_NOTIFICATION_ID_KEY);
};

// schedule daily mission reminder at fixed time
export const scheduleDailyMissionReminder = async () => {
  try {
    await cancelDailyMissionReminder();
    await setupNotificationChannel();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "SafeNation reminder",
        body: "Your daily mission is waiting. Keep your ready streak alive.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: DAILY_REMINDER_HOUR,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(
      DAILY_REMINDER_NOTIFICATION_ID_KEY,
      notificationId,
    );
  } catch (error) {
    console.log("Error scheduling daily reminder:", error);
  }
};

// check if today's mission has been completed
export const getMissionCompletedToday = async () => {
  try {
    const today = getTodayString();
    const scopedMissionDateKey = await getScopedKey(DAILY_MISSION_DATE_KEY);
    const scopedMissionCompletedKey = await getScopedKey(
      DAILY_MISSION_COMPLETED_KEY,
    );

    const savedDate = await AsyncStorage.getItem(scopedMissionDateKey);
    const savedCompleted = await AsyncStorage.getItem(
      scopedMissionCompletedKey,
    );

    return savedDate === today && savedCompleted === "true";
  } catch (error) {
    console.log("Error reading daily mission status:", error);
    return false;
  }
};

// schedule warning if user has not completed today's mission
export const scheduleTodayStreakWarning = async () => {
  try {
    await cancelTodayStreakWarning();
    await setupNotificationChannel();

    const missionCompleted = await getMissionCompletedToday();
    if (missionCompleted) {
      return;
    }

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(STREAK_WARNING_HOUR, 0, 0, 0);

    if (triggerDate <= now) {
      return;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Ready streak reminder",
        body: "You still have not completed today’s mission. Finish it tonight to protect your streak.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    await AsyncStorage.setItem(
      STREAK_WARNING_NOTIFICATION_ID_KEY,
      notificationId,
    );
  } catch (error) {
    console.log("Error scheduling streak warning:", error);
  }
};

// enable notifications and schedule reminders
export const enableSafetyReminders = async () => {
  const granted = await requestNotificationPermission();

  if (!granted) {
    return false;
  }

  await setNotificationsEnabledPreference(true);
  await scheduleDailyMissionReminder();
  await scheduleTodayStreakWarning();

  return true;
};

// disable notifications and cancel all reminders
export const disableSafetyReminders = async () => {
  await setNotificationsEnabledPreference(false);
  await cancelDailyMissionReminder();
  await cancelTodayStreakWarning();
};

// update streak warning based on today's mission status
export const refreshStreakWarningForToday = async () => {
  const enabled = await getNotificationsEnabled();

  if (!enabled) {
    return;
  }

  const missionCompleted = await getMissionCompletedToday();

  if (missionCompleted) {
    await cancelTodayStreakWarning();
  } else {
    await scheduleTodayStreakWarning();
  }
};

// trigger a test notification for debugging
export const scheduleTestNotification = async () => {
  try {
    await setupNotificationChannel();

    const granted = await requestNotificationPermission();
    if (!granted) {
      console.log("Notification permission not granted");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "SafeNation test",
        body: "Notifications are working.",
        sound: true,
      },
      trigger: null,
    });

    console.log("Test notification scheduled");
  } catch (error) {
    console.log("Test notification error:", error);
  }
};

// check PSI and flood data and notify user if thresholds are exceeded
export const checkAndNotifyEnvironmentalAlerts = async () => {
  try {
    const enabled = await getNotificationsEnabled();
    if (!enabled) return;

    const granted = await requestNotificationPermission();
    if (!granted) return;

    await setupNotificationChannel();

    const [psiData, floodData] = await Promise.all([
      fetch("https://api-open.data.gov.sg/v2/real-time/api/psi")
        .then((r) => r.json())
        .catch(() => null),
      fetch(
        "https://api-open.data.gov.sg/v2/real-time/api/weather/flood-alerts",
      )
        .then((r) => r.json())
        .catch(() => null),
    ]);

    const psiItem = psiData?.data?.items?.[0] || psiData?.items?.[0];
    const twentyFourHourly = psiItem?.readings?.psi_twenty_four_hourly;
    const psiValue =
      twentyFourHourly?.national ??
      Math.max(
        ...["west", "east", "central", "north", "south"]
          .map((r) => twentyFourHourly?.[r])
          .filter((v) => v !== undefined && v !== null),
      );

    const floodItems =
      floodData?.data?.items || floodData?.items || floodData?.data || [];
    const floodActive = Array.isArray(floodItems) && floodItems.length > 0;

    const alerts = [];

    if (psiValue && psiValue > 100) {
      alerts.push({
        title: "Unhealthy Air Quality Alert",
        body: `PSI has reached ${psiValue}. Limit outdoor activity and wear a mask if necessary.`,
      });
    }

    if (floodActive) {
      alerts.push({
        title: "Flash Flood Alert",
        body: `Active flash flood warnings detected in Singapore. Avoid low-lying areas and move to higher ground if needed.`,
      });
    }

    for (const alert of alerts) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.body,
          sound: true,
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.log("Environmental alert check error:", error);
  }
};
