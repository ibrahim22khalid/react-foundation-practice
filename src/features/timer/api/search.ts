export const SEARCH_TERMS = ["heart", "healing", "error"] as const;

export type SearchTerm = (typeof SEARCH_TERMS)[number];

function createAbortError(): Error {
  const error = new Error("The fake search was aborted.");
  error.name = "AbortError";
  return error;
}

export function fakeSearch(
  term: SearchTerm,
  signal: AbortSignal,
): Promise<string> {
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
