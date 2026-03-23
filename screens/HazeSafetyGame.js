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

// list of haze scenarios with options and correct answers
// used to evaluate user choices in the game
const QUESTIONS = [
  {
    id: 1,
    scenario:
      "The haze is strong and air quality is unhealthy. You need to go outside for a short errand.",
    options: [
      "Wear a proper mask and keep outdoor time short",
      "Jog outside first before going home",
      "Ignore the haze because it is only temporary",
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    scenario:
      "A family member has coughing and eye irritation during haze conditions.",
    options: [
      "Keep windows open for more fresh air",
      "Stay indoors, reduce exposure, and monitor symptoms",
      "Go for outdoor exercise to strengthen breathing",
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    scenario: "You planned an outdoor workout, but haze levels are high.",
    options: [
      "Continue as normal if you drink more water",
      "Reduce or avoid strenuous outdoor activity",
      "Exercise longer to adapt to the haze",
    ],
    correctIndex: 1,
  },
];

export default function HazeSafetyGame({ navigation, route }) {
  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // check if user has already completed this task before
  const alreadyCompleted = route?.params?.alreadyCompleted ?? false;

  // store selected answers and modal states for game flow
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);

  // count how many questions have been answered
  const answeredCount = Object.keys(answers).length;

  // calculate number of correct answers based on user selections
  const correctCount = useMemo(() => {
    return QUESTIONS.reduce((count, question) => {
      return answers[question.id] === question.correctIndex ? count + 1 : count;
    }, 0);
  }, [answers]);

  // check if all answers are correct
  const allCorrect = correctCount === QUESTIONS.length;

  // handle selecting an answer for each question
  const handleSelectAnswer = (questionId, optionIndex) => {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // validate answers and trigger appropriate modal
  const handleCheckAnswers = () => {
    if (answeredCount !== QUESTIONS.length) {
      setShowTryAgainModal(true);
      return;
    }

    setSubmitted(true);

    if (allCorrect) {
      if (alreadyCompleted) {
        setShowReplayModal(true);
      } else {
        setShowSuccessModal(true);
      }
    } else {
      setShowTryAgainModal(true);
    }
  };

  // reset game state to allow replay
  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setShowSuccessModal(false);
    setShowReplayModal(false);
    setShowTryAgainModal(false);
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
            Haze Safety Choices
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
            +15 XP
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
            Choose the safest action
          </Text>
          <Text
            style={[styles.instructionsText, { color: colors.textSecondary }]}
          >
            Read each haze situation carefully and tap the best response.
          </Text>

          <View
            style={[
              styles.counterPill,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons name="cloud-outline" size={14} color={colors.primary} />
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {answeredCount}/{QUESTIONS.length} answered
            </Text>
          </View>
        </View>

        {QUESTIONS.map((question, questionIndex) => (
          <View
            key={question.id}
            style={[styles.questionCard, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.questionNumber, { color: colors.primary }]}>
              Scenario {questionIndex + 1}
            </Text>

            <Text style={[styles.questionText, { color: colors.text }]}>
              {question.scenario}
            </Text>

            {question.options.map((option, optionIndex) => {
              const isSelected = answers[question.id] === optionIndex;
              const isCorrect =
                submitted && optionIndex === question.correctIndex;
              const isWrongSelected =
                submitted &&
                isSelected &&
                optionIndex !== question.correctIndex;

              return (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: colors.cardSoft,
                      borderColor: colors.border,
                    },
                    isSelected && {
                      borderColor: colors.primary,
                      backgroundColor: darkModeEnabled
                        ? colors.primarySoft
                        : "#F4FAFF",
                    },
                    isCorrect && {
                      borderColor: colors.success,
                      backgroundColor: colors.successSoft,
                    },
                    isWrongSelected && {
                      borderColor: colors.danger,
                      backgroundColor: colors.dangerSoft,
                    },
                  ]}
                  onPress={() => handleSelectAnswer(question.id, optionIndex)}
                  activeOpacity={0.88}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionIconWrap,
                        {
                          backgroundColor: colors.card,
                        },
                        isSelected && {
                          backgroundColor: colors.primarySoft,
                        },
                        isCorrect && {
                          backgroundColor: colors.successSoft,
                        },
                        isWrongSelected && {
                          backgroundColor: colors.dangerSoft,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isCorrect
                            ? "checkmark"
                            : isWrongSelected
                              ? "close"
                              : "ellipse-outline"
                        }
                        size={18}
                        color={
                          isCorrect
                            ? colors.success
                            : isWrongSelected
                              ? colors.danger
                              : isSelected
                                ? colors.primary
                                : colors.textSecondary
                        }
                      />
                    </View>

                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.text },
                        isCorrect && { color: colors.success },
                        isWrongSelected && { color: colors.danger },
                      ]}
                    >
                      {option}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

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
            During haze, reducing exposure and following official health
            guidance helps protect your lungs and eyes.
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
            <Text style={styles.checkButtonText}>Check Answers</Text>
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
              You made all the safest haze choices and earned +15 XP.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate("MainTabs", {
                  screen: "Tasks",
                  params: { completedTaskId: 4 },
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
              {answeredCount !== QUESTIONS.length
                ? "Answer all the scenarios before checking."
                : `You got ${correctCount}/${QUESTIONS.length} correct. Reset and try again.`}
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

  questionCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: 14,
  },
  optionCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
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
