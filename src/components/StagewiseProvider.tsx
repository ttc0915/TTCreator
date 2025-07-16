"use client";

import { StagewiseToolbar } from "@stagewise/toolbar-next";
import ReactPlugin from "@stagewise-plugins/react";
import { useState, useEffect } from "react";

export function StagewiseProvider() {
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    // This check runs only on the client side
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      setIsLocal(true);
    }
  }, []);

  if (!isLocal) {
    return null; // Don't render the toolbar on non-local devices
  }

  return <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />;
} 