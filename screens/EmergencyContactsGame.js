import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppSettings } from "../context/AppSettingsContext";
import { darkTheme, lightTheme } from "../theme/colors";

// Three scenarios the user needs to match to the correct emergency number
// Kept simple and focused on the most important Singapore emergency contacts
const SCENARIOS = [
  { id: 1, label: "Fire or ambulance emergency", correctNumber: "995" },
  { id: 2, label: "Police emergency", correctNumber: "999" },
  { id: 3, label: "Non-emergency ambulance", correctNumber: "1777" },
];

const CONTACT_OPTIONS = ["995", "999", "1777"];

export default function EmergencyContactsGame({ navigation, route }) {
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  const alreadyCompleted = route?.params?.alreadyCompleted ?? false;

  // Two-step selection: user taps a scenario first, then taps a number to match it
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  // Track which number the user has matched to each scenario (scenarioId -> number)
  const [matches, setMatches] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Three separate modals for different outcomes - same pattern as the other mini-games
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);

  const matchedCount = Object.keys(matches).length;

  // Check if every scenario has been matched to the correct number
  const isCorrect = useMemo(() => {
    if (Object.keys(matches).length !== SCENARIOS.length) return false;

    return SCENARIOS.every(
      (scenario) => matches[scenario.id] === scenario.correctNumber,
    );
  }, [matches]);
  // Step 1 of the matching flow - select which scenario to match
  const handleScenarioPress = (scenarioId) => {
    if (submitted) return;
    setSelectedScenarioId(scenarioId);
  };
  // Step 2 - assign the tapped number to the selected scenario
  // Clears the selection afterwards so user can move to the next one
  const handleNumberPress = (number) => {
    if (submitted || !selectedScenarioId) return;

    setMatches((prev) => ({
      ...prev,
      [selectedScenarioId]: number,
    }));

    setSelectedScenarioId(null);
  };

  const handleCheckAnswers = () => {
    if (Object.keys(matches).length !== SCENARIOS.length) {
      setShowTryAgainModal(true);
      return;
    }

    setSubmitted(true);

    if (isCorrect) {
      if (alreadyCompleted) {
        setShowReplayModal(true);
      } else {
        setShowSuccessModal(true);
      }
    } else {
      setShowTryAgainModal(true);
    }
  };

  const handleReset = () => {
    setSelectedScenarioId(null);
    setMatches({});
    setSubmitted(false);
    setShowSuccessModal(false);
    setShowReplayModal(false);
    setShowTryAgainModal(false);
  };

  const getScenarioStatusStyle = (scenario) => {
    if (!submitted) return null;

    const picked = matches[scenario.id];
    if (!picked) return null;

    if (picked === scenario.correctNumber) {
      return {
        borderColor: colors.success,
        backgroundColor: colors.successSoft,
      };
    }

    return {
      borderColor: colors.danger,
      backgroundColor: colors.dangerSoft,
    };
  };
  // Show how many times a number has been used so the user knows if they've assigned it already
  const getNumberUsageCount = (number) => {
    return Object.values(matches).filter((value) => value === number).length;
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.headerButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Emergency Contact Match
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Preparedness Mini Game
          </Text>
        </View>

        <View
          style={[
            styles.headerBadge,
            {
              backgroundColor: darkModeEnabled ? "#3E3112" : "#FFF7E6",
            },
          ]}
        >
          <Ionicons name="star" size={14} color={colors.warning} />
          <Text
            style={[
              styles.headerBadgeText,
              { color: darkModeEnabled ? "#FDE68A" : "#B45309" },
            ]}
          >
            +10 XP
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.instructionsCard, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>
            Match the correct number
          </Text>
          <Text
            style={[styles.instructionsText, { color: colors.textSecondary }]}
          >
            Tap a situation card first, then tap the correct emergency contact
            number.
          </Text>

          <View
            style={[
              styles.counterPill,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons name="call-outline" size={14} color={colors.primary} />
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {matchedCount}/{SCENARIOS.length} matched
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Situations
        </Text>

        <View style={styles.scenariosWrap}>
          {SCENARIOS.map((scenario) => {
            const isSelected = selectedScenarioId === scenario.id;
            const chosenNumber = matches[scenario.id];

            return (
              <TouchableOpacity
                key={scenario.id}
                style={[
                  styles.scenarioCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  isSelected && {
                    borderColor: colors.primary,
                    backgroundColor: darkModeEnabled
                      ? colors.primarySoft
                      : "#F4FAFF",
                  },
                  getScenarioStatusStyle(scenario),
                ]}
                onPress={() => handleScenarioPress(scenario.id)}
                activeOpacity={0.88}
              >
                <View style={styles.scenarioLeft}>
                  <View
                    style={[
                      styles.scenarioIconWrap,
                      {
                        backgroundColor: isSelected
                          ? colors.primarySoft
                          : colors.cardSoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={22}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </View>

                  <View style={styles.scenarioTextWrap}>
                    <Text style={[styles.scenarioText, { color: colors.text }]}>
                      {scenario.label}
                    </Text>
                    <Text
                      style={[
                        styles.scenarioHint,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {chosenNumber
                        ? `Matched with ${chosenNumber}`
                        : "Tap to select"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Emergency Numbers
        </Text>

        <View style={styles.numbersRow}>
          {CONTACT_OPTIONS.map((number) => (
            <TouchableOpacity
              key={number}
              style={[
                styles.numberCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleNumberPress(number)}
              activeOpacity={0.88}
            >
              <Text style={[styles.numberText, { color: colors.primary }]}>
                {number}
              </Text>
              <Text
                style={[
                  styles.numberUsageText,
                  { color: colors.textSecondary },
                ]}
              >
                Used {getNumberUsageCount(number)} time
                {getNumberUsageCount(number) === 1 ? "" : "s"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.tipCard,
            {
              backgroundColor: darkModeEnabled ? colors.primarySoft : "#EAF4FF",
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={colors.primary}
          />
          <Text
            style={[
              styles.tipText,
              { color: darkModeEnabled ? colors.textSecondary : "#1E3A5F" },
            ]}
          >
            Knowing the right emergency number quickly can save precious time
            during a real incident.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={handleReset}
          >
            <Text
              style={[styles.resetButtonText, { color: colors.textSecondary }]}
            >
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkButton}
            onPress={handleCheckAnswers}
          >
            <Text style={styles.checkButtonText}>Check Matches</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.modalIconCircle,
                { backgroundColor: colors.successSoft },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={42}
                color={colors.success}
              />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Mission Complete!
            </Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              You matched all emergency contacts correctly and earned +10 XP.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate("MainTabs", {
                  screen: "Tasks",
                  params: { completedTaskId: 2 },
                });
              }}
            >
              <Text style={styles.modalPrimaryButtonText}>Back to Tasks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReplayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReplayModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.modalIconCircle,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name="refresh-circle"
                size={42}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Nice Replay!
            </Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              You already completed this task before, so no extra XP was added
              this time.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowReplayModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalPrimaryButtonText}>Back to Tasks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTryAgainModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTryAgainModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.modalIconCircle,
                { backgroundColor: colors.warningSoft },
              ]}
            >
              <Ionicons name="alert-circle" size={42} color={colors.warning} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Try Again
            </Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              {Object.keys(matches).length !== SCENARIOS.length
                ? "Match all the situations before checking."
                : "Some matches are incorrect. Reset and try again."}
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[
                  styles.modalSecondaryButton,
                  {
                    backgroundColor: colors.cardSoft,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowTryAgainModal(false)}
              >
                <Text
                  style={[
                    styles.modalSecondaryButtonText,
                    { color: colors.text },
                  ]}
                >
                  Keep Playing
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryButtonSmall}
                onPress={() => {
                  setShowTryAgainModal(false);
                  handleReset();
                }}
              >
                <Text style={styles.modalPrimaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  instructionsCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  counterPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 5,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },

  scenariosWrap: {
    marginBottom: 16,
  },
  scenarioCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  scenarioLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  scenarioIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  scenarioTextWrap: {
    flex: 1,
  },
  scenarioText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 4,
  },
  scenarioHint: {
    fontSize: 14,
  },

  numbersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  numberCard: {
    width: "31%",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 2,
  },
  numberText: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  numberUsageText: {
    fontSize: 11,
    textAlign: "center",
  },

  tipCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 8,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resetButton: {
    width: "31%",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  checkButton: {
    width: "66%",
    backgroundColor: "#1E88E5",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
  },
  modalIconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 18,
  },
  modalPrimaryButton: {
    width: "100%",
    backgroundColor: "#1E88E5",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalPrimaryButtonSmall: {
    flex: 1,
    backgroundColor: "#1E88E5",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalButtonRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  modalSecondaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
