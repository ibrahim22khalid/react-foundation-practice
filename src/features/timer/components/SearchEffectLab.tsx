import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

type SearchTerm = "heart" | "healing" | "error";

type SearchState =
  | { status: "idle" }
  | { status: "loading"; term: SearchTerm }
  | { status: "success"; term: SearchTerm; result: string }
  | { status: "error"; term: SearchTerm; message: string };

function createAbortError(): Error {
  const error = new Error("The fake search was aborted.");
  error.name = "AbortError";
  return error;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function fakeSearch(term: SearchTerm, signal: AbortSignal): Promise<string> {
  const delay = term === "heart" ? 2500 : term === "healing" ? 300 : 500;

  console.log(`[Search] Started: ${term}`);

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      console.log(`[Search] Aborted: ${term}`);
      reject(createAbortError());
      return;
    }

    const handleAbort = () => {
      clearTimeout(timeoutId);
      console.log(`[Search] Aborted: ${term}`);
      reject(createAbortError());
    };

    const timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);

      if (term === "error") {
        const error = new Error("The fake search failed intentionally.");
        console.log(`[Search] Failed: ${term}`);
        reject(error);
        return;
      }

      const result =
        term === "heart"
          ? "Heart result: a slow lesson about cardiac health."
          : "Healing result: a quick lesson about recovery habits.";

      console.log(`[Search] Completed: ${term}`);
      resolve(result);
    }, delay);

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unknown error occurred.";
}

export function SearchEffectLab() {
  const [searchTerm, setSearchTerm] = useState<SearchTerm | null>(null);
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
    if (searchTerm === null) {
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    fakeSearch(searchTerm, controller.signal).then(
      (result) => {
        if (ignore) {
          console.log(`[Search] Ignored stale result: ${searchTerm}`);
          return;
        }

        setSearchState({ status: "success", term: searchTerm, result });
      },
      (error: unknown) => {
        if (isAbortError(error)) {
          console.log(`[Search] Intentional abort ignored: ${searchTerm}`);
          return;
        }

        if (ignore) {
          console.log(`[Search] Ignored stale failure: ${searchTerm}`);
          return;
        }

        setSearchState({
          status: "error",
          term: searchTerm,
          message: getErrorMessage(error),
        });
      },
    );

    return () => {
      ignore = true;
      console.log(`[Search] Cleanup aborting: ${searchTerm}`);
      controller.abort();
    };
  }, [searchTerm]);

  function handleSearch(term: SearchTerm) {
    setSearchState({ status: "loading", term });
    setSearchTerm(term);
  }

  return (
    <View style={styles.lab}>
      <Text style={styles.heading}>Stale Search Lab</Text>
      <Text style={styles.experiment}>Lesson 4: obsolete work aborted</Text>
      <Text style={styles.description}>
        Start heart, then immediately start healing.
      </Text>
      <Text style={styles.term}>
        Current search: {searchTerm ?? "(none)"}
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
