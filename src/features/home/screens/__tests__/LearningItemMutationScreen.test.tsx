import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from "@testing-library/react-native";

import {
  createTestQueryClient,
  createTestQueryWrapper,
} from "../../../../test/create-test-query-client";
import * as learningItemsApi from "../../api/learningItems";
import type { LearningItem } from "../../types/learningItem";
import LearningItemMutationScreen, {
  type SuccessStrategy,
} from "../LearningItemMutationScreen";

async function renderMutationScreen(
  initialSuccessStrategy: SuccessStrategy = "server-response",
) {
  const queryClient = createTestQueryClient();
  const wrapper = createTestQueryWrapper(queryClient);
  const view = await render(
    <LearningItemMutationScreen
      initialSuccessStrategy={initialSuccessStrategy}
    />,
    { wrapper },
  );

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

  test("server-response displays the returned item without another list request", async () => {
    const initialItem: LearningItem = {
      id: "lesson-test",
      title: "Initial learning item",
      minutes: 30,
      completed: false,
    };
    const returnedServerItem: LearningItem = {
      ...initialItem,
      title: "Returned server item",
      completed: true,
    };
    const listSpy = jest
      .spyOn(learningItemsApi, "listLearningItems")
      .mockResolvedValue([initialItem]);
    jest
      .spyOn(learningItemsApi, "setLearningItemCompleted")
      .mockResolvedValue(returnedServerItem);
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    const { queryClient, view } = await renderMutationScreen("server-response");

    try {
      expect(await screen.findByText("Initial learning item")).toBeOnTheScreen();

      await user.press(
        screen.getByRole("button", { name: "Mark as complete" }),
      );

      expect(await screen.findByText("Returned server item")).toBeOnTheScreen();
      expect(screen.getByText("Lesson completed")).toBeOnTheScreen();
      expect(listSpy).toHaveBeenCalledTimes(1);
    } finally {
      await view.unmount();
      queryClient.clear();
    }
  });

  test("invalidation waits for another list request and displays its value", async () => {
    const initialItem: LearningItem = {
      id: "lesson-test",
      title: "Initial learning item",
      minutes: 30,
      completed: false,
    };
    const returnedServerItem: LearningItem = {
      ...initialItem,
      title: "Mutation response item",
      completed: true,
    };
    const refetchedItem: LearningItem = {
      ...returnedServerItem,
      title: "Refetched learning item",
    };
    let resolveRefetch: (items: LearningItem[]) => void = () => undefined;
    const refetchPromise = new Promise<LearningItem[]>((resolve) => {
      resolveRefetch = resolve;
    });
    const listSpy = jest
      .spyOn(learningItemsApi, "listLearningItems")
      .mockResolvedValueOnce([initialItem])
      .mockReturnValueOnce(refetchPromise);
    jest
      .spyOn(learningItemsApi, "setLearningItemCompleted")
      .mockResolvedValue(returnedServerItem);
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    const { queryClient, view } = await renderMutationScreen("invalidate");

    try {
      expect(await screen.findByText("Initial learning item")).toBeOnTheScreen();

      await user.press(
        screen.getByRole("button", { name: "Mark as complete" }),
      );

      await waitFor(() => {
        expect(listSpy).toHaveBeenCalledTimes(2);
      });
      expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
      expect(screen.queryByText("Mutation response item")).not.toBeOnTheScreen();

      await act(async () => {
        resolveRefetch([refetchedItem]);
      });

      expect(await screen.findByText("Refetched learning item")).toBeOnTheScreen();
      expect(screen.getByText("Lesson completed")).toBeOnTheScreen();
      expect(listSpy).toHaveBeenCalledTimes(2);
    } finally {
      await view.unmount();
      queryClient.clear();
    }
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
