export type TourRequestState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "validation-error"; message: string };

export const initialTourRequestState: TourRequestState = { status: "idle" };
