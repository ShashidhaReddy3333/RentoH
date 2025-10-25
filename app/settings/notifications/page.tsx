import NotificationsClient from "./NotificationsClient";

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Notification settings</h1>
      <NotificationsClient />
    </div>
  );
}
