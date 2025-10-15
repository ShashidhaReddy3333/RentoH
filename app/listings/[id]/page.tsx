import PropertyDetailClient from "./property-detail-client";

type Props = {
  params: { id: string };
};

export default function PropertyDetailPage({ params }: Props) {
  return <PropertyDetailClient id={params.id} />;
}
