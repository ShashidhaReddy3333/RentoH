import type { Metadata } from "next";
import SignUpClient from "./SignUpClient";

export const metadata: Metadata = {
  title: "Sign up - Rento",
  description: "Create an account to list or find rentals"
};

export default function SignUpPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <SignUpClient />
    </div>
  );
}
