import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import { darkTheme, lightTheme } from "../theme/colors";

// quick-access resources for urgent situations
const immediateHelp = [
  {
    id: "1",
    title: "Emergency Contacts",
    subtitle: "Hotlines, hospitals, and urgent support",
    icon: "call-outline",
    screen: "EmergencyContacts",
    action: "View Numbers",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
  },
  {
    id: "2",
    title: "Evacuation Guide",
    subtitle: "Steps to leave safely and quickly",
    icon: "walk-outline",
    screen: "EvacuationGuide",
    action: "Read Guide",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
  {
    id: "3",
    title: "First Aid Basics",
    subtitle: "Simple help for common injuries",
    icon: "medkit-outline",
    screen: "FirstAidBasics",
    action: "Open Tips",
    iconBg: "#FCE7F3",
    iconColor: "#DB2777",
  },
];

// resources focused on long-term preparedness and learning
const preparedness = [
  {
    id: "4",
    title: "Disaster Guides",
    subtitle: "Learn what to do before, during, and after emergencies",
    icon: "book-outline",
    screen: "DisasterGuides",
    action: "Read Guide",
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
  },
  {
    id: "5",
    title: "Emergency Kit",
    subtitle: "Essential items to prepare in advance",
    icon: "bag-handle-outline",
    screen: "EmergencyKit",
    action: "Check Items",
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
  },
  {
    id: "6",
    title: "Family Safety Plan",
    subtitle: "Prepare your household for emergencies",
    icon: "people-outline",
    screen: "FamilySafetyPlan",
    action: "Plan Now",
    iconBg: "#EDE9FE",
    iconColor: "#7C3AED",
  },
];

export default function ResourcesScreen({ navigation }) {
  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // reusable function to render resource cards
  const renderCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.borderSoft,
        },
      ]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: darkModeEnabled
                ? `${item.iconColor}22`
                : item.iconBg,
            },
          ]}
        >
          <Ionicons name={item.icon} size={24} color={item.iconColor} />
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.cardAction, { color: colors.primary }]}>
          {item.action}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: colors.background },
        ]}
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
            <Ionicons name="library-outline" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              Emergency Resources
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Find trusted emergency contacts, practical safety guides, and
              preparedness support in one place.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Immediate Help
        </Text>
        <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
          Quick-access resources for urgent situations
        </Text>

        <View style={styles.sectionGroup}>{immediateHelp.map(renderCard)}</View>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Preparedness
        </Text>
        <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
          Tools and information to help you prepare in advance
        </Text>

        <View style={styles.sectionGroup}>{preparedness.map(renderCard)}</View>

        <View style={[styles.tipCard, { backgroundColor: colors.orangeCard }]}>
          <View
            style={[
              styles.tipIconWrap,
              {
                backgroundColor: darkModeEnabled ? "#5B3A16" : "#FFEDD5",
              },
            ]}
          >
            <Ionicons name="bulb-outline" size={20} color={colors.warning} />
          </View>

          <View style={styles.tipTextWrap}>
            <Text style={[styles.tipTitle, { color: colors.orangeTitle }]}>
              Preparedness Tip of the Day
            </Text>
            <Text style={[styles.tipText, { color: colors.orangeText }]}>
              Keep a power bank charged and store important documents in a
              waterproof pouch so they are easy to grab during an emergency.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
    maxWidth: "78%",
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    width: "100%",
    flexWrap: "wrap",
  },

  sectionGroup: {
    marginBottom: 18,
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },

  sectionSubtext: {
    fontSize: 13,
    marginBottom: 10,
  },

  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  textWrap: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  cardAction: {
    fontSize: 13,
    fontWeight: "700",
    marginRight: 4,
  },

  tipCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  tipIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  tipTextWrap: {
    flex: 1,
  },

  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  tipText: {
    fontSize: 13,
    lineHeight: 19,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
