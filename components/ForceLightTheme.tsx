"use client";

import { useEffect } from "react";

import { useTheme } from "@/app/theme-provider";

export default function ForceLightTheme() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  return null;
}
