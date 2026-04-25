import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizationEnum } from "@/domains/shared/models/enums";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization: organizationEnum("organization").notNull(),
    name: text("name").notNull(),
    visible: boolean("visible").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    organizationNameUnique: uniqueIndex("products_org_name_unique").on(
      table.organization,
      table.name
    ),
  })
);

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
}));

// Forward declaration import workaround
import { productVariants } from "./productVariant";
