import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { notificationActionLabData } from "../data/notificationActionLabData";

export default function NotificationDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel="Back to home"
          accessibilityRole="button"
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backAction,
            { borderColor: theme.backgroundSelected },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.backActionText, { color: theme.text }]}>Back</Text>
        </Pressable>

        <View
          style={[
            styles.detailsCard,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            {notificationActionLabData.title}
          </Text>
          <Text style={[styles.time, { color: theme.textSecondary }]}>
            {notificationActionLabData.timeLabel}
          </Text>
          <Text style={[styles.description, { color: theme.text }]}>
            {notificationActionLabData.details}
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
  content: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    gap: Spacing.three,
    padding: Spacing.three,
  },
  backAction: {
    minWidth: 44,
    minHeight: 44,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: 8,
  },
  backActionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
  detailsCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  title: {
    flexShrink: 1,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
  },
  time: {
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.7,
  },
});
