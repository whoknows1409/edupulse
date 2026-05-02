import client from "prom-client";

type MetricsGlobal = typeof globalThis & {
  metricsInitialized?: boolean;
};

const globalForMetrics = globalThis as MetricsGlobal;

export const initMetrics = () => {
  if (globalForMetrics.metricsInitialized) {
    return;
  }

  client.collectDefaultMetrics({
    prefix: "edupulse_",
  });
  globalForMetrics.metricsInitialized = true;
};

export const metricsRegistry = client.register;
