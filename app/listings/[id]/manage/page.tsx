import ManageListingClient from "./property-manage-client";
import type { Property } from "@/lib/mock";

type Props = {
  params: { id: string };
};

export default function ManageListingPage({ params }: Props) {
  return <ManageListingClient id={params.id} />;
}
