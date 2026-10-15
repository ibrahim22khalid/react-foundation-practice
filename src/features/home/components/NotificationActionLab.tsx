import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type NotificationActionLabProps = {
  title: string;
  description: string;
  timeLabel: string;
  initiallyRead?: boolean;
  onOpenDetails: () => void;
  onMarkAsRead: () => void;
};

export function NotificationActionLab({
  title,
  description,
  timeLabel,
  initiallyRead = false,
  onOpenDetails,
  onMarkAsRead,
}: NotificationActionLabProps) {
  const [isRead, setIsRead] = useState(initiallyRead);
  const theme = useTheme();

  function handleMarkAsRead() {
    if (isRead) {
      return;
    }

    setIsRead(true);
    onMarkAsRead();
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundElement }]}
    >
      <Pressable
        accessibilityLabel={`Open ${title} details`}
        accessibilityRole="button"
        onPress={onOpenDetails}
        style={({ pressed }) => [
          styles.notificationRow,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.headingRow}>
          <Text accessible={false} style={styles.notificationIcon}>
            🔔
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>

        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {description}
        </Text>

        <View style={styles.metadataRow}>
          <Text style={[styles.metadataText, { color: theme.textSecondary }]}>
            {timeLabel}
          </Text>
          <Text style={[styles.metadataText, { color: theme.text }]}>
            Tap to open details
          </Text>
        </View>
      </Pressable>

      {isRead ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.readStatus, { color: theme.textSecondary }]}
        >
          Read
        </Text>
      ) : (
        <Pressable
          accessibilityLabel={`Mark ${title} as read`}
          accessibilityRole="button"
          onPress={handleMarkAsRead}
          style={({ pressed }) => [
            styles.markAsReadAction,
            { backgroundColor: theme.text },
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[styles.markAsReadText, { color: theme.background }]}
          >
            Mark as read
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  notificationRow: {
    width: "100%",
    minHeight: 44,
    gap: Spacing.two,
    borderRadius: 8,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  notificationIcon: {
    fontSize: 20,
    lineHeight: 28,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
  },
  description: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  metadataText: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  markAsReadAction: {
    width: "100%",
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
  },
  markAsReadText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  readStatus: {
    minHeight: 44,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});
