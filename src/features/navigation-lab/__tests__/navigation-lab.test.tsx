import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";

import NavigationLabDetailRoute from "@/app/navigation-lab/[id]";
import NavigationLabListRoute from "@/app/navigation-lab";

describe("navigation lab", () => {
  test("shows the learning-item list first", async () => {
    await renderRouter(
      {
        "navigation-lab/index": NavigationLabListRoute,
        "navigation-lab/[id]": NavigationLabDetailRoute,
      },
      { initialUrl: "/navigation-lab" },
    );

    expect(screen.getByText("Learning items")).toBeOnTheScreen();
  });

  test("opens the selected learning item's detail route", async () => {
    const user = userEvent.setup();

    await renderRouter(
      {
        "navigation-lab/index": NavigationLabListRoute,
        "navigation-lab/[id]": NavigationLabDetailRoute,
      },
      { initialUrl: "/navigation-lab" },
    );

    await user.press(
      screen.getByRole("button", { name: /Screen Focus/ }),
    );

    await screen.findByText("Local count: 0");

    expect(screen.getByText("Screen Focus")).toBeOnTheScreen();
    expect(screen.getByText("45 minutes")).toBeOnTheScreen();
    expect(screen.queryByText("Understanding Effects")).not.toBeOnTheScreen();
  });

  test("opens the matching item from a valid deep link", async () => {
    await renderRouter(
      {
        "navigation-lab/index": NavigationLabListRoute,
        "navigation-lab/[id]": NavigationLabDetailRoute,
      },
      { initialUrl: "/navigation-lab/effects" },
    );

    expect(
      await screen.findByText("Understanding Effects"),
    ).toBeOnTheScreen();
    expect(screen.getByText("ID: effects")).toBeOnTheScreen();
    expect(screen.getByText("40 minutes")).toBeOnTheScreen();
  });

  test("shows the unknown-item state for an invalid deep link", async () => {
    await renderRouter(
      {
        "navigation-lab/index": NavigationLabListRoute,
        "navigation-lab/[id]": NavigationLabDetailRoute,
      },
      { initialUrl: "/navigation-lab/not-real" },
    );

    expect(
      await screen.findByText("Unknown learning item"),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('No learning item matches the ID "not-real".'),
    ).toBeOnTheScreen();
  });
});
