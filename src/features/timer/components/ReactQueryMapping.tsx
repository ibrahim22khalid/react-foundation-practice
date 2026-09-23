import { StyleSheet, Text, View } from "react-native";

const MAPPING = [
  "React Query replaced the manually stored loading, success, error, and result state with query status, data, and error values.",
  "It replaced the manual Effect dependency, stale-result guard, request handlers, and cleanup orchestration.",
  "React Query now creates the AbortSignal, while the query function passes it to the fake search function that consumes it.",
  "The manual version had no keyed cache or freshness policy, while React Query caches each normalized term and keeps its data fresh for 60 seconds.",
  "The draft input, submitted search term, and validation message remain local component state.",
  "React Query does not replace all component state because it manages asynchronous request data rather than every user-interface interaction.",
] as const;

export function ReactQueryMapping() {
  return (
    <View style={styles.mapping}>
      <Text style={styles.heading}>Manual Effect vs React Query</Text>
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
