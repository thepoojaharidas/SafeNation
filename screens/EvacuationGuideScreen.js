import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import { darkTheme, lightTheme } from "../theme/colors";

// steps shown in each section of the evacuation guide
// separated into before, during, and after for clarity
const beforeSteps = [
  "Prepare an emergency kit with water, food, medication, and important documents.",
  "Keep your phone charged and bring a power bank if possible.",
  "Know the safest exit routes from your home or building.",
  "Inform family members about your meeting point and evacuation plan.",
];

const duringSteps = [
  "Stay calm and follow official instructions from authorities.",
  "Leave immediately if advised to evacuate.",
  "Use safe evacuation routes and avoid flooded or blocked roads.",
  "Help children, elderly family members, and pets if they are with you.",
];

const afterSteps = [
  "Go only to safe locations or shelters approved by authorities.",
  "Do not return home until it is declared safe.",
  "Check updates from official alerts and emergency channels.",
  "Contact family members to let them know you are safe.",
];

export default function EvacuationGuideScreen() {
  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // reusable function to render each evacuation section card
  // takes title, icon, color, and steps list as input
  const renderStepCard = (title, icon, color, steps) => (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.borderSoft,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: darkModeEnabled ? `${color}22` : `${color}15`,
            },
          ]}
        >
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>

      {steps.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View
            style={[
              styles.stepBadge,
              {
                backgroundColor: darkModeEnabled ? colors.cardMuted : "#E2E8F0",
              },
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                {
                  color: darkModeEnabled ? colors.textSecondary : "#334155",
                },
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["left", "right"]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: darkModeEnabled
                ? colors.card
                : colors.primarySoft,
            },
          ]}
        >
          <View style={styles.headerIcon}>
            <Ionicons name="walk-outline" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              How to Evacuate Safely
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Learn what to do before, during, and after evacuation so you can
              respond quickly and safely.
            </Text>
          </View>
        </View>

        {renderStepCard(
          "Before Evacuation",
          "bag-handle-outline",
          "#2563EB",
          beforeSteps,
        )}
        {renderStepCard(
          "During Evacuation",
          "alert-circle-outline",
          "#D97706",
          duringSteps,
        )}
        {renderStepCard(
          "After Evacuation",
          "home-outline",
          "#16A34A",
          afterSteps,
        )}

        <View
          style={[
            styles.reminderCard,
            {
              backgroundColor: darkModeEnabled ? colors.dangerSoft : "#FEF2F2",
            },
          ]}
        >
          <View style={styles.reminderTop}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.danger}
            />
            <Text
              style={[
                styles.reminderTitle,
                {
                  color: darkModeEnabled ? "#FCA5A5" : "#B91C1C",
                },
              ]}
            >
              Important Reminder
            </Text>
          </View>
          <Text
            style={[
              styles.reminderText,
              {
                color: darkModeEnabled ? "#FECACA" : "#7F1D1D",
              },
            ]}
          >
            Bring only essential items, move quickly but calmly, and always
            follow official evacuation instructions. Do not return to unsafe
            areas until authorities confirm it is safe.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  headerCard: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1E88E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginTop: 2,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  reminderCard: {
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
  },
  reminderTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  reminderText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
