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

// Mix of correct and incorrect items for the user to choose from
// Deliberately included some tricky distractors like umbrella to make it more engaging
const GAME_ITEMS = [
  { id: 1, name: "Water", icon: "water-outline", correct: true },
  { id: 2, name: "Flashlight", icon: "flashlight-outline", correct: true },
  { id: 3, name: "First Aid", icon: "medkit-outline", correct: true },
  { id: 4, name: "Chips", icon: "fast-food-outline", correct: false },
  { id: 5, name: "Medicine", icon: "medical-outline", correct: true },
  { id: 6, name: "Umbrella", icon: "umbrella-outline", correct: false },
  { id: 7, name: "Whistle", icon: "notifications-outline", correct: true },
  { id: 8, name: "Toys", icon: "game-controller-outline", correct: false },
  { id: 9, name: "Guitar", icon: "musical-notes-outline", correct: false },
  {
    id: 10,
    name: "Power Bank",
    icon: "battery-charging-outline",
    correct: true,
  },
];

export default function EmergencyKitGame({ navigation, route }) {
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  const alreadyCompleted = route?.params?.alreadyCompleted ?? false;

  // Track selected item IDs - capped at 6 to match the required number
  const [selectedItems, setSelectedItems] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);

  const selectedCount = selectedItems.length;

  // Count how many of the selected items are actually correct
  // Used to give feedback after submission
  const correctSelectedCount = useMemo(() => {
    return GAME_ITEMS.filter(
      (item) => item.correct && selectedItems.includes(item.id),
    ).length;
  }, [selectedItems]);

  // Toggle selection on/off - prevent selecting more than 6 items at once
  const toggleItem = (id) => {
    if (submitted) return;

    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      }

      if (prev.length >= 6) {
        return prev;
      }

      return [...prev, id];
    });
  };
  // Only allow submission when exactly 6 items are selected
  // All 6 must be correct to pass
  const handleCheckBag = () => {
    if (selectedItems.length !== 6) {
      setShowTryAgainModal(true);
      return;
    }

    setSubmitted(true);

    if (correctSelectedCount === 6) {
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
    setSelectedItems([]);
    setSubmitted(false);
    setShowSuccessModal(false);
    setShowReplayModal(false);
    setShowTryAgainModal(false);
  };

  // Dynamic instruction text that updates based on current game state
  const instructionText = submitted
    ? correctSelectedCount === 6
      ? "Perfect pack! You chose all 6 essential items."
      : `You got ${correctSelectedCount}/6 correct. Review your choices and try again.`
    : "Tap the 6 items that belong in an emergency bag.";

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
            Emergency Bag Pack
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
            +20 XP
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
            Select the 6 correct items
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
            <Ionicons
              name="bag-handle-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {selectedCount}/6 selected
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {GAME_ITEMS.map((item) => {
            // Show different card styles depending on selection state and whether answers have been revealed
            const isSelected = selectedItems.includes(item.id);
            const isCorrectReveal = submitted && item.correct;
            const isWrongReveal = submitted && isSelected && !item.correct;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
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
                  isCorrectReveal && {
                    borderColor: colors.success,
                    backgroundColor: colors.successSoft,
                  },
                  isWrongReveal && {
                    borderColor: colors.danger,
                    backgroundColor: colors.dangerSoft,
                  },
                ]}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.itemIconWrap,
                    {
                      backgroundColor: colors.cardSoft,
                    },
                    isSelected && {
                      backgroundColor: colors.primarySoft,
                    },
                    isCorrectReveal && {
                      backgroundColor: colors.successSoft,
                    },
                    isWrongReveal && {
                      backgroundColor: colors.dangerSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={28}
                    color={
                      isWrongReveal
                        ? colors.danger
                        : isCorrectReveal
                          ? colors.success
                          : isSelected
                            ? colors.primary
                            : colors.textSecondary
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.itemLabel,
                    { color: colors.text },
                    isCorrectReveal && { color: colors.success },
                    isWrongReveal && { color: colors.danger },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.bagCard, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.bagIconCircle,
              {
                backgroundColor: darkModeEnabled ? "#4A2D10" : "#FFF7ED",
              },
            ]}
          >
            <Ionicons name="bag-handle" size={48} color="#F97316" />
          </View>
          <Text style={[styles.bagTitle, { color: colors.text }]}>
            Your Emergency Bag
          </Text>
          <Text style={[styles.bagText, { color: colors.textSecondary }]}>
            {selectedCount === 0
              ? "No items packed yet."
              : `${selectedCount} item${selectedCount > 1 ? "s" : ""} packed.`}
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

          <TouchableOpacity style={styles.checkButton} onPress={handleCheckBag}>
            <Text style={styles.checkButtonText}>Pack My Bag</Text>
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
              You packed the emergency bag correctly and earned +20 XP.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate("MainTabs", {
                  screen: "Tasks",
                  params: { completedTaskId: 1 },
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
              {selectedItems.length !== 6
                ? "Choose exactly 6 items before checking your bag."
                : `You got ${correctSelectedCount}/6 correct. Reset and try again.`}
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

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  itemCard: {
    width: "31.5%",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
  },
  itemIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  bagCard: {
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  bagIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  bagTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  bagText: {
    fontSize: 14,
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
