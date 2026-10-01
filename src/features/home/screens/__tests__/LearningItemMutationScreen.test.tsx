import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native";

import {
  createTestQueryClient,
  createTestQueryWrapper,
} from "../../../../test/create-test-query-client";
import * as learningItemsApi from "../../api/learningItems";
import LearningItemMutationScreen from "../LearningItemMutationScreen";

async function renderMutationScreen() {
  const queryClient = createTestQueryClient();
  const wrapper = createTestQueryWrapper(queryClient);
  const view = await render(<LearningItemMutationScreen />, { wrapper });

  return { queryClient, view };
}

describe("LearningItemMutationScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    learningItemsApi.resetLearningItemsApi();
    learningItemsApi.setLearningItemMutationDelay(1_000);
  });

  afterEach(() => {
    learningItemsApi.resetLearningItemsApi();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test("disables duplicate completion while pending and shows the server result", async () => {
    const setCompletedSpy = jest.spyOn(
      learningItemsApi,
      "setLearningItemCompleted",
    );
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    const { queryClient, view } = await renderMutationScreen();

    try {
      const itemTitle = await screen.findByText("State and event handlers");
      const itemCard = itemTitle.parent;

      if (itemCard === null) {
        throw new Error("The learning item card was not rendered.");
      }

      const item = within(itemCard);
      const completionAction = item.getByRole("button", {
        name: "Mark as complete",
      });

      await user.press(completionAction);

      const pendingAction = item.getByRole("button", { name: "Saving..." });
      expect(pendingAction).toBeDisabled();

      fireEvent.press(pendingAction);

      expect(setCompletedSpy).toHaveBeenCalledTimes(1);
      expect(setCompletedSpy.mock.calls[0]?.[0]).toEqual({
        itemId: "lesson-2",
        completed: true,
      });

      await act(async () => {
        jest.advanceTimersByTime(1_000);
      });

      expect(await item.findByText("Lesson completed")).toBeOnTheScreen();
      expect(
        item.getByRole("button", { name: "Set completed again" }),
      ).toBeEnabled();
    } finally {
      await view.unmount();
      queryClient.clear();
    }
  });

  test("keeps the item unchanged after failure and retries the original variables", async () => {
    const setCompletedSpy = jest.spyOn(
      learningItemsApi,
      "setLearningItemCompleted",
    );
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    const { queryClient, view } = await renderMutationScreen();

    try {
      const itemTitle = await screen.findByText("State and event handlers");
      const itemCard = itemTitle.parent;

      if (itemCard === null) {
        throw new Error("The learning item card was not rendered.");
      }

      const item = within(itemCard);

      await user.press(
        screen.getByRole("button", { name: "Fail next mutation" }),
      );
      await user.press(
        item.getByRole("button", { name: "Mark as complete" }),
      );

      await act(async () => {
        jest.advanceTimersByTime(1_000);
      });

      expect(
        await screen.findByText(
          "Save failed: The learning item could not be updated. Please try again.",
        ),
      ).toBeOnTheScreen();
      expect(item.getByText("Not completed yet")).toBeOnTheScreen();
      expect(setCompletedSpy).toHaveBeenCalledTimes(1);

      const originalVariables = setCompletedSpy.mock.calls[0]?.[0];
      expect(originalVariables).toEqual({
        itemId: "lesson-2",
        completed: true,
      });

      await user.press(
        screen.getByRole("button", { name: "Retry save" }),
      );

      expect(setCompletedSpy).toHaveBeenCalledTimes(2);
      expect(setCompletedSpy.mock.calls[1]?.[0]).toEqual(originalVariables);

      await act(async () => {
        jest.advanceTimersByTime(1_000);
      });

      expect(await item.findByText("Lesson completed")).toBeOnTheScreen();
      expect(screen.queryByText(/^Save failed:/)).not.toBeOnTheScreen();
    } finally {
      await view.unmount();
      queryClient.clear();
    }
  });
});
