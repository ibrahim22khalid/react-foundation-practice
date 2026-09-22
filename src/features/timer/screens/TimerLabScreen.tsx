import { useState } from "react";
import { Button, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReactQueryMapping } from "../components/ReactQueryMapping";
import { SearchEffectLab } from "../components/SearchEffectLab";
import { TimerPanel } from "../components/TimerPanel";

export default function TimerLabScreen() {
  const [showTimer, setShowTimer] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.heading}>Timer Lab</Text>
        <Text style={styles.experiment}>Experiment B: cleanup enabled</Text>
        <Button
          title={showTimer ? "Hide Timer" : "Show Timer"}
          onPress={() => setShowTimer((isVisible) => !isVisible)}
        />
        {showTimer ? <TimerPanel /> : null}
        <SearchEffectLab />
        <ReactQueryMapping />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  screen: {
    flexGrow: 1,
    gap: 20,
    padding: 24,
  },
  heading: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
  },
  experiment: {
    color: "#b45309",
    fontSize: 16,
    fontWeight: "600",
  },
});
