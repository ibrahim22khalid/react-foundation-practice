import { StyleSheet, Text, View } from "react-native";

const MAPPING = [
  "The searchTerm Effect dependency would become part of the future query key.",
  "The fakeSearch function would become the future query function.",
  "React Query would manage the loading, data, and error state that is currently stored manually.",
  "The manually created AbortController would be replaced by the AbortSignal that React Query provides to the query function.",
  "The manual experiment has no cache or refetch behavior, while React Query would add configurable caching and refetching.",
] as const;

export function ReactQueryMapping() {
  return (
    <View style={styles.mapping}>
      <Text style={styles.heading}>Manual Effect → React Query</Text>
      {MAPPING.map((sentence, index) => (
        <Text key={sentence} style={styles.sentence}>
          {index + 1}. {sentence}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mapping: {
    gap: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
  },
  heading: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
  },
  sentence: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 22,
  },
});
