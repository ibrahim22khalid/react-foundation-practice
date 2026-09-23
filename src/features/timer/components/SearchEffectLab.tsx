import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

import { fakeSearch, type SearchTerm } from "../api/search";

type SearchRequest = {
  term: SearchTerm;
  attempt: number;
};

type SearchState =
  | { status: "idle" }
  | { status: "loading"; term: SearchTerm }
  | { status: "success"; term: SearchTerm; result: string }
  | { status: "error"; term: SearchTerm; message: string };

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unknown error occurred.";
}

export function SearchEffectLab() {
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(
    null,
  );
  const [searchState, setSearchState] = useState<SearchState>({
    status: "idle",
  });
  // before ignoring stale results, the effect looked like this:
  //   useEffect(() => {
  //   if (searchTerm === null) {
  //     return;
  //   }

  //   fakeSearch(searchTerm).then((result) => {
  //     setSearchState({
  //       status: "success",
  //       term: searchTerm,
  //       result,
  //     });
  //   });
  // }, [searchTerm]);

  useEffect(() => {
    if (searchRequest === null) {
      return;
    }

    const { term, attempt } = searchRequest;
    let ignore = false;
    const controller = new AbortController();

    console.log(`[Search] Attempt ${attempt}: ${term}`);

    fakeSearch(term, controller.signal).then(
      (result) => {
        if (ignore) {
          console.log(`[Search] Ignored stale result: ${term}`);
          return;
        }

        setSearchState({ status: "success", term, result });
      },
      (error: unknown) => {
        if (isAbortError(error)) {
          console.log(`[Search] Intentional abort ignored: ${term}`);
          return;
        }

        if (ignore) {
          console.log(`[Search] Ignored stale failure: ${term}`);
          return;
        }

        setSearchState({
          status: "error",
          term,
          message: getErrorMessage(error),
        });
      },
    );

    return () => {
      ignore = true;
      console.log(`[Search] Cleanup aborting attempt ${attempt}: ${term}`);
      controller.abort();
    };
  }, [searchRequest]);

  function handleSearch(term: SearchTerm) {
    setSearchState({ status: "loading", term });
    setSearchRequest((currentRequest) => ({
      term,
      attempt: (currentRequest?.attempt ?? 0) + 1,
    }));
  }

  return (
    <View style={styles.lab}>
      <Text style={styles.heading}>Stale Search Lab</Text>
      <Text style={styles.experiment}>Lesson 1: repeatable search attempts</Text>
      <Text style={styles.description}>
        Search healing, wait for success, then search healing again.
      </Text>
      <Text style={styles.term}>
        Current search: {searchRequest?.term ?? "(none)"}
      </Text>
      <Text style={styles.term}>
        Request attempt: {searchRequest?.attempt ?? 0}
      </Text>

      <View style={styles.actions}>
        <Button title="Search heart" onPress={() => handleSearch("heart")} />
        <Button
          title="Search healing"
          onPress={() => handleSearch("healing")}
        />
        <Button title="Simulate error" onPress={() => handleSearch("error")} />
      </View>

      {searchState.status === "idle" ? (
        <Text style={styles.status}>Choose a search to begin.</Text>
      ) : null}

      {searchState.status === "loading" ? (
        <Text style={styles.status}>Searching for {searchState.term}...</Text>
      ) : null}

      {searchState.status === "success" ? (
        <View style={styles.resultPanel}>
          <Text style={styles.resultLabel}>Result for {searchState.term}</Text>
          <Text style={styles.result}>{searchState.result}</Text>
        </View>
      ) : null}

      {searchState.status === "error" ? (
        <Text style={styles.error}>
          Search failed for {searchState.term}: {searchState.message}
        </Text>
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
  description: {
    color: "#4b5563",
    fontSize: 14,
  },
  experiment: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "700",
  },
  term: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    gap: 8,
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
