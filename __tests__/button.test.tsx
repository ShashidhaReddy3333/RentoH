import React from "react";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Button } from "@/components/ui/button";

test("renders primary button", () => {
  render(<Button>Click</Button>);
  expect(screen.getByRole("button", { name: "Click" })).toBeInTheDocument();
});
