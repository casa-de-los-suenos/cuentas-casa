import { pgEnum } from "drizzle-orm/pg-core";

export const organizationEnum = pgEnum("organization", [
  "casa_de_los_suenos",
  "trece_cerros",
  "calienta_espiritus",
  "tenzo",
  "pecoreos",
  "high_dose",
  "anyeli",
]);

export const organizationEnumValues = organizationEnum.enumValues;

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "qr_code",
  "mixed",
]);
