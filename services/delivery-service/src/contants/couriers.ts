export const COURIERS = [
  "Іван",
  "Марія",
  "Олег",
  "Аня",
  "Тарас",
  "Оля",
] as const;

export const getRandomCourier = (): (typeof COURIERS)[number] => {
  const randomIndex = Math.floor(Math.random() * COURIERS.length);
  return COURIERS[randomIndex];
};
