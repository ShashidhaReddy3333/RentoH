import ManageListingClient from "./property-manage-client";

type Props = {
  params: { id: string };
};

export default function ManageListingPage({ params }: Props) {
  return <ManageListingClient id={params.id} />;
}
