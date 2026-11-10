"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  ArchiveMenuCategoryResponseSchema,
  ArchiveMenuItemResponseSchema,
  CreateMenuCategoryResponseSchema,
  CreateMenuItemResponseSchema,
  MenuCategoryInputSchema,
  MenuItemInputSchema,
  MenuItemUpdateInputSchema,
  SetBranchItemAvailabilityResponseSchema,
  UpdateMenuCategoryResponseSchema,
  UpdateMenuItemResponseSchema,
  UuidSchema,
  type MenuCategoryInput,
  type MenuItemInput,
  type MenuItemUpdateInput,
} from "./contracts";
import { normalizeMenuError, type MenuActionError } from "./errors";

interface RpcResponse {
  data: unknown;
  error: unknown;
}

export type MenuActionResult<T> =
  { ok: true; data: T } | { ok: false; error: MenuActionError; committed: boolean };

function validationFailure(message: string): MenuActionResult<never> {
  return {
    ok: false,
    committed: false,
    error: { code: "VALIDATION_ERROR", message, retryable: false },
  };
}

function revalidateMenu() {
  // The menu layout owns every category/item route. Revalidating it also
  // refreshes the overview and detail pages after a transactional RPC.
  revalidatePath("/menu", "layout");
}

async function mutate<T>(
  call: () => Promise<RpcResponse>,
  parse: (value: unknown) => T | null,
): Promise<MenuActionResult<T>> {
  let response: RpcResponse;

  try {
    response = await call();
  } catch {
    return {
      ok: false,
      committed: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "The request could not be sent.",
        retryable: true,
      },
    };
  }

  if (response.error) {
    return {
      ok: false,
      committed: false,
      error: normalizeMenuError(response.error),
    };
  }

  revalidateMenu();

  const parsed = parse(response.data);
  if (parsed === null) {
    return {
      ok: false,
      committed: true,
      error: {
        code: "INVALID_RESPONSE",
        message:
          "The backend completed the request, but its response could not be read. Refresh and verify the result before retrying.",
        retryable: false,
      },
    };
  }

  return { ok: true, data: parsed };
}

function parseWith<T>(schema: z.ZodType<T>) {
  return (value: unknown): T | null => {
    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : null;
  };
}

function nullableText(value: string): string | null {
  return value.trim().length > 0 ? value.trim() : null;
}

export async function createMenuCategoryAction(
  input: MenuCategoryInput,
): Promise<MenuActionResult<{ categoryId: string }>> {
  const parsed = MenuCategoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("The category details are invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("create_menu_category", {
      p_name: parsed.data.name,
      p_description: nullableText(parsed.data.description),
      p_sort_order: parsed.data.sortOrder,
    });
  }, parseWith(CreateMenuCategoryResponseSchema));
}

export async function updateMenuCategoryAction(
  categoryId: string,
  input: MenuCategoryInput,
): Promise<MenuActionResult<{ categoryId: string }>> {
  const id = UuidSchema.safeParse(categoryId);
  const parsed = MenuCategoryInputSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return validationFailure("The category details are invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("update_menu_category", {
      p_category_id: id.data,
      p_name: parsed.data.name,
      p_description: nullableText(parsed.data.description),
      p_sort_order: parsed.data.sortOrder,
    });
  }, parseWith(UpdateMenuCategoryResponseSchema));
}

export async function archiveMenuCategoryAction(
  categoryId: string,
): Promise<MenuActionResult<{ categoryId: string }>> {
  const id = UuidSchema.safeParse(categoryId);
  if (!id.success) {
    return validationFailure("The category identifier is invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("archive_menu_category", { p_category_id: id.data });
  }, parseWith(ArchiveMenuCategoryResponseSchema));
}

export async function createMenuItemAction(
  input: MenuItemInput,
): Promise<MenuActionResult<{ menuItemId: string }>> {
  const parsed = MenuItemInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("The menu item details are invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("create_menu_item", {
      p_category_id: parsed.data.categoryId,
      p_name: parsed.data.name,
      p_base_price_minor: parsed.data.basePriceMinor,
      p_description: nullableText(parsed.data.description),
      p_sort_order: parsed.data.sortOrder,
    });
  }, parseWith(CreateMenuItemResponseSchema));
}

export async function updateMenuItemAction(
  itemId: string,
  input: MenuItemUpdateInput,
): Promise<MenuActionResult<{ menuItemId: string }>> {
  const id = UuidSchema.safeParse(itemId);
  const parsed = MenuItemUpdateInputSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return validationFailure("The menu item details are invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("update_menu_item", {
      p_menu_item_id: id.data,
      p_name: parsed.data.name,
      p_base_price_minor: parsed.data.basePriceMinor,
      p_description: nullableText(parsed.data.description),
      p_sort_order: parsed.data.sortOrder,
    });
  }, parseWith(UpdateMenuItemResponseSchema));
}

export async function archiveMenuItemAction(
  itemId: string,
): Promise<MenuActionResult<{ menuItemId: string }>> {
  const id = UuidSchema.safeParse(itemId);
  if (!id.success) {
    return validationFailure("The menu item identifier is invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("archive_menu_item", { p_menu_item_id: id.data });
  }, parseWith(ArchiveMenuItemResponseSchema));
}

export async function setMenuItemBranchAvailabilityAction(
  itemId: string,
  branchId: string,
  isAvailable: boolean,
): Promise<MenuActionResult<{ branchId: string; menuItemId: string; isAvailable: boolean }>> {
  const parsed = z
    .object({
      itemId: UuidSchema,
      branchId: UuidSchema,
      isAvailable: z.boolean(),
    })
    .strict()
    .safeParse({ itemId, branchId, isAvailable });

  if (!parsed.success) {
    return validationFailure("The branch availability request is invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("set_branch_item_availability", {
      p_branch_id: parsed.data.branchId,
      p_menu_item_id: parsed.data.itemId,
      p_is_available: parsed.data.isAvailable,
    });
  }, parseWith(SetBranchItemAvailabilityResponseSchema));
}
