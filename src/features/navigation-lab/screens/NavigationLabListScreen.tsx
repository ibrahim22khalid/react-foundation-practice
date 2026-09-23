import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { navigationLearningItems } from "../data/learningItems";
import type { NavigationLearningItem } from "../data/learningItems";

export default function NavigationLabListScreen() {
  const router = useRouter();

  function handleSelectItem(item: NavigationLearningItem) {
    router.push({
      pathname: "/navigation-lab/[id]",
      params: { id: item.id },
    });
  }

  function handleOpenUnknownItem() {
    router.push({
      pathname: "/navigation-lab/[id]",
      params: { id: "not-real" },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={navigationLearningItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Learning items</Text>
            <Text style={styles.description}>
              Select an item to open its dynamic detail route.
            </Text>
          </View>
        }
        ListFooterComponent={
          <Pressable
            accessibilityRole="button"
            onPress={handleOpenUnknownItem}
            style={({ pressed }) => [
              styles.unknownAction,
              pressed && styles.pressedItem,
            ]}
          >
            <Text style={styles.unknownActionText}>Open unknown item</Text>
          </Pressable>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => handleSelectItem(item)}
            style={({ pressed }) => [
              styles.item,
              pressed && styles.pressedItem,
            ]}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.metadata}>ID: {item.id}</Text>
            <Text style={styles.metadata}>{item.minutes} minutes</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  list: {
    gap: 12,
    padding: 20,
  },
  header: {
    gap: 6,
    marginBottom: 8,
  },
  heading: {
    color: "#111827",
    fontSize: 26,
    fontWeight: "700",
  },
  description: {
    color: "#4b5563",
    fontSize: 15,
  },
  item: {
    gap: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  pressedItem: {
    opacity: 0.65,
  },
  title: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  metadata: {
    color: "#4b5563",
    fontSize: 14,
  },
  unknownAction: {
    alignItems: "center",
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#b91c1c",
    borderRadius: 10,
  },
  unknownActionText: {
    color: "#b91c1c",
    fontSize: 15,
    fontWeight: "700",
  },
});
