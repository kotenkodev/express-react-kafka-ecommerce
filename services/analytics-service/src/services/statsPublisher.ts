export function startStatsPublisher(
  publish: () => Promise<void>,
  onError: (error: unknown) => void,
  intervalMs = 5_000,
) {
  let inFlight: Promise<void> | undefined;
  const timer = setInterval(() => {
    if (inFlight) return;
    inFlight = Promise.resolve().then(publish).catch(onError).finally(() => {
      inFlight = undefined;
    });
  }, intervalMs);
  return async () => {
    clearInterval(timer);
    await inFlight;
  };
}
