import { useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyView } from "../components/EmptyView";
import { ErrorView } from "../components/ErrorView";
import { LearningCard } from "../components/LearningCard";
import { LoadingView } from "../components/LoadingView";

type LoaderMode = "success" | "empty" | "error";

type NetworkLearningItem = {
  id: number;
  title: string;
  completed: boolean;
};

export type AsyncState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; items: NetworkLearningItem[] }
  | { status: "error"; message: string };

const SUCCESS_ITEMS: NetworkLearningItem[] = [
  { id: 1, title: "Components and typed props", completed: true },
  { id: 2, title: "State and event handlers", completed: false },
  { id: 3, title: "Lists and keys", completed: false },
];

async function fakeLoadItems(mode: LoaderMode): Promise<NetworkLearningItem[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, 800));

  if (mode === "error") {
    throw new Error("The fake loader failed intentionally.");
  }

  if (mode === "empty") {
    return [];
  }

  return SUCCESS_ITEMS;
}

function renderResult(state: AsyncState) {
  switch (state.status) {
    case "idle":
      return (
        <Text style={styles.message}>Press a button to begin the request.</Text>
      );

    case "loading":
      return <LoadingView message="Loading learning items..." />;

    case "success":
      if (state.items.length === 0) {
        return <EmptyView message="No learning items were returned." />;
      }

      return (
        <FlatList
          data={state.items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <LearningCard title={item.title} completed={item.completed} />
          )}
          contentContainerStyle={styles.listContent}
        />
      );

    case "error":
      return <ErrorView message={state.message} />;

    default: {
      const unhandledState: never = state;
      return unhandledState;
    }
  }
}

export default function NetworkScreen() {
  const [state, setState] = useState<AsyncState>({ status: "idle" });

  const visibleStatus =
    state.status === "success" && state.items.length === 0
      ? "empty"
      : state.status;

  async function loadItems(mode: LoaderMode) {
    setState({ status: "loading" });

    try {
      const returnedItems = await fakeLoadItems(mode);

      setState({
        status: "success",
        items: returnedItems,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      setState({
        status: "error",
        message,
      });
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Deterministic async loader</Text>
        <Text style={styles.status}>Status: {visibleStatus}</Text>

        <View style={styles.controls}>
          <Button
            title="Success"
            onPress={() => loadItems("success")}
            disabled={state.status === "loading"}
          />
          <Button
            title="Empty"
            onPress={() => loadItems("empty")}
            disabled={state.status === "loading"}
          />
          <Button
            title="Error"
            color="#dc2626"
            onPress={() => loadItems("error")}
            disabled={state.status === "loading"}
          />
        </View>

        <View style={styles.result}>{renderResult(state)}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: 16,
    gap: 16,
  },
  title: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  status: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  controls: {
    gap: 8,
  },
  result: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    color: "#4b5563",
    textAlign: "center",
  },
  listContent: {
    gap: 12,
  },
});
