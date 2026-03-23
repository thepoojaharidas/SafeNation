import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
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

// list of shelter choices with correct answer and details
const SHELTER_OPTIONS = [
  {
    id: 1,
    name: "Community Centre Shelter",
    distance: "0.8 km",
    correct: true,
    detail: "Nearest designated shelter with emergency support",
  },
  {
    id: 2,
    name: "Shopping Mall Basement",
    distance: "1.6 km",
    correct: false,
    detail: "Nearby, but not a designated emergency shelter",
  },
  {
    id: 3,
    name: "Open Car Park",
    distance: "0.5 km",
    correct: false,
    detail: "Closer, but unsafe and not suitable as shelter",
  },
];

export default function ShelterGame({ navigation, route }) {
  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // check if user has already completed this task before
  const alreadyCompleted = route?.params?.alreadyCompleted ?? false;

  // store selected shelter and modal states for game flow
  const [selectedShelterId, setSelectedShelterId] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);

  // find the selected shelter object based on user choice
  const selectedShelter = SHELTER_OPTIONS.find(
    (option) => option.id === selectedShelterId,
  );

  // validate selected shelter and show appropriate feedback
  const handleCheckAnswer = () => {
    if (!selectedShelterId) {
      setShowTryAgainModal(true);
      return;
    }

    setSubmitted(true);

    if (selectedShelter?.correct) {
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
    setSelectedShelterId(null);
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
            Nearest Shelter
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
            Choose the safest shelter
          </Text>
          <Text
            style={[styles.instructionsText, { color: colors.textSecondary }]}
          >
            Heavy rain is causing flash flood risk. Select the nearest
            appropriate emergency shelter.
          </Text>

          <View
            style={[
              styles.locationPill,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.locationPillText, { color: colors.primary }]}>
              Current area: Bedok North
            </Text>
          </View>
        </View>

        <View style={[styles.mapCard, { backgroundColor: colors.card }]}>
          <View style={styles.mapHeader}>
            <Ionicons name="map-outline" size={18} color={colors.primary} />
            <Text style={[styles.mapHeaderText, { color: colors.text }]}>
              Nearby shelter options
            </Text>
          </View>

          {SHELTER_OPTIONS.map((option) => {
            const isSelected = selectedShelterId === option.id;
            const isCorrect = submitted && option.correct;
            const isWrongSelected = submitted && isSelected && !option.correct;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.shelterCard,
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
                onPress={() => setSelectedShelterId(option.id)}
                activeOpacity={0.88}
              >
                <View style={styles.shelterLeft}>
                  <View
                    style={[
                      styles.shelterIconWrap,
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
                      name="business-outline"
                      size={22}
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

                  <View style={styles.shelterTextWrap}>
                    <Text style={[styles.shelterName, { color: colors.text }]}>
                      {option.name}
                    </Text>
                    <Text
                      style={[
                        styles.shelterDetail,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {option.detail}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.distanceBadge,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.distanceText, { color: colors.primary }]}
                  >
                    {option.distance}
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
            The nearest place is not always the safest. A proper designated
            shelter matters more than raw distance.
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
            onPress={handleCheckAnswer}
          >
            <Text style={styles.checkButtonText}>Confirm Shelter</Text>
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
              You identified the nearest safe shelter and earned +20 XP.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate("MainTabs", {
                  screen: "Tasks",
                  params: { completedTaskId: 5 },
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
              {!selectedShelterId
                ? "Choose a shelter option before confirming."
                : "That option is not the safest appropriate shelter. Reset and try again."}
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
  locationPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  locationPillText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 5,
  },

  mapCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  mapHeaderText: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },

  shelterCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shelterLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  shelterIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  shelterTextWrap: {
    flex: 1,
  },
  shelterName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  shelterDetail: {
    fontSize: 14,
    lineHeight: 17,
  },
  distanceBadge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "700",
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
