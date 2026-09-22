import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Topic = "React" | "TypeScript" | "Expo";

export default function EffectLabScreen() {
  const [showDemo, setShowDemo] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic>("React");
  const [showSubscription, setShowSubscription] = useState(true);

  function handleChangeTopic() {
    setSelectedTopic((currentTopic) => {
      if (currentTopic === "React") {
        return "TypeScript";
      }

      if (currentTopic === "TypeScript") {
        return "Expo";
      }

      return "React";
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.heading}>Effect Lab</Text>
        <Button
          title={showDemo ? "Hide Effect Demo" : "Show Effect Demo"}
          onPress={() => setShowDemo((isVisible) => !isVisible)}
        />
        {showDemo ? <EffectDemo /> : null}

        <View style={styles.subscriptionLab}>
          <Text style={styles.subheading}>Topic Subscription</Text>
          <Text style={styles.topic}>Selected topic: {selectedTopic}</Text>
          <Button title="Change Topic" onPress={handleChangeTopic} />
          <Button
            title={
              showSubscription ? "Hide Subscription" : "Show Subscription"
            }
            onPress={() => setShowSubscription((isVisible) => !isVisible)}
          />
          {showSubscription ? (
            <TopicSubscription topic={selectedTopic} />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

type TopicSubscriptionProps = {
  topic: Topic;
};

function TopicSubscription({ topic }: TopicSubscriptionProps) {
  useEffect(() => {
    if (__DEV__) {
      console.log(`Subscribed to ${topic}`);
    }

    return () => {
      if (__DEV__) {
        console.log(`Unsubscribed from ${topic}`);
      }
    };
  }, [topic]);

  return <Text style={styles.subscription}>Subscribed to {topic}</Text>;
}

function EffectDemo() {
  const [count, setCount] = useState(0);
  const [draftText, setDraftText] = useState("");

  if (__DEV__) {
    console.log("[Effect Lab] Component render", { count, draftText });
  }

  // Experiment A
  // useEffect(() => {
  //   console.log("Setup", { count, draftText });

  //   return () => {
  //     console.log("Cleanup", { count, draftText });
  //   };
  // });

  // Experiment B
  // useEffect(() => {
  //   console.log("Setup");

  //   return () => {
  //     console.log("Cleanup");
  //   };
  // }, []);
  // Experiment C
  useEffect(() => {
    console.log("Setup", count);

    return () => {
      console.log("Cleanup", count);
    };
  }, [count]);

  function handleIncrement() {
    if (__DEV__) {
      console.log("[Effect Lab] Increment event handler");
    }

    setCount((currentCount) => currentCount + 1);
  }

  return (
    <View style={styles.demo}>
      <View style={styles.section}>
        <Text style={styles.value}>Count: {count}</Text>
        <Button title="Increment" onPress={handleIncrement} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Draft text</Text>
        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          placeholder="Type something"
          style={styles.input}
        />
        <Text style={styles.preview}>
          Current draft: {draftText || "(empty)"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  screen: {
    flex: 1,
    gap: 24,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  heading: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
  },
  subheading: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  demo: {
    gap: 24,
  },
  subscriptionLab: {
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
  },
  topic: {
    color: "#374151",
    fontSize: 16,
  },
  subscription: {
    color: "#047857",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    gap: 12,
  },
  value: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "600",
  },
  label: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 8,
    color: "#111827",
  },
  preview: {
    color: "#6b7280",
    fontSize: 14,
  },
});
