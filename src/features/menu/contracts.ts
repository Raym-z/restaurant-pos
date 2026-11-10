import { z } from "zod";

/**
 * Runtime contracts for the menu administration surface.
 *
 * Read models mirror the public menu tables:
 * - `public.menu_categories`
 * - `public.menu_items`
 * - `public.branch_menu_items`
 *
 * Write contracts mirror the existing RPCs in
 * `20261108110500_security_remediation_error_consistency_menu_staff.sql`.
 * No schema or RPC is added by the POS frontend.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

export const UuidSchema = z.string().regex(UUID_PATTERN, "Must be a UUID");
export const InstantSchema = z.string().regex(INSTANT_PATTERN, "Must be an ISO-8601 instant");
export const SortOrderSchema = z.number().int().min(0).max(100_000);
export const PositiveMinorUnitsSchema = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
export const NonNegativeMinorUnitsSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export const MenuCategoryRowSchema = z.object({
  id: UuidSchema,
  organization_id: UuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(2_000).nullable(),
  sort_order: z.number().int(),
  archived_at: InstantSchema.nullable(),
  created_at: InstantSchema,
  updated_at: InstantSchema,
});

export type MenuCategoryRow = z.infer<typeof MenuCategoryRowSchema>;

export const MenuItemRowSchema = z.object({
  id: UuidSchema,
  organization_id: UuidSchema,
  category_id: UuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(4_000).nullable(),
  base_price_minor: NonNegativeMinorUnitsSchema,
  currency_code: CurrencyCodeSchema,
  sort_order: z.number().int(),
  archived_at: InstantSchema.nullable(),
  created_at: InstantSchema,
  updated_at: InstantSchema,
});

export type MenuItemRow = z.infer<typeof MenuItemRowSchema>;

export const BranchMenuItemRowSchema = z.object({
  branch_id: UuidSchema,
  menu_item_id: UuidSchema,
  is_available: z.boolean(),
  price_override_minor: NonNegativeMinorUnitsSchema.nullable(),
});

export type BranchMenuItemRow = z.infer<typeof BranchMenuItemRowSchema>;

/**
 * Form inputs. `basePriceMinor` is positive in the UI even though the backend
 * accepts zero; the product requirement is a positive menu price.
 */
export const MenuCategoryInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(240).default(""),
    sortOrder: SortOrderSchema.default(0),
  })
  .strict();

export type MenuCategoryInput = z.infer<typeof MenuCategoryInputSchema>;

export const MenuItemInputSchema = z
  .object({
    categoryId: UuidSchema,
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(400).default(""),
    basePriceMinor: PositiveMinorUnitsSchema,
    sortOrder: SortOrderSchema.default(0),
  })
  .strict();

export type MenuItemInput = z.infer<typeof MenuItemInputSchema>;

export const MenuItemUpdateInputSchema = MenuItemInputSchema.omit({ categoryId: true });

export type MenuItemUpdateInput = z.infer<typeof MenuItemUpdateInputSchema>;

export const CreateMenuCategoryResponseSchema = z.object({ categoryId: UuidSchema });
export const UpdateMenuCategoryResponseSchema = z.object({ categoryId: UuidSchema });
export const ArchiveMenuCategoryResponseSchema = z.object({
  categoryId: UuidSchema,
  archived: z.literal(true),
});

export const CreateMenuItemResponseSchema = z.object({ menuItemId: UuidSchema });
export const UpdateMenuItemResponseSchema = z.object({ menuItemId: UuidSchema });
export const ArchiveMenuItemResponseSchema = z.object({
  menuItemId: UuidSchema,
  archived: z.literal(true),
});

export const SetBranchItemAvailabilityResponseSchema = z.object({
  branchId: UuidSchema,
  menuItemId: UuidSchema,
  isAvailable: z.boolean(),
});

export type SetBranchItemAvailabilityResponse = z.infer<
  typeof SetBranchItemAvailabilityResponseSchema
>;
