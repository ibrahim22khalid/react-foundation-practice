import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { navigationLearningItems } from "../data/learningItems";

type NavigationLabDetailScreenProps = {
  id: string;
};

export default function NavigationLabDetailScreen({
  id,
}: NavigationLabDetailScreenProps) {
  const [localCount, setLocalCount] = useState(0);
  // mount and unmount logging
  useEffect(() => {
    if (__DEV__) {
      console.log("[Navigation Lab] Detail mounted");
    }

    return () => {
      if (__DEV__) {
        console.log("[Navigation Lab] Detail unmounted");
      }
    };
  }, []);
  // focus and blur logging
  useFocusEffect(
    // Keep the callback stable so local state renders do not restart this Effect.
    useCallback(() => {
      if (__DEV__) {
        console.log(`[Navigation Lab] Detail focused: ${id}`);
      }

      return () => {
        if (__DEV__) {
          console.log(`[Navigation Lab] Detail blurred: ${id}`);
        }
      };
    }, [id]),
  );

  // Start and end one view session for the currently focused learning item.
  useFocusEffect(
    useCallback(() => {
      if (__DEV__) {
        console.log(`[Navigation Lab] View session started: ${id}`);
      }

      return () => {
        if (__DEV__) {
          console.log(`[Navigation Lab] View session ended: ${id}`);
        }
      };
    }, [id]),
  );

  const item = navigationLearningItems.find(
    (learningItem) => learningItem.id === id,
  );

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.screen}>
          <Text style={styles.unknownHeading}>Unknown learning item</Text>
          <Text style={styles.description}>
            No learning item matches the ID &quot;{id}&quot;.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <Text style={styles.heading}>{item.title}</Text>
        <Text style={styles.id}>ID: {item.id}</Text>
        <Text style={styles.minutes}>{item.minutes} minutes</Text>
        <View style={styles.localStatePanel}>
          <Text style={styles.localState}>Local count: {localCount}</Text>
          <Button
            title="Increment local count"
            onPress={() => setLocalCount((currentCount) => currentCount + 1)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  screen: {
    flex: 1,
    gap: 8,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  heading: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
  },
  unknownHeading: {
    color: "#b91c1c",
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    color: "#4b5563",
    fontSize: 15,
  },
  id: {
    color: "#4b5563",
    fontSize: 15,
  },
  minutes: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "600",
  },
  localStatePanel: {
    gap: 10,
    marginTop: 16,
  },
  localState: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "600",
  },
});
