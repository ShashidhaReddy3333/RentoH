import { redirect } from "next/navigation";

type Props = {
  params: { id: string };
};

export default function ListingDetailPlaceholder({ params }: Props) {
  redirect(`/property/${params.id}`);
}
