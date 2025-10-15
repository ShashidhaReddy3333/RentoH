import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Params = { params: { id: string } };

export default async function PropertyDetail({ params }: Params) {
  const { id } = params;
  // TODO: fetch single property
  return (
    <article className="grid gap-6 text-textc md:grid-cols-2">
      <Card className="aspect-video">
        <span className="sr-only">Listing media placeholder</span>
      </Card>
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-textc">Listing #{id}</h1>
        <p className="text-textc/70">$1,800 / month · Waterloo</p>
        <p className="text-sm text-textc/80">
          Cozy two-bedroom apartment near transit and shopping.
        </p>
        <button className={buttonStyles({ variant: "outline" })}>Contact Landlord</button>
      </div>
    </article>
  );
}
