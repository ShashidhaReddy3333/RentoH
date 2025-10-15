import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="container space-y-6 py-10 text-textc">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-textc">Contact Support</h1>
        <p className="text-sm text-textc/70">
          Need help with your account or listings? Reach out and we will follow up shortly.
        </p>
      </header>
      <Card>
        <CardContent className="space-y-3 text-sm text-textc/70">
          <p>
            Send us a message anytime at{" "}
            <a className="text-brand.blue hover:text-brand.primary hover:underline" href="mailto:support@rentobridge.com">
              support@rentobridge.com
            </a>
            .
          </p>
          <p>
            You can also explore our browse and dashboard features to manage your listings and
            track tenant engagement directly within the platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
