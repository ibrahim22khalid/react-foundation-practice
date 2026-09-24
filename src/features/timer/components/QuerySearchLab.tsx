import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

import {
  fakeSearch,
  SEARCH_TERMS,
  type SearchTerm,
} from "../api/search";

function normalizeSearchTerm(value: string): SearchTerm | null {
  const normalizedValue = value.trim().toLowerCase();
  return SEARCH_TERMS.find((term) => term === normalizedValue) ?? null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unknown error occurred.";
}

export type SearchFunction = typeof fakeSearch;

type QuerySearchLabProps = {
  search?: SearchFunction;
};

export function QuerySearchLab({ search = fakeSearch }: QuerySearchLabProps) {
  const [draftText, setDraftText] = useState("");
  const [normalizedTerm, setNormalizedTerm] = useState<SearchTerm | null>(
    null,
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const searchQuery = useQuery({
    queryKey: ["learning-search", normalizedTerm],
    queryFn: ({ signal }) => {
      if (normalizedTerm === null) {
        throw new Error("A valid search term is required.");
      }

      return search(normalizedTerm, signal);
    },
    enabled: normalizedTerm !== null,
    retry: false,
    staleTime: 60_000,
  });

  function handleSearch() {
    const nextTerm = normalizeSearchTerm(draftText);

    if (nextTerm === null) {
      setValidationMessage("Use heart, healing, or error.");
      return;
    }

    setValidationMessage(null);
    setNormalizedTerm(nextTerm);
  }

  function handleRefetch() {
    if (normalizedTerm === null) {
      return;
    }

    void searchQuery.refetch();
  }

  return (
    <View style={styles.lab}>
      <Text style={styles.heading}>React Query Search Lab</Text>
      <Text style={styles.experiment}>Lesson 3: one basic query</Text>
      <Text style={styles.description}>
        Search for heart, healing, or error. Spaces and letter case are
        normalized before the request.
      </Text>

      <TextInput
        accessibilityLabel="React Query search term"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setDraftText}
        onSubmitEditing={handleSearch}
        placeholder="heart, healing, or error"
        style={styles.input}
        value={draftText}
      />
      <Button title="Search with React Query" onPress={handleSearch} />
      <Button
        disabled={normalizedTerm === null}
        title="Refetch current search"
        onPress={handleRefetch}
      />

      {validationMessage ? (
        <Text style={styles.error}>{validationMessage}</Text>
      ) : null}

      <Text style={styles.term}>
        Current term: {normalizedTerm ?? "(none)"}
      </Text>

      <View style={styles.developmentPanel}>
        <Text style={styles.panelHeading}>Development state</Text>
        <Text style={styles.panelText}>status: {searchQuery.status}</Text>
        <Text style={styles.panelText}>
          fetchStatus: {searchQuery.fetchStatus}
        </Text>
      </View>

      {normalizedTerm === null ? (
        <Text style={styles.status}>Enter a search term to begin.</Text>
      ) : searchQuery.isPending ? (
        <Text style={styles.status}>Searching for {normalizedTerm}...</Text>
      ) : null}

      {searchQuery.isError ? (
        <Text style={styles.error}>
          Search failed for {normalizedTerm}: {getErrorMessage(searchQuery.error)}
        </Text>
      ) : null}

      {searchQuery.isSuccess ? (
        <View style={styles.resultPanel}>
          <Text style={styles.resultLabel}>Result for {normalizedTerm}</Text>
          <Text style={styles.result}>{searchQuery.data}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lab: {
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
  },
  heading: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
  },
  experiment: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "700",
  },
  description: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 8,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  term: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  developmentPanel: {
    gap: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },
  panelHeading: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "700",
  },
  panelText: {
    color: "#1e3a8a",
    fontSize: 14,
  },
  status: {
    color: "#4b5563",
    fontSize: 15,
  },
  resultPanel: {
    gap: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
  },
  resultLabel: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "700",
  },
  result: {
    color: "#065f46",
    fontSize: 15,
  },
  error: {
    color: "#b91c1c",
    fontSize: 15,
  },
});
