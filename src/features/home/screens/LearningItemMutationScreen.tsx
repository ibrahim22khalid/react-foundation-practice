import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  failNextMutation,
  listLearningItems,
  setLearningItemCompleted,
} from "../api/learningItems";
import { LearningCard } from "../components/LearningCard";
import type { LearningItem } from "../types/learningItem";

const learningItemsQueryKey = ["learning-items"] as const;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The learning item could not be updated.";
}

export default function LearningItemMutationScreen() {
  const queryClient = useQueryClient();
  const [failureArmed, setFailureArmed] = useState(false);

  const learningItemsQuery = useQuery({
    queryKey: learningItemsQueryKey,
    queryFn: listLearningItems,
  });

  const completionMutation = useMutation({
    mutationFn: setLearningItemCompleted,
    retry: false,
    onSuccess: (serverItem) => {
      queryClient.setQueryData<LearningItem[]>(
        learningItemsQueryKey,
        (currentItems) =>
          currentItems?.map((item) =>
            item.id === serverItem.id ? serverItem : item,
          ),
      );
    },
  });

  function handleSetCompleted(itemId: string) {
    setFailureArmed(false);
    completionMutation.mutate({ itemId, completed: true });
  }

  function handleRetry() {
    if (completionMutation.variables) {
      completionMutation.mutate(completionMutation.variables);
    }
  }

  function handleFailNextMutation() {
    failNextMutation();
    setFailureArmed(true);
  }

  const learningItems = learningItemsQuery.data ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={learningItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Learning Item Mutation</Text>
            <Text style={styles.description}>
              Send one explicit final state and wait for the server result.
            </Text>

            {__DEV__ ? (
              <View style={styles.developmentPanel}>
                <Text style={styles.panelHeading}>Development controls</Text>
                <Text>mutation status: {completionMutation.status}</Text>
                <Text>
                  next mutation: {failureArmed ? "forced failure" : "success"}
                </Text>
                <Button
                  title="Fail next mutation"
                  onPress={handleFailNextMutation}
                />
              </View>
            ) : null}

            {learningItemsQuery.isPending ? (
              <Text>Loading learning items...</Text>
            ) : null}

            {learningItemsQuery.isError ? (
              <Text style={styles.error}>
                Unable to load learning items: {getErrorMessage(learningItemsQuery.error)}
              </Text>
            ) : null}

            {completionMutation.isError ? (
              <View style={styles.errorPanel}>
                <Text style={styles.error}>
                  Save failed: {getErrorMessage(completionMutation.error)}
                </Text>
                <Button title="Retry save" onPress={handleRetry} />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const isTargetPending =
            completionMutation.isPending &&
            completionMutation.variables.itemId === item.id;

          return (
            <LearningCard
              title={item.title}
              minutes={item.minutes}
              completed={item.completed}
              description={item.description}
              onComplete={() => handleSetCompleted(item.id)}
              allowCompletedAction
              isCompletionPending={isTargetPending}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flexGrow: 1,
    gap: 16,
    width: "100%",
    maxWidth: 420,
    padding: 16,
    alignSelf: "center",
  },
  header: {
    gap: 12,
  },
  heading: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    color: "#4b5563",
    fontSize: 15,
  },
  developmentPanel: {
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },
  panelHeading: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
  errorPanel: {
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
  },
  error: {
    color: "#b91c1c",
  },
});
