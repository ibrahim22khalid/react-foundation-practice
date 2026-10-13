import { Pressable, StyleSheet, Text, View } from "react-native";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// Define the public data and behavior required by the progress card.
export type LearningProgressCardProps = {
  title: string;
  completedMinutes: number;
  totalMinutes: number;
  actionLabel: string;
  disabled?: boolean;
  onPress: () => void;
};

// Convert the minute values into a safe integer percentage from 0 to 100.
function getProgressPercentage(
  completedMinutes: number,
  totalMinutes: number,
): number {
  if (
    !Number.isFinite(completedMinutes) ||
    !Number.isFinite(totalMinutes) ||
    totalMinutes <= 0
  ) {
    return 0;
  }

  const progress = completedMinutes / totalMinutes;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return Math.round(clampedProgress * 100);
}

// Render the first visible checkpoint before adding styles and interactions.
export function LearningProgressCard(props: LearningProgressCardProps) {
  const progressPercentage = getProgressPercentage(
    props.completedMinutes,
    props.totalMinutes,
  );
  // Read the active theme without storing screen dimensions or theme data in state.
  const theme = useTheme();
  // Render a naturally sized card that grows when its text wraps.
  // Normalize the optional disabled prop into one predictable boolean.
  const isDisabled = props.disabled ?? false;
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <Text style={[styles.title, { color: theme.text }]}>{props.title}</Text>

      <Text style={[styles.progressText, { color: theme.textSecondary }]}>
        {progressPercentage}% complete
      </Text>
      {/* Expose the same safe percentage visually and to assistive technologies. */}
      <View
        accessible
        accessibilityLabel={`${props.title} progress`}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: progressPercentage,
        }}
        style={[
          styles.progressTrack,
          { backgroundColor: theme.backgroundSelected },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: theme.text,
            },
          ]}
        />
      </View>
      {/* Provide a wrapping action with explicit role, name, and disabled state. */}
      <Pressable
        accessibilityLabel={props.actionLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={props.onPress}
        style={({ pressed }) => [
          styles.action,
          {
            backgroundColor: isDisabled ? theme.backgroundSelected : theme.text,
          },
          pressed && !isDisabled && styles.actionPressed,
          isDisabled && styles.actionDisabled,
        ]}
      >
        <Text
          style={[
            styles.actionText,
            {
              color: isDisabled ? theme.textSecondary : theme.background,
            },
          ]}
        >
          {props.actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}
// Keep component-specific typography here while reusing the shared spacing scale.
const styles = StyleSheet.create({
  card: {
    width: "100%",
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  title: {
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
  },
  progressText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  // Give the progress indicator a fixed thickness while its width remains adaptive.
  progressTrack: {
    width: "100%",
    height: Spacing.two,
    overflow: "hidden",
    borderRadius: 999,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  // Keep the action large enough to touch while allowing long labels to wrap.
  action: {
    width: "100%",
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
  },
});
