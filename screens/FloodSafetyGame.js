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

// predefined steps for the game with correct order
// used to validate user's selection sequence
const STEP_OPTIONS = [
  { id: 1, text: "Turn off electricity if safe", order: 2 },
  { id: 2, text: "Move to higher ground", order: 1 },
  { id: 3, text: "Follow official alerts and updates", order: 4 },
  { id: 4, text: "Avoid walking or driving through floodwaters", order: 3 },
];

export default function FloodSafetyGame({ navigation, route }) {
  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // check if user has already completed this task before
  const alreadyCompleted = route?.params?.alreadyCompleted ?? false;

  // store selected steps and modal states for game flow
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);

  // check if selected order matches the correct sequence
  const isCorrectOrder = useMemo(() => {
    if (selectedOrder.length !== STEP_OPTIONS.length) return false;

    return selectedOrder.every((stepId, index) => {
      const selectedStep = STEP_OPTIONS.find((step) => step.id === stepId);
      return selectedStep?.order === index + 1;
    });
  }, [selectedOrder]);

  // handle selecting and deselecting steps in order
  const handleSelectStep = (id) => {
    if (submitted) return;

    setSelectedOrder((prev) => {
      if (prev.includes(id)) {
        return prev.filter((stepId) => stepId !== id);
      }

      if (prev.length >= STEP_OPTIONS.length) {
        return prev;
      }

      return [...prev, id];
    });
  };

  // returns the position number of a selected step
  const getStepNumber = (id) => {
    const index = selectedOrder.indexOf(id);
    return index >= 0 ? index + 1 : null;
  };

  // validate selection and trigger appropriate modal
  const handleCheckOrder = () => {
    if (selectedOrder.length !== STEP_OPTIONS.length) {
      setShowTryAgainModal(true);
      return;
    }

    setSubmitted(true);

    if (isCorrectOrder) {
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
    setSelectedOrder([]);
    setSubmitted(false);
    setShowSuccessModal(false);
    setShowReplayModal(false);
    setShowTryAgainModal(false);
  };

  // dynamic instruction message based on game state
  const instructionText = submitted
    ? isCorrectOrder
      ? "Perfect sequence! You chose all flood safety steps in the correct order."
      : "That order is not quite right. Reset and try again."
    : "Tap the 4 steps in the safest order during a flood.";

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
            Flood Safety Steps
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
            Tap the steps in order
          </Text>
          <Text
            style={[styles.instructionsText, { color: colors.textSecondary }]}
          >
            {instructionText}
          </Text>

          <View
            style={[
              styles.counterPill,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons name="water-outline" size={14} color={colors.primary} />
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {selectedOrder.length}/{STEP_OPTIONS.length} selected
            </Text>
          </View>
        </View>

        <View style={styles.stepsWrap}>
          {STEP_OPTIONS.map((step) => {
            const stepNumber = getStepNumber(step.id);
            const isSelected = stepNumber !== null;

            return (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepCard,
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
                ]}
                onPress={() => handleSelectStep(step.id)}
                activeOpacity={0.88}
              >
                <View style={styles.stepLeft}>
                  <View
                    style={[
                      styles.stepIconWrap,
                      {
                        backgroundColor: isSelected
                          ? colors.primarySoft
                          : colors.cardSoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name="water"
                      size={22}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.stepText,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {step.text}
                  </Text>
                </View>

                <View
                  style={[
                    styles.orderBadge,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.cardMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.orderBadgeText,
                      {
                        color: isSelected ? "#FFFFFF" : colors.textSecondary,
                      },
                    ]}
                  >
                    {stepNumber ?? "•"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
            Flood safety is about protecting yourself first, then following
            trusted official guidance.
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
            onPress={handleCheckOrder}
          >
            <Text style={styles.checkButtonText}>Check Order</Text>
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
              You arranged the flood safety steps correctly and earned +15 XP.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate("MainTabs", {
                  screen: "Tasks",
                  params: { completedTaskId: 3 },
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
              {selectedOrder.length !== STEP_OPTIONS.length
                ? "Select all 4 steps before checking the order."
                : "That order is not correct. Reset and try again."}
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

  stepsWrap: {
    marginBottom: 16,
  },
  stepCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  stepIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  orderBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  orderBadgeText: {
    fontSize: 14,
    fontWeight: "800",
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
