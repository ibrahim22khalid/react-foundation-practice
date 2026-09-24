import { act, render, screen, userEvent } from "@testing-library/react-native";

import {
  NetworkLab,
  type NetworkLearningItem,
  type NetworkLoader,
} from "../NetworkScreen";

function createControlledPromise<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Promise resolver is not ready.");
  };

  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe("NetworkLab", () => {
  test("moves from loading to a successful list", async () => {
    const controlled = createControlledPromise<NetworkLearningItem[]>();
    const loader: NetworkLoader = jest.fn(() => controlled.promise);
    const user = userEvent.setup();

    await render(<NetworkLab loader={loader} />);

    await user.press(screen.getByRole("button", { name: "Success" }));

    expect(screen.getByText("Loading learning items...")).toBeOnTheScreen();

    await act(async () => {
      controlled.resolve([
        { id: 1, title: "Components and typed props", completed: true },
        { id: 2, title: "State and event handlers", completed: false },
        { id: 3, title: "Lists and keys", completed: false },
      ]);
    });

    expect(
      await screen.findByText("Components and typed props"),
    ).toBeOnTheScreen();
    expect(
      screen.queryByText("Loading learning items..."),
    ).not.toBeOnTheScreen();
  });

  test("shows the empty interface when the loader returns no items", async () => {
    const loader: NetworkLoader = jest.fn().mockResolvedValue([]);
    const user = userEvent.setup();

    await render(<NetworkLab loader={loader} />);

    await user.press(screen.getByRole("button", { name: "Empty" }));

    expect(
      await screen.findByText("No learning items were returned."),
    ).toBeOnTheScreen();
  });

  test("shows the loader error message when loading fails", async () => {
    const loader: NetworkLoader = jest
      .fn()
      .mockRejectedValue(new Error("Unable to load learning items."));
    const user = userEvent.setup();

    await render(<NetworkLab loader={loader} />);

    await user.press(screen.getByRole("button", { name: "Error" }));

    expect(
      await screen.findByText("Unable to load learning items."),
    ).toBeOnTheScreen();
  });

  test("disables every action while the loader is unresolved", async () => {
    const controlled = createControlledPromise<NetworkLearningItem[]>();
    const loader: NetworkLoader = jest.fn(() => controlled.promise);
    const user = userEvent.setup();

    await render(<NetworkLab loader={loader} />);

    await user.press(screen.getByRole("button", { name: "Success" }));

    expect(screen.getByRole("button", { name: "Success" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Empty" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Error" })).toBeDisabled();

    await act(async () => {
      controlled.resolve([]);
    });

    expect(
      await screen.findByText("No learning items were returned."),
    ).toBeOnTheScreen();
  });
});
