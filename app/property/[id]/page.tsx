type Params = { params: { id: string } };

export default async function PropertyDetail({ params }: Params){
  const { id } = params;
  // TODO: fetch single property
  return (
    <article className="grid gap-6 md:grid-cols-2">
      <div className="card aspect-video" />
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Listing #{id}</h1>
        <p className="text-gray-600">$1,800 / month • Waterloo</p>
        <p className="text-sm text-gray-700">
          Cozy two-bedroom apartment near transit and shopping.
        </p>
        <button className="btn btn-secondary">Contact Landlord</button>
      </div>
    </article>
  );
}
