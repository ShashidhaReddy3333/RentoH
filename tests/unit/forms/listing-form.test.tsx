import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { ListingFormState } from "@/app/(app)/listings/new/actions";
import ListingForm from "@/components/forms/ListingForm";
import type { ListingFormValues } from "@/lib/validation/listingSchema";

vi.mock("@/components/ListingImageUploader", () => ({
  __esModule: true,
  default: ({ value = [], onChange }: { value: unknown[]; onChange: (images: unknown[]) => void }) => (
    <div>
      <span data-testid="image-count">{value.length}</span>
      <button type="button" onClick={() => onChange([{ key: "mock", url: "/mock.jpg", isCover: true }])}>
        Add mock image
      </button>
    </div>
  )
}));

beforeAll(() => {
  (window as typeof window & { scrollTo: () => void }).scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  if (!window.requestAnimationFrame) {
    (window as typeof window & { requestAnimationFrame: (cb: FrameRequestCallback) => number }).requestAnimationFrame =
      (callback: FrameRequestCallback) => {
        callback(performance.now());
        return 0;
      };
  }
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ListingForm", () => {
  it("submits a valid listing and triggers auto-save for create mode", async () => {
    const onSubmit = vi
      .fn<(values: ListingFormValues) => Promise<ListingFormState>>()
      .mockResolvedValue({ status: "success" });
    const onAutoSave = vi
      .fn<(values: ListingFormValues) => Promise<ListingFormState>>()
      .mockResolvedValue({ status: "auto-saved", timestamp: Date.now() });
    const onSuccess = vi.fn();

    const user = userEvent.setup();

    render(
      <ListingForm
        mode="create"
        onSubmit={onSubmit}
        onAutoSave={onAutoSave}
        onSuccess={onSuccess}
        initialValues={{
          title: "",
          rent: undefined,
          street: "",
          city: "",
          postalCode: "",
          propertyType: "apartment",
          beds: undefined,
          baths: undefined,
          description: ""
        }}
      />
    );

    await user.type(screen.getByLabelText(/listing title/i), "Vitest Tower");
    await user.type(screen.getByLabelText(/monthly rent/i), "2400");
    await user.type(screen.getByLabelText(/bedrooms/i), "2");
    await user.type(screen.getByLabelText(/bathrooms/i), "2");
    await user.type(screen.getByLabelText(/street address/i), "123 Main Street");
    await user.type(screen.getByLabelText(/city/i), "Kitchener");
    await user.type(screen.getByLabelText(/postal code/i), "N2G 1G2");
    await user.type(screen.getByLabelText(/description/i), "Spacious unit with skyline views.");
    await user.click(screen.getByRole("button", { name: /add mock image/i }));

    await waitFor(() => expect(screen.getByTestId("image-count")).toHaveTextContent("1"));

    // Allow debounced auto-save to fire before submit.
    await new Promise((resolve) => setTimeout(resolve, 1300));
    await waitFor(() => expect(onAutoSave).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: /publish listing/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submissionCall = onSubmit.mock.calls.at(-1);
    expect(submissionCall).toBeDefined();
    const [submission] = submissionCall!;
    expect(submission.title).toBe("Vitest Tower");
    expect(submission.rent).toBe(2400);
    expect(submission.beds).toBe(2);
    expect(submission.baths).toBe(2);
    expect(submission.city).toBe("Kitchener");
    const imageKeys = submission.images ?? [];
    expect(imageKeys).toContain("mock");
    const coverKey = submission.coverImageKey!;
    expect(coverKey).toBe("mock");

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ status: "success" }));
  });

  it("surfaces validation errors when required fields are missing", async () => {
    const onSubmit = vi
      .fn<(values: ListingFormValues) => Promise<ListingFormState>>()
      .mockResolvedValue({ status: "success" });
    const user = userEvent.setup();

    render(<ListingForm mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /publish listing/i }));

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });
});
