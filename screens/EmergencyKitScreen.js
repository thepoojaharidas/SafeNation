import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import { darkTheme, lightTheme } from "../theme/colors";

// Emergency kit content organised into 5 categories
// Each section has its own colour to make it visually distinct and easier to scan
const kitSections = [
  {
    id: "1",
    title: "Basic Essentials",
    icon: "cube-outline",
    color: "#2563EB",
    items: [
      "Drinking water",
      "Non-perishable food",
      "Flashlight",
      "Extra batteries",
      "Power bank",
    ],
  },
  {
    id: "2",
    title: "Health and Safety",
    icon: "medkit-outline",
    color: "#DC2626",
    items: [
      "First-aid kit",
      "Personal medication",
      "Face masks",
      "Hand sanitizer",
      "Wet wipes or tissues",
    ],
  },
  {
    id: "3",
    title: "Important Documents",
    icon: "document-text-outline",
    color: "#D97706",
    items: [
      "Identification documents",
      "Medical records if needed",
      "Emergency contact list",
      "Insurance details",
      "Copies stored in a waterproof pouch",
    ],
  },
  {
    id: "4",
    title: "Communication and Tools",
    icon: "construct-outline",
    color: "#16A34A",
    items: [
      "Whistle",
      "Phone charger",
      "Portable radio if available",
      "Multi-purpose tool",
      "Small amount of cash",
    ],
  },
  {
    id: "5",
    title: "Personal Needs",
    icon: "person-outline",
    color: "#7C3AED",
    items: [
      "Change of clothes",
      "Blanket or light towel",
      "Baby supplies if needed",
      "Pet supplies if needed",
      "Comfort items for children",
    ],
  },
];

export default function EmergencyKitScreen() {
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
            <Ionicons name="bag-handle-outline" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              What to Pack in an Emergency Kit
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Prepare essential items in advance so you can respond more quickly
              and safely during emergencies.
            </Text>
          </View>
        </View>

        {kitSections.map((section) => (
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

            {section.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.checkIcon}
                />
                <Text
                  style={[styles.itemText, { color: colors.textSecondary }]}
                >
                  {item}
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
              Preparedness Reminder
            </Text>
          </View>
          <Text
            style={[
              styles.reminderText,
              { color: darkModeEnabled ? "#FDE68A" : "#78350F" },
            ]}
          >
            Store your emergency kit in an easy-to-reach place and check it
            regularly to replace expired food, batteries, medication, or other
            important supplies.
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
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  itemText: {
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
