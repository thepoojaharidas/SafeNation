import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import {
  fetchFloodAlerts,
  fetchPSI,
  fetchWeatherForecast,
} from "../services/alertsService";
import { getCurrentUser } from "../services/AuthService";
import { darkTheme, lightTheme } from "../theme/colors";

// keys used to store streak and daily mission progress in local storage
const PREP_STREAK_COUNT_KEY = "prep_streak_count";
const LAST_COMPLETION_DATE_KEY = "prep_last_completion";
const DAILY_MISSION_DATE_KEY = "daily_mission_date";
const DAILY_MISSION_COMPLETED_KEY = "daily_mission_completed";

// list of rotating daily missions with questions and answers
// used to keep users engaged and maintain streaks
const DAILY_MISSIONS = [
  {
    id: 101,
    title: "Quick Safety Check",
    question: "What is the most important item to include in an emergency kit?",
    options: ["Board games", "Water", "Perfume"],
    correctAnswer: "Water",
  },
  {
    id: 102,
    title: "Emergency Contacts Recall",
    question: "Who should be easy to contact during an emergency?",
    options: [
      "Only classmates",
      "Trusted family or close contacts",
      "Random neighbours only",
    ],
    correctAnswer: "Trusted family or close contacts",
  },
  {
    id: 103,
    title: "Flood Safety Check",
    question: "What should you do first during a flood warning?",
    options: [
      "Walk through floodwater",
      "Move to higher ground",
      "Ignore the alert",
    ],
    correctAnswer: "Move to higher ground",
  },
  {
    id: 104,
    title: "Haze Protection Reminder",
    question: "What is helpful during unhealthy haze conditions?",
    options: [
      "Stay outdoors longer",
      "Wear a proper mask and limit outdoor activity",
      "Exercise outside",
    ],
    correctAnswer: "Wear a proper mask and limit outdoor activity",
  },
  {
    id: 105,
    title: "Shelter Awareness",
    question: "Why should you know your nearest safe shelter in advance?",
    options: [
      "To save time during emergencies",
      "For fun trips",
      "So you can ignore alerts",
    ],
    correctAnswer: "To save time during emergencies",
  },
  {
    id: 106,
    title: "Disaster Readiness Review",
    question: "Why is preparedness important?",
    options: [
      "It reduces panic and improves response",
      "It makes disasters disappear",
      "It is only useful for schools",
    ],
    correctAnswer: "It reduces panic and improves response",
  },
];

export default function HomeScreen() {
  const navigation = useNavigation();

  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // store user info, streak, mission state, and live safety data
  const [userName, setUserName] = useState("");
  const [preparednessStreak, setPreparednessStreak] = useState(0);
  const [dailyMissionCompleted, setDailyMissionCompleted] = useState(false);
  const [missionModalVisible, setMissionModalVisible] = useState(false);
  const [missionFeedback, setMissionFeedback] = useState("");

  // store live data for weather, PSI, and flood alerts
  const [liveStatus, setLiveStatus] = useState({
    weather: {
      value: "Loading...",
      badge: "Updating",
      badgeColor: "#1E88E5",
      badgeBg: "#E8F2FD",
    },
    psi: {
      value: "--",
      badge: "Updating",
      badgeColor: "#F59E0B",
      badgeBg: "#FFF4E5",
    },
    flood: {
      value: "Checking...",
      badge: "Updating",
      badgeColor: "#43A047",
      badgeBg: "#EAF7EE",
    },
  });

  // generate a unique key per user to avoid overwriting shared data
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

  // attach user-specific scope to storage keys
  const getScopedKey = async (baseKey) => {
    const scope = await getUserScope();
    return `${baseKey}_${scope}`;
  };

  // get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  // rotate daily missions based on current date
  const getDailyMission = () => {
    const dayIndex = (new Date().getDate() - 1) % DAILY_MISSIONS.length;
    return DAILY_MISSIONS[dayIndex];
  };

  // fetch current user details from auth service
  const loadUser = async () => {
    try {
      const user = await getCurrentUser();
      setUserName(user?.name || "");
    } catch (error) {
      console.log("User load error:", error);
      setUserName("");
    }
  };

  // load saved preparedness streak from storage
  const loadPreparednessStreak = async () => {
    try {
      const scopedStreakKey = await getScopedKey(PREP_STREAK_COUNT_KEY);
      const savedStreak = await AsyncStorage.getItem(scopedStreakKey);
      setPreparednessStreak(savedStreak ? parseInt(savedStreak, 10) : 0);
    } catch (error) {
      console.log("Preparedness streak load error:", error);
      setPreparednessStreak(0);
    }
  };

  // update streak based on last completion date
  const updatePreparednessStreak = async () => {
    try {
      const today = getTodayString();
      const scopedStreakKey = await getScopedKey(PREP_STREAK_COUNT_KEY);
      const scopedLastCompletionKey = await getScopedKey(
        LAST_COMPLETION_DATE_KEY,
      );

      const lastDate = await AsyncStorage.getItem(scopedLastCompletionKey);
      const savedCount = await AsyncStorage.getItem(scopedStreakKey);
      const count = savedCount ? parseInt(savedCount, 10) : 0;

      let newCount = 1;

      if (lastDate) {
        const diff =
          (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);

        if (diff === 1) {
          newCount = count + 1;
        } else if (diff === 0) {
          newCount = count;
        } else {
          newCount = 1;
        }
      }

      await AsyncStorage.setItem(scopedStreakKey, String(newCount));
      await AsyncStorage.setItem(scopedLastCompletionKey, today);
      setPreparednessStreak(newCount);
    } catch (error) {
      console.log("Preparedness streak update error:", error);
    }
  };

  // check if today's mission has already been completed
  const loadDailyMissionStatus = async () => {
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

      if (savedDate === today && savedCompleted === "true") {
        setDailyMissionCompleted(true);
      } else {
        setDailyMissionCompleted(false);
        await AsyncStorage.setItem(scopedMissionDateKey, today);
        await AsyncStorage.setItem(scopedMissionCompletedKey, "false");
      }
    } catch (error) {
      console.log("Daily mission status load error:", error);
      setDailyMissionCompleted(false);
    }
  };

  // mark today's mission as completed in storage
  const markDailyMissionCompleted = async () => {
    try {
      const today = getTodayString();
      const scopedMissionDateKey = await getScopedKey(DAILY_MISSION_DATE_KEY);
      const scopedMissionCompletedKey = await getScopedKey(
        DAILY_MISSION_COMPLETED_KEY,
      );

      await AsyncStorage.setItem(scopedMissionDateKey, today);
      await AsyncStorage.setItem(scopedMissionCompletedKey, "true");
      setDailyMissionCompleted(true);
    } catch (error) {
      console.log("Daily mission complete error:", error);
    }
  };

  // validate user answer and update streak if correct
  const handleDailyMissionAnswer = async (selectedOption) => {
    const dailyMission = getDailyMission();

    if (!dailyMission || dailyMissionCompleted) return;

    if (selectedOption === dailyMission.correctAnswer) {
      setMissionFeedback("Correct! Ready streak updated.");
      await markDailyMissionCompleted();
      await updatePreparednessStreak();

      setTimeout(() => {
        setMissionModalVisible(false);
        setMissionFeedback("");
      }, 900);
    } else {
      setMissionFeedback("Not quite. Try again.");
    }
  };

  // find most common weather forecast from API data
  const getMostCommonForecast = (forecasts = []) => {
    if (!Array.isArray(forecasts) || forecasts.length === 0) {
      return "Unavailable";
    }

    const counts = forecasts.reduce((acc, item) => {
      const label = item?.forecast?.trim();
      if (!label) return acc;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "Unavailable";
  };

  // extract national or highest regional PSI reading
  const getNationalPsiReading = (psiItem) => {
    const twentyFourHourly = psiItem?.readings?.psi_twenty_four_hourly;
    if (!twentyFourHourly) return null;

    if (
      twentyFourHourly.national !== undefined &&
      twentyFourHourly.national !== null
    ) {
      return twentyFourHourly.national;
    }

    const regionalValues = ["west", "east", "central", "north", "south"]
      .map((region) => twentyFourHourly?.[region])
      .filter((value) => value !== undefined && value !== null);

    if (regionalValues.length === 0) return null;

    return Math.max(...regionalValues);
  };

  // fetch weather, PSI, and flood alerts and update UI
  const loadLiveSafetyStatus = async () => {
    try {
      const [weatherData, psiData, floodData] = await Promise.all([
        fetchWeatherForecast(),
        fetchPSI(),
        fetchFloodAlerts(),
      ]);

      const weatherForecasts =
        weatherData?.data?.items?.[0]?.forecasts ||
        weatherData?.items?.[0]?.forecasts ||
        [];

      const weatherValue = getMostCommonForecast(weatherForecasts);

      let psiValue = "N/A";
      let psiBadge = "Unavailable";
      let psiBadgeColor = colors.textSecondary;
      let psiBadgeBg = colors.cardMuted;

      const psiItem = psiData?.data?.items?.[0] || psiData?.items?.[0];
      const psiReading = getNationalPsiReading(psiItem);

      if (psiReading !== undefined && psiReading !== null) {
        psiValue = String(psiReading);

        if (psiReading <= 50) {
          psiBadge = "Good";
          psiBadgeColor = colors.success;
          psiBadgeBg = colors.successSoft;
        } else if (psiReading <= 100) {
          psiBadge = "Moderate";
          psiBadgeColor = colors.warning;
          psiBadgeBg = colors.warningSoft;
        } else if (psiReading <= 200) {
          psiBadge = "Unhealthy";
          psiBadgeColor = colors.danger;
          psiBadgeBg = colors.dangerSoft;
        } else {
          psiBadge = "Hazardous";
          psiBadgeColor = colors.purple;
          psiBadgeBg = colors.purpleSoft;
        }
      }

      let floodValue = "Low Risk";
      let floodBadge = "Clear";
      let floodBadgeColor = colors.success;
      let floodBadgeBg = colors.successSoft;

      const floodItems =
        floodData?.data?.items || floodData?.items || floodData?.data || [];

      const cleanedFloodItems = Array.isArray(floodItems) ? floodItems : [];

      if (cleanedFloodItems.length > 0) {
        floodValue = `${cleanedFloodItems.length} Alert${
          cleanedFloodItems.length > 1 ? "s" : ""
        }`;
        floodBadge = "Active";
        floodBadgeColor = colors.danger;
        floodBadgeBg = colors.dangerSoft;
      }

      setLiveStatus({
        weather: {
          value: weatherValue,
          badge: "Live",
          badgeColor: colors.primary,
          badgeBg: colors.primarySoft,
        },
        psi: {
          value: psiValue,
          badge: psiBadge,
          badgeColor: psiBadgeColor,
          badgeBg: psiBadgeBg,
        },
        flood: {
          value: floodValue,
          badge: floodBadge,
          badgeColor: floodBadgeColor,
          badgeBg: floodBadgeBg,
        },
      });
    } catch (error) {
      console.log("Live safety status error:", error);

      setLiveStatus({
        weather: {
          value: "Unavailable",
          badge: "Offline",
          badgeColor: colors.textSecondary,
          badgeBg: colors.cardMuted,
        },
        psi: {
          value: "N/A",
          badge: "Offline",
          badgeColor: colors.textSecondary,
          badgeBg: colors.cardMuted,
        },
        flood: {
          value: "Unknown",
          badge: "Offline",
          badgeColor: colors.textSecondary,
          badgeBg: colors.cardMuted,
        },
      });
    }
  };

  // reload data whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadPreparednessStreak();
      loadDailyMissionStatus();
      loadLiveSafetyStatus();
    }, []),
  );

  // navigation shortcuts for key safety guides
  const quickGuides = [
    {
      id: 1,
      title: "Emergency Contacts",
      icon: "call-outline",
      color: colors.danger,
      screen: "EmergencyContacts",
    },
    {
      id: 2,
      title: "Evacuation Guide",
      icon: "walk-outline",
      color: colors.warning,
      screen: "EvacuationGuide",
    },
    {
      id: 3,
      title: "First Aid Basics",
      icon: "medkit-outline",
      color: "#DB2777",
      screen: "FirstAidBasics",
    },
    {
      id: 4,
      title: "Emergency Kit",
      icon: "bag-handle-outline",
      color: colors.success,
      screen: "EmergencyKit",
    },
  ];

  const dailyMission = getDailyMission();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.secondaryBackground }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.secondaryBackground },
        ]}
      >
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.primary }]}>
              Hello, {userName ? userName : "User"} 👋
            </Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
              Stay prepared and stay safe.
            </Text>
          </View>

          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#fff" />
            <Text style={styles.streakText}>
              {preparednessStreak}-Day Ready Streak
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Live Safety Status
          </Text>

          <View style={styles.statusRow}>
            <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statusIconWrap,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Ionicons
                  name="rainy-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text
                style={[styles.statusLabel, { color: colors.textSecondary }]}
              >
                Weather
              </Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {liveStatus.weather.value}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: liveStatus.weather.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: liveStatus.weather.badgeColor },
                  ]}
                >
                  {liveStatus.weather.badge}
                </Text>
              </View>
            </View>

            <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statusIconWrap,
                  { backgroundColor: colors.warningSoft },
                ]}
              >
                <Ionicons
                  name="cloudy-outline"
                  size={22}
                  color={colors.warning}
                />
              </View>
              <Text
                style={[styles.statusLabel, { color: colors.textSecondary }]}
              >
                PSI
              </Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {liveStatus.psi.value}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: liveStatus.psi.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: liveStatus.psi.badgeColor },
                  ]}
                >
                  {liveStatus.psi.badge}
                </Text>
              </View>
            </View>

            <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statusIconWrap,
                  { backgroundColor: colors.dangerSoft },
                ]}
              >
                <Ionicons
                  name="water-outline"
                  size={22}
                  color={colors.danger}
                />
              </View>
              <Text
                style={[styles.statusLabel, { color: colors.textSecondary }]}
              >
                Flood
              </Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {liveStatus.flood.value}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: liveStatus.flood.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: liveStatus.flood.badgeColor },
                  ]}
                >
                  {liveStatus.flood.badge}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Guides
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.guidesRow}
          >
            {quickGuides.map((guide) => (
              <TouchableOpacity
                key={guide.id}
                style={[styles.guideCard, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate(guide.screen)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.guideIconWrap,
                    { backgroundColor: `${guide.color}22` },
                  ]}
                >
                  <Ionicons name={guide.icon} size={28} color={guide.color} />
                </View>
                <Text style={[styles.guideTitle, { color: colors.text }]}>
                  {guide.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today’s Mission
          </Text>

          <View style={[styles.missionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.missionTitle, { color: colors.text }]}>
              {dailyMission?.title}
            </Text>
            <Text style={[styles.missionText, { color: colors.textSecondary }]}>
              Complete today’s quick safety check to keep your ready streak
              going.
            </Text>

            <View style={styles.missionFooter}>
              <View style={styles.missionRewardBadge}>
                <Ionicons name="flame" size={14} color="#fff" />
                <Text style={styles.missionRewardText}>Streak</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.missionButton,
                  dailyMissionCompleted && styles.missionButtonCompleted,
                ]}
                disabled={dailyMissionCompleted}
                onPress={() => {
                  setMissionFeedback("");
                  setMissionModalVisible(true);
                }}
              >
                <Text style={styles.missionButtonText}>
                  {dailyMissionCompleted ? "Completed" : "Start"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={missionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMissionModalVisible(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[styles.missionModalCard, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.missionModalTitle, { color: colors.text }]}>
              {dailyMission?.title}
            </Text>
            <Text
              style={[
                styles.missionModalQuestion,
                { color: colors.textSecondary },
              ]}
            >
              {dailyMission?.question}
            </Text>

            <View style={styles.missionOptionsWrap}>
              {dailyMission?.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.missionOptionButton,
                    {
                      backgroundColor: colors.cardSoft,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleDailyMissionAnswer(option)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.missionOptionText, { color: colors.text }]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!!missionFeedback && (
              <Text
                style={[
                  styles.missionFeedback,
                  {
                    color: dailyMissionCompleted
                      ? colors.success
                      : colors.danger,
                  },
                ]}
              >
                {missionFeedback}
              </Text>
            )}

            {!dailyMissionCompleted && (
              <TouchableOpacity
                style={styles.missionCloseButton}
                onPress={() => {
                  setMissionModalVisible(false);
                  setMissionFeedback("");
                }}
              >
                <Text style={styles.missionCloseButtonText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    marginBottom: 14,
  },
  streakBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  streakText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusCard: {
    width: "31.5%",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  statusBadge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  guidesRow: {
    paddingRight: 8,
  },
  guideCard: {
    width: 130,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    paddingBottom: 6,
  },
  guideIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  missionCard: {
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  missionText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  missionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  missionRewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  missionRewardText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  missionButton: {
    backgroundColor: "#1E88E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  missionButtonCompleted: {
    backgroundColor: "#43A047",
  },
  missionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  missionModalCard: {
    width: "100%",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  missionModalTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  missionModalQuestion: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 18,
  },
  missionOptionsWrap: {
    marginBottom: 14,
  },
  missionOptionButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  missionOptionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  missionFeedback: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  missionCloseButton: {
    alignSelf: "center",
    backgroundColor: "#1E88E5",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  missionCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
