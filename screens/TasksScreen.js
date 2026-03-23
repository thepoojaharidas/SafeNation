import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useAppSettings } from "../context/AppSettingsContext";
import { getCurrentUser } from "../services/AuthService";
import { darkTheme, lightTheme } from "../theme/colors";

import {
  cancelTodayStreakWarning,
  refreshStreakWarningForToday,
} from "../services/notificationService";

// keys used to store tasks, streak, and daily mission data
const STORAGE_KEY = "preparedness_tasks";
const STREAK_COUNT_KEY = "prep_streak_count";
const LAST_COMPLETION_DATE_KEY = "prep_last_completion";
const DAILY_MISSION_DATE_KEY = "daily_mission_date";
const DAILY_MISSION_COMPLETED_KEY = "daily_mission_completed";

// default list of missions shown in the tasks section
const BASE_TASKS = [
  {
    id: 1,
    title: "Prepare an emergency kit",
    points: 20,
    completed: false,
    type: "Mini Game",
    duration: "2 min",
    icon: "bag-handle-outline",
  },
  {
    id: 2,
    title: "Save emergency contact numbers",
    points: 10,
    completed: false,
    type: "Quick Task",
    duration: "1 min",
    icon: "call-outline",
  },
  {
    id: 3,
    title: "Learn flood safety steps",
    points: 15,
    completed: false,
    type: "Sequence Game",
    duration: "2 min",
    icon: "water-outline",
  },
  {
    id: 4,
    title: "Review haze protection guide",
    points: 15,
    completed: false,
    type: "Scenario",
    duration: "2 min",
    icon: "cloud-outline",
  },
  {
    id: 5,
    title: "Locate nearest shelter",
    points: 20,
    completed: false,
    type: "Map Task",
    duration: "2 min",
    icon: "location-outline",
  },
  {
    id: 6,
    title: "Complete the disaster quiz",
    points: 25,
    completed: false,
    type: "Quiz",
    duration: "3 min",
    icon: "help-circle-outline",
  },
];

// rotating daily missions to maintain streak engagement
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

export default function TasksScreen({ navigation, route }) {
  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // store tasks, UI states, streak, and mission status
  const [tasks, setTasks] = useState(BASE_TASKS);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [preparednessStreak, setPreparednessStreak] = useState(0);
  const [dailyMissionCompleted, setDailyMissionCompleted] = useState(false);
  const [missionModalVisible, setMissionModalVisible] = useState(false);
  const [missionFeedback, setMissionFeedback] = useState("");

  // generate unique user scope to isolate stored data
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

  // get today's date string for streak and mission tracking
  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  // select a daily mission based on current date
  const getDailyMission = () => {
    const dayIndex = (new Date().getDate() - 1) % DAILY_MISSIONS.length;
    return DAILY_MISSIONS[dayIndex];
  };

  // persist updated tasks into local storage
  const saveTasks = async (updatedTasks) => {
    try {
      const scopedStorageKey = await getScopedKey(STORAGE_KEY);
      await AsyncStorage.setItem(
        scopedStorageKey,
        JSON.stringify(updatedTasks),
      );
    } catch (error) {
      console.log("Error saving tasks:", error);
    }
  };

  // merge saved task data with base structure
  const hydrateTasks = (savedTasks = []) => {
    return BASE_TASKS.map((baseTask) => {
      const savedTask = savedTasks.find((task) => task.id === baseTask.id);
      return savedTask ? { ...baseTask, ...savedTask } : baseTask;
    });
  };

  // load tasks from storage and sync with base tasks
  const loadTasks = async () => {
    try {
      const scopedStorageKey = await getScopedKey(STORAGE_KEY);
      const savedTasks = await AsyncStorage.getItem(scopedStorageKey);

      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        const mergedTasks = hydrateTasks(parsedTasks);

        setTasks(mergedTasks);
        await AsyncStorage.setItem(
          scopedStorageKey,
          JSON.stringify(mergedTasks),
        );
      } else {
        setTasks(BASE_TASKS);
      }
    } catch (error) {
      console.log("Error loading tasks:", error);
      setTasks(BASE_TASKS);
    }
  };

  // retrieve preparedness streak from storage
  const loadPreparednessStreak = async () => {
    try {
      const scopedStreakKey = await getScopedKey(STREAK_COUNT_KEY);
      const savedStreak = await AsyncStorage.getItem(scopedStreakKey);

      if (savedStreak !== null) {
        setPreparednessStreak(parseInt(savedStreak, 10));
      } else {
        setPreparednessStreak(0);
      }
    } catch (error) {
      console.log("Error loading streak:", error);
      setPreparednessStreak(0);
    }
  };

  // update streak based on last completion date
  const updatePreparednessStreak = async () => {
    try {
      const today = getTodayString();
      const scopedStreakKey = await getScopedKey(STREAK_COUNT_KEY);
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
      console.log("Streak update error:", error);
    }
  };

  // check if today's mission has been completed
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
      console.log("Error loading daily mission status:", error);
      setDailyMissionCompleted(false);
    }
  };

  // mark today's mission as completed
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
      console.log("Error marking daily mission completed:", error);
    }
  };

  // validate answer and update streak/feedback
  const handleDailyMissionAnswer = async (selectedOption) => {
    const dailyMission = getDailyMission();

    if (!dailyMission || dailyMissionCompleted) return;

    if (selectedOption === dailyMission.correctAnswer) {
      setMissionFeedback("Correct! Ready streak updated.");
      await markDailyMissionCompleted();
      await updatePreparednessStreak();
      await cancelTodayStreakWarning();

      setTimeout(() => {
        setMissionModalVisible(false);
        setMissionFeedback("");
      }, 900);
    } else {
      setMissionFeedback("Not quite. Try again.");
    }
  };

  // reload tasks, streak, and notifications on screen focus
  useFocusEffect(
    useCallback(() => {
      const loadScreenData = async () => {
        await loadTasks();
        await loadPreparednessStreak();
        await loadDailyMissionStatus();
        await refreshStreakWarningForToday();
      };

      loadScreenData();
    }, []),
  );

  // update task completion when returning from game screens
  useEffect(() => {
    const completedTaskId = route?.params?.completedTaskId;
    if (!completedTaskId) return;

    const applyCompletedTask = async () => {
      try {
        const scopedStorageKey = await getScopedKey(STORAGE_KEY);
        const savedTasks = await AsyncStorage.getItem(scopedStorageKey);
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        const currentTasks = hydrateTasks(parsedTasks);

        const updatedTasks = currentTasks.map((task) =>
          task.id === completedTaskId ? { ...task, completed: true } : task,
        );

        setTasks(updatedTasks);
        await saveTasks(updatedTasks);
        await loadPreparednessStreak();
      } catch (error) {
        console.log("Error applying completed task:", error);
      } finally {
        navigation.setParams({ completedTaskId: undefined });
      }
    };
    applyCompletedTask();
  }, [route?.params?.completedTaskId, navigation]);

  // manually toggle task completion (fallback)
  const toggleTask = async (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    );

    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  // calculate completion stats and readiness percentage
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const readinessPercent = Math.round((completedTasks / totalTasks) * 100);

  // compute SVG circle progress values
  const circleSize = 130;
  const strokeWidth = 10;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset =
    circumference - (readinessPercent / 100) * circumference;

  // calculate total points and XP progress
  const totalPoints = tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.points, 0);

  const nextLevelTarget = 60;
  const xpProgress = Math.min((totalPoints / nextLevelTarget) * 100, 100);

  const task1Done = tasks.find((task) => task.id === 1)?.completed ?? false;
  const task2Done = tasks.find((task) => task.id === 2)?.completed ?? false;
  const task3Done = tasks.find((task) => task.id === 3)?.completed ?? false;
  const task4Done = tasks.find((task) => task.id === 4)?.completed ?? false;
  const task5Done = tasks.find((task) => task.id === 5)?.completed ?? false;
  const task6Done = tasks.find((task) => task.id === 6)?.completed ?? false;

  // determine user level based on points
  const getLevelData = (points) => {
    if (points >= 80) {
      return { level: 5, title: "Preparedness Pro" };
    }
    if (points >= 60) {
      return { level: 4, title: "Response Ready" };
    }
    if (points >= 40) {
      return { level: 3, title: "Safety Citizen" };
    }
    if (points >= 20) {
      return { level: 2, title: "Prepared Starter" };
    }
    return { level: 1, title: "Safety Beginner" };
  };

  const levelData = getLevelData(totalPoints);
  const dailyMission = getDailyMission();

  const completedGuideCount = tasks.filter(
    (task) => [1, 3, 4, 5].includes(task.id) && task.completed,
  ).length;

  const quizTask = tasks.find((task) => task.id === 6);
  const quizStatus = quizTask?.completed ? "Done" : "Not Done";

  // define progress, skill, and mastery achievements
  const progressAchievements = [
    {
      id: 1,
      title: "First Step",
      subtitle: "Completed your first mission",
      lockedText: "Complete 1 mission to unlock",
      icon: "footsteps-outline",
      color: darkModeEnabled ? colors.success : "#43A047",
      bg: darkModeEnabled ? colors.successSoft : "#E8F5E9",
      unlocked: completedTasks >= 1,
    },
    {
      id: 2,
      title: "Prepared Starter",
      subtitle: "Completed 3 missions",
      lockedText: "Complete 3 missions to unlock",
      icon: "shield-checkmark-outline",
      color: colors.primary,
      bg: colors.primarySoft,
      unlocked: completedTasks >= 3,
    },
    {
      id: 3,
      title: "Halfway Ready",
      subtitle: "Completed 4 missions",
      lockedText: "Complete 4 missions to unlock",
      icon: "stats-chart-outline",
      color: colors.purple,
      bg: colors.purpleSoft,
      unlocked: completedTasks >= 4,
    },
    {
      id: 4,
      title: "Fully Prepared",
      subtitle: "Completed all 6 missions",
      lockedText: "Complete all 6 missions to unlock",
      icon: "trophy-outline",
      color: colors.warning,
      bg: colors.warningSoft,
      unlocked: completedTasks === totalTasks && totalTasks > 0,
    },
  ];

  const skillAchievements = [
    {
      id: 5,
      title: "Kit Keeper",
      subtitle: "Completed the emergency kit mission",
      lockedText: "Finish the emergency kit mission",
      icon: "bag-handle-outline",
      color: "#F97316",
      bg: darkModeEnabled ? "#4A2D10" : "#FFF7ED",
      unlocked: task1Done,
    },
    {
      id: 6,
      title: "Contact Keeper",
      subtitle: "Completed the emergency contacts mission",
      lockedText: "Finish the contacts mission",
      icon: "call-outline",
      color: "#0284C7",
      bg: darkModeEnabled ? "#163247" : "#E0F2FE",
      unlocked: task2Done,
    },
    {
      id: 7,
      title: "Flood Ready",
      subtitle: "Completed flood safety training",
      lockedText: "Finish the flood safety mission",
      icon: "water-outline",
      color: "#0288D1",
      bg: darkModeEnabled ? "#143244" : "#E0F7FA",
      unlocked: task3Done,
    },
    {
      id: 8,
      title: "Haze Aware",
      subtitle: "Completed haze safety training",
      lockedText: "Finish the haze safety mission",
      icon: "cloud-outline",
      color: darkModeEnabled ? colors.textSecondary : "#64748B",
      bg: darkModeEnabled ? colors.cardMuted : "#F1F5F9",
      unlocked: task4Done,
    },
    {
      id: 9,
      title: "Shelter Scout",
      subtitle: "Found the nearest safe shelter",
      lockedText: "Finish the shelter mission",
      icon: "location-outline",
      color: colors.danger,
      bg: colors.dangerSoft,
      unlocked: task5Done,
    },
  ];

  const masteryAchievements = [
    {
      id: 10,
      title: "Quiz Champion",
      subtitle: "Completed the final disaster quiz",
      lockedText: "Finish the disaster quiz",
      icon: "school-outline",
      color: colors.purple,
      bg: colors.purpleSoft,
      unlocked: task6Done,
    },
  ];

  const allAchievements = [
    ...progressAchievements,
    ...skillAchievements,
    ...masteryAchievements,
  ];

  const unlockedCount = allAchievements.filter(
    (badge) => badge.unlocked,
  ).length;
  const lockedCount = allAchievements.length - unlockedCount;

  // render achievement badges in horizontal scroll
  const renderBadgeRow = (badges) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.badgesRow}
    >
      {badges.map((badge) => (
        <View
          key={badge.id}
          style={[
            badge.unlocked ? styles.badgeCard : styles.badgeCardLocked,
            {
              backgroundColor: badge.unlocked
                ? colors.cardSoft
                : colors.cardMuted,
              borderColor: badge.unlocked ? colors.border : colors.cardMuted,
            },
          ]}
        >
          <View
            style={[
              styles.badgeIconCircle,
              {
                backgroundColor: badge.unlocked ? badge.bg : colors.border,
              },
            ]}
          >
            <Ionicons
              name={badge.unlocked ? badge.icon : "lock-closed-outline"}
              size={24}
              color={badge.unlocked ? badge.color : colors.textMuted}
            />
          </View>

          <Text
            style={[
              badge.unlocked ? styles.badgeTitle : styles.badgeTitleLocked,
              { color: badge.unlocked ? colors.text : colors.textMuted },
            ]}
          >
            {badge.title}
          </Text>

          <Text
            style={[
              badge.unlocked
                ? styles.badgeSubtitle
                : styles.badgeSubtitleLocked,
              {
                color: badge.unlocked ? colors.textSecondary : colors.textMuted,
              },
            ]}
          >
            {badge.unlocked ? badge.subtitle : badge.lockedText}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>Preparedness Overview</Text>
              <Text style={styles.heroSubtitle}>
                Level {levelData.level} {levelData.title}
              </Text>
            </View>

            <View style={styles.levelBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#1E88E5" />
              <Text style={styles.levelBadgeText}>Lv {levelData.level}</Text>
            </View>
          </View>

          <View style={styles.heroChipsRow}>
            <View style={styles.streakChip}>
              <Ionicons name="flame" size={14} color="#fff" />
              <Text style={styles.heroChipText}>
                {preparednessStreak}-Day Ready Streak
              </Text>
            </View>

            <View style={styles.pointsChip}>
              <Ionicons name="star" size={14} color="#fff" />
              <Text style={styles.heroChipText}>{totalPoints} Points</Text>
            </View>
          </View>

          <View style={styles.xpBlock}>
            <View style={styles.xpHeaderRow}>
              <Text style={styles.xpLabel}>Safety XP</Text>
              <Text style={styles.xpValue}>
                {totalPoints}/{nextLevelTarget}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${xpProgress}%` }]}
              />
            </View>

            <Text style={styles.xpHint}>
              {nextLevelTarget - totalPoints > 0
                ? `${nextLevelTarget - totalPoints} more points to reach Level 4`
                : "Level up unlocked!"}
            </Text>
          </View>

          <View
            style={[
              styles.missionRow,
              { backgroundColor: darkModeEnabled ? colors.card : "#FFFFFF" },
            ]}
          >
            <View style={styles.missionLeft}>
              <Text
                style={[styles.missionLabel, { color: colors.textSecondary }]}
              >
                Today’s Mission
              </Text>
              <Text style={[styles.missionTask, { color: colors.text }]}>
                {dailyMission?.title}
              </Text>
              <Text
                style={[styles.missionSubtext, { color: colors.textSecondary }]}
              >
                Complete today’s quick safety check to keep your streak going.
              </Text>
            </View>

            <View style={styles.missionActionRow}>
              <View style={styles.missionRewardBadge}>
                <Ionicons name="flame" size={11} color="#fff" />
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

        <View style={[styles.readinessCard, { backgroundColor: colors.card }]}>
          <View style={styles.readinessHeader}>
            <View>
              <Text style={[styles.readinessTitle, { color: colors.text }]}>
                Safety Progress
              </Text>
              <Text
                style={[
                  styles.readinessSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {completedTasks} of {totalTasks} tasks completed
              </Text>
            </View>

            <View
              style={[
                styles.readinessPill,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name="shield-outline"
                size={14}
                color={colors.primary}
              />
              <Text
                style={[styles.readinessPillText, { color: colors.primary }]}
              >
                Ready
              </Text>
            </View>
          </View>

          <View style={styles.readinessCircleWrap}>
            <Svg width={circleSize} height={circleSize}>
              <Circle
                stroke={colors.border}
                fill="none"
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                strokeWidth={strokeWidth}
              />
              <Circle
                stroke={colors.primary}
                fill="none"
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
              />
            </Svg>

            <View
              style={[
                styles.readinessCircleInner,
                { backgroundColor: colors.background },
              ]}
            >
              <Text
                style={[styles.readinessPercentText, { color: colors.text }]}
              >
                {readinessPercent}%
              </Text>
              <Text
                style={[
                  styles.readinessSmallText,
                  { color: colors.textSecondary },
                ]}
              >
                Prepared
              </Text>
            </View>
          </View>

          <Text
            style={[styles.readinessCaption, { color: colors.textSecondary }]}
          >
            Complete {totalTasks - completedTasks} more tasks to grow your
            readiness.
          </Text>

          <View style={styles.compactStatsRow}>
            <View
              style={[
                styles.compactStatCard,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name="checkmark-done"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.compactStatNumber, { color: colors.text }]}>
                {completedTasks}/{totalTasks}
              </Text>
              <Text
                style={[
                  styles.compactStatLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Tasks
              </Text>
            </View>

            <View
              style={[
                styles.compactStatCard,
                { backgroundColor: colors.successSoft },
              ]}
            >
              <Ionicons name="book-outline" size={16} color={colors.success} />
              <Text style={[styles.compactStatNumber, { color: colors.text }]}>
                {completedGuideCount}
              </Text>
              <Text
                style={[
                  styles.compactStatLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Guides
              </Text>
            </View>

            <View
              style={[
                styles.compactStatCard,
                { backgroundColor: colors.warningSoft },
              ]}
            >
              <Ionicons
                name="trophy-outline"
                size={16}
                color={colors.warning}
              />
              <Text style={[styles.compactStatNumber, { color: colors.text }]}>
                {quizStatus}
              </Text>
              <Text
                style={[
                  styles.compactStatLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Quiz
              </Text>
            </View>

            <View
              style={[
                styles.compactStatCard,
                { backgroundColor: colors.purpleSoft },
              ]}
            >
              <Ionicons name="star-outline" size={16} color={colors.purple} />
              <Text style={[styles.compactStatNumber, { color: colors.text }]}>
                {totalPoints}
              </Text>
              <Text
                style={[
                  styles.compactStatLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Points
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setChecklistOpen(!checklistOpen)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeaderLeft}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: colors.background },
                ]}
              >
                <Ionicons
                  name="list-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Tasks
                </Text>
                <Text
                  style={[
                    styles.sectionSubheading,
                    { color: colors.textSecondary },
                  ]}
                >
                  {completedTasks} of {totalTasks} missions completed
                </Text>
              </View>
            </View>

            <Ionicons
              name={checklistOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>

          {checklistOpen && (
            <View style={styles.sectionContent}>
              {tasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskMissionCard,
                    {
                      backgroundColor: task.completed
                        ? colors.successSoft
                        : colors.cardSoft,
                      borderColor: task.completed
                        ? colors.success
                        : colors.borderSoft,
                    },
                  ]}
                  onPress={() => {
                    if (task.id === 1) {
                      navigation.navigate("EmergencyKitGame", {
                        alreadyCompleted: task.completed,
                      });
                      return;
                    }

                    if (task.id === 2) {
                      navigation.navigate("EmergencyContactsGame", {
                        alreadyCompleted: task.completed,
                      });
                      return;
                    }

                    if (task.id === 3) {
                      navigation.navigate("FloodSafetyGame", {
                        alreadyCompleted: task.completed,
                      });
                      return;
                    }

                    if (task.id === 4) {
                      navigation.navigate("HazeSafetyGame", {
                        alreadyCompleted: task.completed,
                      });
                      return;
                    }

                    if (task.id === 5) {
                      navigation.navigate("ShelterGame", {
                        alreadyCompleted: task.completed,
                      });
                      return;
                    }

                    if (task.id === 6) {
                      navigation.navigate("DisasterQuizGame", {
                        alreadyCompleted: task.completed,
                      });
                      return;
                    }

                    toggleTask(task.id);
                  }}
                  activeOpacity={0.88}
                >
                  <View style={styles.taskMissionLeft}>
                    <View
                      style={[
                        styles.taskMissionIconWrap,
                        {
                          backgroundColor: task.completed
                            ? colors.successSoft
                            : colors.primarySoft,
                        },
                      ]}
                    >
                      <Ionicons
                        name={task.icon}
                        size={22}
                        color={task.completed ? colors.success : colors.primary}
                      />
                    </View>

                    <View style={styles.taskMissionTextWrap}>
                      <Text
                        style={[
                          styles.taskMissionTitle,
                          {
                            color: task.completed
                              ? colors.success
                              : colors.text,
                          },
                        ]}
                      >
                        {task.title}
                      </Text>

                      <View style={styles.taskTagsRow}>
                        <View
                          style={[
                            styles.taskTag,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.taskTagText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {task.type}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.taskTag,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.taskTagText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {task.duration}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.taskTag,
                            styles.taskRewardTag,
                            {
                              borderColor: darkModeEnabled
                                ? "#7C5A11"
                                : "#FDE7B0",
                              backgroundColor: darkModeEnabled
                                ? "#3E3112"
                                : "#FFF9E8",
                            },
                          ]}
                        >
                          <Ionicons
                            name="star"
                            size={11}
                            color={colors.warning}
                          />
                          <Text
                            style={[
                              styles.taskRewardTagText,
                              {
                                color: darkModeEnabled ? "#FDE68A" : "#B45309",
                              },
                            ]}
                          >
                            +{task.points} XP
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.taskMissionRight}>
                    {task.completed ? (
                      <View
                        style={[
                          styles.doneBadge,
                          { backgroundColor: colors.successSoft },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={colors.success}
                        />
                        <Text
                          style={[
                            styles.doneBadgeText,
                            { color: colors.success },
                          ]}
                        >
                          Done
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.playBadge}>
                        <Text style={styles.playBadgeText}>Play</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setAchievementsOpen(!achievementsOpen)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeaderLeft}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: colors.background },
                ]}
              >
                <Ionicons
                  name="ribbon-outline"
                  size={18}
                  color={colors.warning}
                />
              </View>

              <View>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Achievements
                </Text>
                <Text
                  style={[
                    styles.sectionSubheading,
                    { color: colors.textSecondary },
                  ]}
                >
                  {unlockedCount} unlocked, {lockedCount} locked
                </Text>
              </View>
            </View>

            <Ionicons
              name={achievementsOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>

          {achievementsOpen && (
            <View style={styles.sectionContent}>
              <Text
                style={[styles.achievementGroupTitle, { color: colors.text }]}
              >
                Progress
              </Text>
              {renderBadgeRow(progressAchievements)}

              <Text
                style={[styles.achievementGroupTitle, { color: colors.text }]}
              >
                Skills
              </Text>
              {renderBadgeRow(skillAchievements)}

              <Text
                style={[styles.achievementGroupTitle, { color: colors.text }]}
              >
                Mastery
              </Text>
              {renderBadgeRow(masteryAchievements)}
            </View>
          )}
        </View>

        <View style={{ height: 0 }} />
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
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },

  heroCard: {
    backgroundColor: "#1E88E5",
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#1E88E5",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 30,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E88E5",
    marginLeft: 5,
  },

  heroChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 8,
  },
  pointsChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4DA3F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  heroChipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },

  xpBlock: {
    backgroundColor: "#ffffff24",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  xpHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  xpValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  progressTrack: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.24)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
  },
  xpHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },

  missionRow: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  missionLeft: {
    marginBottom: 10,
  },
  missionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  missionTask: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 4,
  },
  missionSubtext: {
    fontSize: 14,
    lineHeight: 18,
  },
  missionActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  missionRewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  missionRewardText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  missionButton: {
    backgroundColor: "#1E88E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  missionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  missionButtonCompleted: {
    backgroundColor: "#43A047",
  },

  readinessCard: {
    borderRadius: 24,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  readinessHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  readinessTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  readinessSubtitle: {
    fontSize: 13,
  },
  readinessPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readinessPillText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 5,
  },
  readinessCircleWrap: {
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    position: "relative",
  },
  readinessCircleInner: {
    position: "absolute",
    width: 94,
    height: 94,
    borderRadius: 47,
    justifyContent: "center",
    alignItems: "center",
  },
  readinessPercentText: {
    fontSize: 28,
    fontWeight: "800",
  },
  readinessSmallText: {
    fontSize: 13,
    marginTop: 2,
  },
  readinessCaption: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 8,
    marginBottom: 14,
  },

  compactStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  compactStatCard: {
    width: "23%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  compactStatNumber: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 2,
    textAlign: "center",
  },
  compactStatLabel: {
    fontSize: 10,
    textAlign: "center",
  },

  sectionCard: {
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
    overflow: "hidden",
  },
  collapsibleHeader: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  sectionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  sectionSubheading: {
    fontSize: 14,
  },
  sectionContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  taskMissionCard: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskMissionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  taskMissionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  taskMissionTextWrap: {
    flex: 1,
  },
  taskMissionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  taskTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  taskTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  taskTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  taskRewardTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskRewardTagText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  taskMissionRight: {
    marginLeft: 10,
    alignItems: "flex-end",
  },
  playBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E88E5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 3,
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 5,
  },

  achievementGroupTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 4,
  },
  badgesRow: {
    paddingRight: 4,
    marginBottom: 12,
  },
  badgeCard: {
    width: 150,
    borderRadius: 18,
    padding: 16,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  badgeCardLocked: {
    width: 150,
    borderRadius: 18,
    padding: 16,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  badgeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  badgeSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 17,
  },
  badgeTitleLocked: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  badgeSubtitleLocked: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 17,
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
