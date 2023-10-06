import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { chats } from "./chats";

export const tickets = sqliteTable(
  "tickets",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    assigned_employee_id: text("assigned_employee_id"),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    status: text("status", {
      enum: ["open", "closed"],
    }).notNull(),
    created_at: integer("createdAt", { mode: "timestamp" }).notNull(),
    updated_at: integer("createdAt", { mode: "timestamp" }),
    added_at: integer("createdAt", { mode: "timestamp" }),
  },
  (table) => ({
    status_index: index("status_index").on(table.status),
  }),
);

export const ticketsRelations = relations(tickets, ({ many }) => ({
  chats: many(chats),
}));

export type Ticket = typeof tickets.$inferSelect;
