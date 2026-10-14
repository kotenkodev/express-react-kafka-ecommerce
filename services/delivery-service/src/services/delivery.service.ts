import { sleep } from "@ecommerce/shared";
import { getRandomCourier } from "../contants/couriers";
import { publishOrderStatusUpdate } from "../producers/status.producer";

const STAGES = ["PREPARING", "SHIPPED", "DELIVERED"] as const;

export async function processDelivery(orderId: string): Promise<void> {
  const courier = getRandomCourier();
  console.log(`[Delivery] Assigned courier "${courier}" to order: ${orderId}`);

  for (const status of STAGES) {
    await publishOrderStatusUpdate({
      orderId,
      status: status,
      courier,
      updatedAt: new Date().toISOString(),
    });

    console.log(
      `[Delivery] Order ${orderId} -> ${status} (Courier: ${courier})`,
    );

    if (status !== "DELIVERED") {
      await sleep(5000);
    }
  }
  console.log(
    `[Delivery] Order ${orderId} successfully completed delivery flow.`,
  );
}
