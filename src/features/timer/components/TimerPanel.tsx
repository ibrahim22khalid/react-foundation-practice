import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export function TimerPanel() {
  useEffect(() => {
    console.log("[Timer] Interval started");

    const intervalId = setInterval(() => {
      console.log("[Timer] Tick");
    }, 1000);

    return () => {
      clearInterval(intervalId);
      console.log("[Timer] Interval cleared");
    };
  }, []);

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Timer is running</Text>
      <Text style={styles.description}>
        Watch the development console for one log per second.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  title: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: "#4b5563",
    fontSize: 14,
  },
});
