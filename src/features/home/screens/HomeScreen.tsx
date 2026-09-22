import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LearningCard } from "../components/LearningCard";
import { LearningItemForm } from "../components/LearningItemForm";
import { learningItems as initialLearningItems } from "../types/learningItem";
import type { LearningItem, NewLearningItemInput } from "../types/learningItem";

const SCREEN_BACKGROUND_COLOR = "#ffffff";

export default function HomeScreen() {
  const [learningItems, setLearningItems] = useState(initialLearningItems);
  const completedCount = learningItems.filter((item) => item.completed).length;
  // To replay the derived-state experiment, add useEffect to the React import.
  // const [completedCount, setCompletedCount] = useState(0);

  // if (__DEV__) {
  //   console.log("[Home] Component render", {
  //     completedCount,
  //     itemCount: learningItems.length,
  //   });
  // }

  // useEffect(() => {
  //   const nextCompletedCount = learningItems.filter(
  //     (item) => item.completed,
  //   ).length;

  //   if (__DEV__) {
  //     console.log("[Home] Synchronizing completed count", {
  //       nextCompletedCount,
  //     });
  //   }

  //   setCompletedCount(nextCompletedCount);
  // }, [learningItems]);

  function handleAddMinutes(id: string) {
    setLearningItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, minutes: item.minutes + 5 } : item,
      ),
    );
  }

  function handleComplete(id: string) {
    setLearningItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, completed: true } : item,
      ),
    );
  }
  function handleAddItem(input: NewLearningItemInput) {
    const newItem: LearningItem = {
      id: `lesson-${Date.now()}`,
      ...input,
      completed: false,
    };

    setLearningItems((currentItems) => [...currentItems, newItem]);
  }
  function handleRemove(id: string) {
    setLearningItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <FlatList
          data={learningItems}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.header}>
              <LearningItemForm onSubmit={handleAddItem} />
              <Text style={styles.completedText}>
                Completed: {completedCount} / {learningItems.length}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <LearningCard
              title={item.title}
              minutes={item.minutes}
              completed={item.completed}
              description={item.description}
              onAddMinutes={() => handleAddMinutes(item.id)}
              onComplete={() => handleComplete(item.id)}
              onRemove={() => handleRemove(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: "center",
    backgroundColor: SCREEN_BACKGROUND_COLOR,
  },
  keyboardAvoidingView: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  header: {
    gap: 16,
    marginBottom: 16,
  },
  completedText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  listContent: {
    flexGrow: 1,
    gap: 16,
    padding: 16,
  },
});
