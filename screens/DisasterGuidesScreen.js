import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import { darkTheme, lightTheme } from "../theme/colors";

// Disaster guide content — each entry follows a before/during/after structure
const disasterGuides = [
  {
    id: "1",
    title: "Flash Flood",
    icon: "rainy-outline",
    color: "#2563EB",
    before: [
      "Monitor weather updates and flood alerts regularly.",
      "Prepare an emergency kit and keep important items within reach.",
      "Avoid storing valuables on low ground if flooding is likely.",
    ],
    during: [
      "Move to higher ground immediately.",
      "Do not walk or drive through flood water.",
      "Follow official warnings and avoid flooded areas.",
    ],
    after: [
      "Return only when authorities say it is safe.",
      "Avoid contact with dirty or contaminated water.",
      "Check your home carefully for damage before entering.",
    ],
  },
  {
    id: "2",
    title: "Fire",
    icon: "flame-outline",
    color: "#DC2626",
    before: [
      "Know the nearest exits from your home or building.",
      "Keep a fire extinguisher and smoke alarm if possible.",
      "Do not overload electrical sockets.",
    ],
    during: [
      "Leave immediately using the safest exit.",
      "Stay low if there is smoke.",
      "Do not use lifts during a fire.",
    ],
    after: [
      "Call emergency services if not already done.",
      "Do not re-enter the building until it is safe.",
      "Seek medical attention for burns or smoke inhalation.",
    ],
  },
  {
    id: "3",
    title: "Earthquake",
    icon: "earth-outline",
    color: "#D97706",
    before: [
      "Secure heavy furniture and objects where possible.",
      "Identify safe spots such as under sturdy tables.",
      "Prepare a family emergency plan.",
    ],
    during: [
      "Drop, cover, and hold on.",
      "Stay away from glass, windows, and heavy objects.",
      "If outdoors, move away from buildings and power lines.",
    ],
    after: [
      "Check for injuries and help others if safe.",
      "Be alert for aftershocks.",
      "Follow official updates and avoid damaged structures.",
    ],
  },
  {
    id: "4",
    title: "Haze / Poor Air Quality",
    icon: "cloud-outline",
    color: "#7C3AED",
    before: [
      "Check PSI or air quality updates regularly.",
      "Keep masks and necessary medication ready.",
      "Close windows if haze becomes severe.",
    ],
    during: [
      "Reduce outdoor activity when air quality is poor.",
      "Wear a proper mask if you must go outside.",
      "Stay hydrated and monitor symptoms like coughing or breathlessness.",
    ],
    after: [
      "Ventilate indoor spaces when air quality improves.",
      "Continue monitoring your health if symptoms persist.",
      "Seek medical advice if breathing issues continue.",
    ],
  },
];

export default function DisasterGuidesScreen() {
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // Renders the before/during/after steps for a given phase
  const renderGuideSection = (label, steps) => (
    <View style={styles.phaseBlock}>
      <Text style={[styles.phaseTitle, { color: colors.primary }]}>
        {label}
      </Text>

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
                { color: darkModeEnabled ? colors.textSecondary : "#334155" },
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

  // Main screen — loops through guides and renders each as a card
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
            <Ionicons name="book-outline" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              Safety Guides for Common Disasters
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Learn what to do before, during, and after different emergency
              situations.
            </Text>
          </View>
        </View>

        {disasterGuides.map((guide) => (
          <View
            key={guide.id}
            style={[
              styles.guideCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderSoft,
              },
            ]}
          >
            <View style={styles.guideHeader}>
              <View
                style={[
                  styles.guideIconWrap,
                  {
                    backgroundColor: darkModeEnabled
                      ? `${guide.color}22`
                      : `${guide.color}15`,
                  },
                ]}
              >
                <Ionicons name={guide.icon} size={22} color={guide.color} />
              </View>

              <Text style={[styles.guideTitle, { color: colors.text }]}>
                {guide.title}
              </Text>
            </View>

            {renderGuideSection("Before", guide.before)}
            {renderGuideSection("During", guide.during)}
            {renderGuideSection("After", guide.after)}
          </View>
        ))}

        {/* Static reminder card at the bottom, doesn't need to be dynamic */}
        <View style={[styles.tipCard, { backgroundColor: colors.orangeCard }]}>
          <View style={styles.tipHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.warning}
            />
            <Text style={[styles.tipTitle, { color: colors.orangeTitle }]}>
              Preparedness Reminder
            </Text>
          </View>

          <Text style={[styles.tipText, { color: colors.orangeText }]}>
            Emergency preparedness works best when plans are made before a
            crisis. Review safety steps regularly so you can respond faster and
            more calmly.
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
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  guideCard: {
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
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  guideIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  phaseBlock: {
    marginTop: 6,
    marginBottom: 10,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
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
  tipCard: {
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
