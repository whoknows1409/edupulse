import { initMetrics, metricsRegistry } from "@/lib/metrics";

export const GET = async () => {
  initMetrics();
  const metrics = await metricsRegistry.metrics();
  return new Response(metrics, {
    headers: {
      "Content-Type": metricsRegistry.contentType,
    },
  });
};
