import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import { darkTheme, lightTheme } from "../theme/colors";

// defines all sections of the family safety plan
// each section contains title, icon, and list of key points
const familyPlanSections = [
  {
    id: "1",
    title: "Emergency Contacts",
    icon: "call-outline",
    color: "#2563EB",
    points: [
      "Make sure all family members know key emergency contact numbers.",
      "Choose one trusted relative or friend outside your area as a backup contact.",
      "Keep a written contact list in case phones are unavailable.",
    ],
  },
  {
    id: "2",
    title: "Meeting Place",
    icon: "location-outline",
    color: "#16A34A",
    points: [
      "Choose a safe meeting point near your home.",
      "Pick a second meeting place in case the first one is not accessible.",
      "Make sure children know where to go if separated.",
    ],
  },
  {
    id: "3",
    title: "Household Roles",
    icon: "people-outline",
    color: "#D97706",
    points: [
      "Assign simple responsibilities such as carrying the emergency kit or helping younger family members.",
      "Make sure everyone knows who will check on elderly relatives or pets.",
      "Review these roles regularly so the plan stays clear.",
    ],
  },
  {
    id: "4",
    title: "Special Needs",
    icon: "medkit-outline",
    color: "#DC2626",
    points: [
      "Prepare extra medication, baby supplies, or mobility support items if needed.",
      "Keep copies of medical information for family members with health conditions.",
      "Plan for pets, including food, water, and transport needs.",
    ],
  },
  {
    id: "5",
    title: "Communication Backup",
    icon: "chatbubble-ellipses-outline",
    color: "#7C3AED",
    points: [
      "Agree on how family members will contact each other during an emergency.",
      "Use text messages if phone calls do not go through.",
      "Keep devices charged and prepare a power bank if possible.",
    ],
  },
];

export default function FamilySafetyPlanScreen() {
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
            <Ionicons name="people-outline" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              Planning Safety as a Family
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Create a simple family plan so everyone knows what to do and where
              to go during an emergency.
            </Text>
          </View>
        </View>

        {familyPlanSections.map((section) => (
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

            {section.points.map((point, index) => (
              <View key={index} style={styles.pointRow}>
                <View
                  style={[
                    styles.pointBadge,
                    {
                      backgroundColor: darkModeEnabled
                        ? colors.cardMuted
                        : "#E2E8F0",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pointNumber,
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
                  style={[styles.pointText, { color: colors.textSecondary }]}
                >
                  {point}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View
          style={[
            styles.reminderCard,
            {
              backgroundColor: darkModeEnabled ? colors.warningSoft : "#FFFBEB",
            },
          ]}
        >
          <View style={styles.reminderHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.warning}
            />
            <Text
              style={[
                styles.reminderTitle,
                { color: darkModeEnabled ? "#FDE68A" : "#92400E" },
              ]}
            >
              Family Preparedness Tip
            </Text>
          </View>
          <Text
            style={[
              styles.reminderText,
              { color: darkModeEnabled ? "#FDE68A" : "#78350F" },
            ]}
          >
            Review your family safety plan regularly and make sure children,
            elderly family members, and caregivers understand it. A simple plan
            works best when everyone remembers it.
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
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  pointBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },
  pointNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  reminderCard: {
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
  },
  reminderHeader: {
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
