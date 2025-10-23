import React from "react";

export function H1({children,className=""}:{children:React.ReactNode;className?:string}) {
  return <h1 className={`text-h1 text-textc ${className}`}>{children}</h1>;
}
export function H2({children,className=""}:{children:React.ReactNode;className?:string}) {
  return <h2 className={`text-h2 text-textc ${className}`}>{children}</h2>;
}
export function H3({children,className=""}:{children:React.ReactNode;className?:string}) {
  return <h3 className={`text-h3 text-textc ${className}`}>{children}</h3>;
}
