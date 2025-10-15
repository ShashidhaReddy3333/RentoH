import React from "react";

export default function Section({children,className=""}:{children:React.ReactNode;className?:string}) {
  return (
    <section className="py-section">
      <div className={`mx-auto max-w-container px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
    </section>
  );
}
