import { pgTable, text, serial, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull(), // 'processing', 'processed', 'needs_validation', 'unprocessed'
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  confidence: real("confidence"),
  extractedData: jsonb("extracted_data"),
  validationIssues: jsonb("validation_issues"),
  processingErrors: jsonb("processing_errors"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Types for extracted BOL data
export const bolDataSchema = z.object({
  bolNumber: z.string().optional(),
  carrier: z.object({
    name: z.string().optional(),
    scac: z.string().optional(),
  }).optional(),
  shipper: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  consignee: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  shipDate: z.string().optional(),
  totalWeight: z.number().optional(),
  items: z.array(z.object({
    description: z.string().optional(),
    quantity: z.union([z.string(), z.number()]).optional(),
    weight: z.number().optional(),
    class: z.string().optional(),
  })).optional(),
  confidence: z.number().optional(),
  processingTimestamp: z.string().optional(),
});

export type BOLData = z.infer<typeof bolDataSchema>;

export const validationIssueSchema = z.object({
  field: z.string(),
  message: z.string(),
  severity: z.enum(['warning', 'error']),
});

export type ValidationIssue = z.infer<typeof validationIssueSchema>;

export const processingErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.string().optional(),
});

export type ProcessingError = z.infer<typeof processingErrorSchema>;
