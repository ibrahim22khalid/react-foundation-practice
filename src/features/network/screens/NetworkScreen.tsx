import { useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyView } from "../components/EmptyView";
import { ErrorView } from "../components/ErrorView";
import { LearningCard } from "../components/LearningCard";
import { LoadingView } from "../components/LoadingView";

export type LoaderMode = "success" | "empty" | "error";

export type NetworkLearningItem = {
  id: number;
  title: string;
  completed: boolean;
};

export type NetworkLoader = (
  mode: LoaderMode,
) => Promise<NetworkLearningItem[]>;

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

const fakeLoadItems: NetworkLoader = async (mode) => {
  await new Promise<void>((resolve) => setTimeout(resolve, 800));

  if (mode === "error") {
    throw new Error("The fake loader failed intentionally.");
  }

  if (mode === "empty") {
    return [];
  }

  return SUCCESS_ITEMS;
};

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

type NetworkLabProps = {
  loader: NetworkLoader;
};

export function NetworkLab({ loader }: NetworkLabProps) {
  const [requestState, setRequestState] = useState<AsyncState>({
    status: "idle",
  });

  const visibleStatus =
    requestState.status === "success" && requestState.items.length === 0
      ? "empty"
      : requestState.status;

  async function loadItems(mode: LoaderMode) {
    setRequestState({ status: "loading" });

    try {
      const returnedItems = await loader(mode);

      setRequestState({
        status: "success",
        items: returnedItems,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      setRequestState({
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
            onPress={() => void loadItems("success")}
            disabled={requestState.status === "loading"}
          />
          <Button
            title="Empty"
            onPress={() => void loadItems("empty")}
            disabled={requestState.status === "loading"}
          />
          <Button
            title="Error"
            color="#dc2626"
            onPress={() => void loadItems("error")}
            disabled={requestState.status === "loading"}
          />
        </View>

        <View style={styles.result}>{renderResult(requestState)}</View>
      </View>
    </SafeAreaView>
  );
}

export default function NetworkScreen() {
  return <NetworkLab loader={fakeLoadItems} />;
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
