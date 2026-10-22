import { pgTable, text, timestamp, boolean, integer, uuid, date } from "drizzle-orm/pg-core";

// ภาค
export const RegionEnum = {
  NORTH: "ภาคเหนือ",
  CENTRAL: "ภาคกลาง",
  NORTHEAST: "ภาคตะวันออกเฉียงเหนือ",
  EAST: "ภาคตะวันออก",
  WEST: "ภาคตะวันตก",
  SOUTH: "ภาคใต้",
} as const;

// ตารางจังหวัด (77 จังหวัด Master Data)
export const provinces = pgTable("provinces", {
  id: text("id").primaryKey(), // รหัสจังหวัด เช่น "TH-10" หรือ slug "bangkok"
  nameTh: text("name_th").notNull(),
  nameEn: text("name_en").notNull(),
  region: text("region").notNull(), // เหนือ, กลาง, อีสาน, ตะวันออก, ตะวันตก, ใต้
  svgPath: text("svg_path"), // SVG path d attribute สำหรับเรนเดอร์แผนที่
});

// ตารางบันทึกจังหวัดที่ User เคยไป
export const userVisitedProvinces = pgTable("user_visited_provinces", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // UUID จาก Supabase Auth
  provinceId: text("province_id")
    .notNull()
    .references(() => provinces.id, { onDelete: "cascade" }),
  isVisited: boolean("is_visited").default(true).notNull(),
  firstVisitedDate: date("first_visited_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ตารางเรื่องเล่า / ความทรงจำ (Memories)
export const memories = pgTable("memories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // UUID จาก Supabase Auth
  provinceId: text("province_id")
    .notNull()
    .references(() => provinces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"), // บันทึกข้อความ / Markdown
  images: text("images").array().default([]).notNull(), // Cloudinary Image URLs
  rating: integer("rating").default(5), // 1-5 ดาว
  visitedDate: date("visited_date"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Province = typeof provinces.$inferSelect;
export type UserVisitedProvince = typeof userVisitedProvinces.$inferSelect;
export type Memory = typeof memories.$inferSelect;
