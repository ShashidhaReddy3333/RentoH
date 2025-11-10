type ListingStateMetadata = {
  listingId?: string;
};

export type ListingFormState =
  | ({ status: "idle" } & ListingStateMetadata)
  | ({ status: "success" } & ListingStateMetadata)
  | ({ status: "error"; message: string } & ListingStateMetadata)
  | ({ status: "auto-saved"; timestamp: number } & ListingStateMetadata)
  | ({
      status: "validation-error";
      message: string;
      fieldErrors: Record<string, string[]>;
      formErrors?: string[];
      validationSummary?: string;
    } & ListingStateMetadata);
