import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import { darkTheme, lightTheme } from "../theme/colors";

// defines all first aid categories and their steps
// each section includes title, icon, and instructions
const firstAidSections = [
  {
    id: "1",
    title: "Cuts and Bleeding",
    icon: "bandage-outline",
    color: "#DC2626",
    steps: [
      "Apply gentle pressure with a clean cloth or bandage.",
      "Raise the injured area if possible.",
      "Clean the wound gently once bleeding slows.",
      "Seek medical help if bleeding is heavy or does not stop.",
    ],
  },
  {
    id: "2",
    title: "Burns",
    icon: "flame-outline",
    color: "#EA580C",
    steps: [
      "Cool the burn under clean running water for at least 10 minutes.",
      "Remove tight items near the burn if safe to do so.",
      "Do not apply ice, butter, or toothpaste.",
      "Cover loosely with a clean non-stick dressing and seek help if severe.",
    ],
  },
  {
    id: "3",
    title: "Fainting",
    icon: "body-outline",
    color: "#2563EB",
    steps: [
      "Help the person lie down in a safe place.",
      "Raise their legs slightly if appropriate.",
      "Loosen tight clothing and improve airflow.",
      "Seek medical attention if they do not recover quickly or are injured.",
    ],
  },
  {
    id: "4",
    title: "Choking",
    icon: "alert-circle-outline",
    color: "#D97706",
    steps: [
      "Encourage the person to cough if they can still breathe.",
      "If they cannot breathe or speak, seek emergency help immediately.",
      "Give back blows if trained to do so.",
      "Call emergency services urgently if the blockage does not clear.",
    ],
  },
  {
    id: "5",
    title: "Sprains",
    icon: "walk-outline",
    color: "#16A34A",
    steps: [
      "Rest the injured area and avoid putting weight on it.",
      "Apply a cold pack wrapped in cloth.",
      "Compress gently with a bandage if needed.",
      "Seek medical help if pain or swelling is severe.",
    ],
  },
];

export default function FirstAidBasicsScreen() {
  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

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
            <Ionicons name="medkit-outline" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              Basic First Aid Tips
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Learn quick first aid responses for common injuries and emergency
              situations.
            </Text>
          </View>
        </View>

        {firstAidSections.map((section) => (
          <View
            key={section.id}
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
                  styles.sectionIconWrap,
                  {
                    backgroundColor: darkModeEnabled
                      ? `${section.color}22`
                      : `${section.color}15`,
                  },
                ]}
              >
                <Ionicons name={section.icon} size={22} color={section.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
            </View>

            {section.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: darkModeEnabled
                        ? colors.cardMuted
                        : "#E2E8F0",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      {
                        color: darkModeEnabled
                          ? colors.textSecondary
                          : "#334155",
                      },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  style={[styles.stepText, { color: colors.textSecondary }]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View
          style={[
            styles.warningCard,
            {
              backgroundColor: darkModeEnabled ? colors.warningSoft : "#FFFBEB",
            },
          ]}
        >
          <View style={styles.warningHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.warning}
            />
            <Text
              style={[
                styles.warningTitle,
                {
                  color: darkModeEnabled ? "#FDE68A" : "#92400E",
                },
              ]}
            >
              Important Note
            </Text>
          </View>
          <Text
            style={[
              styles.warningText,
              {
                color: darkModeEnabled ? "#FDE68A" : "#78350F",
              },
            ]}
          >
            These are basic first aid guidelines only. For serious injuries,
            breathing problems, severe bleeding, unconsciousness, or suspected
            emergencies, contact emergency services immediately.
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
  sectionIconWrap: {
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
  warningCard: {
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
