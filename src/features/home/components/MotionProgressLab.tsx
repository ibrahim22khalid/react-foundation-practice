import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { LearningProgressCard } from "./LearningProgressCard";

const INITIAL_COMPLETED_MINUTES = 15;
const PROGRESS_INCREMENT_MINUTES = 15;
const TOTAL_MINUTES = 60;

export function MotionProgressLab() {
  const [completedMinutes, setCompletedMinutes] = useState(
    INITIAL_COMPLETED_MINUTES,
  );
  const theme = useTheme();
  const isComplete = completedMinutes >= TOTAL_MINUTES;

  function handleContinue() {
    setCompletedMinutes((currentMinutes) =>
      Math.min(
        // using current minutes to avoid stale closure issues
        currentMinutes + PROGRESS_INCREMENT_MINUTES,
        TOTAL_MINUTES,
      ),
    );
  }

  function handleReset() {
    setCompletedMinutes(INITIAL_COMPLETED_MINUTES);
  }

  return (
    <View style={styles.container}>
      <LearningProgressCard
        title="Building adaptive and accessible React Native interfaces with purposeful motion"
        completedMinutes={completedMinutes}
        totalMinutes={TOTAL_MINUTES}
        actionLabel="Continue"
        disabled={isComplete}
        onPress={handleContinue}
      />

      <Pressable
        accessibilityLabel="Reset progress"
        accessibilityRole="button"
        onPress={handleReset}
        style={({ pressed }) => [
          styles.resetAction,
          { borderColor: theme.text },
          pressed && styles.resetActionPressed,
        ]}
      >
        <Text style={[styles.resetActionText, { color: theme.text }]}>
          Reset progress
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  resetAction: {
    width: "100%",
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: 8,
  },
  resetActionPressed: {
    opacity: 0.7,
  },
  resetActionText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
  },
});
