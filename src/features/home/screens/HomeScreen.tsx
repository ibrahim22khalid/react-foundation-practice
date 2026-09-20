import { useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LearningCard } from "../components/LearningCard";
import {
  learningItems as initialLearningItems,
  LearningItem,
} from "../types/learningItem";

const SCREEN_BACKGROUND_COLOR = "#ffffff";

export default function HomeScreen() {
  const [learningItems, setLearningItems] = useState(initialLearningItems);

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
  function handleAddItem() {
    const newItem: LearningItem = {
      id: `lesson-${Date.now()}`,
      title: "New learning item",
      minutes: 30,
      completed: false,
      description: "A newly added learning item.",
    };

    setLearningItems((currentItems) => [...currentItems, newItem]);
  }
  function handleRemove(id: string) {
    setLearningItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  }
  // Derive the completed count from the learningItems state
  const completedCount = learningItems.filter((item) => item.completed).length;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Button title="Add learning item" onPress={handleAddItem} />
        <Text style={styles.completedText}>
          Completed: {completedCount} / {learningItems.length}
        </Text>
        <FlatList
          data={learningItems}
          keyExtractor={(item) => item.id}
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
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: "center",
    backgroundColor: SCREEN_BACKGROUND_COLOR,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  completedText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  listContent: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 16,
    paddingBottom: 16,
  },
});
