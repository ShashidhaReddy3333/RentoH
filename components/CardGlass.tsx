import React from "react";

export default function CardGlass({children,className=""}:{children:React.ReactNode;className?:string}) {
  return (
    <div className={`rounded-card border border-white/10 bg-white/5 backdrop-blur-md shadow-sm ${className}`}>
      {children}
    </div>
  );
}
