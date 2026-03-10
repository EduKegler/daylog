"use client";

import { useReportWebVitals } from "next/web-vitals";

function onMetric(metric: Parameters<Parameters<typeof useReportWebVitals>[0]>[0]) {
  if (process.env.NODE_ENV === "development") {
    console.log(metric.name, Math.round(metric.value), "ms", metric.rating);
  }
}

export function WebVitals() {
  useReportWebVitals(onMetric);
  return null;
}
