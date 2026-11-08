"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { buildBranchAvailability } from "@/features/menu/availability";
import { applyMenuCategoryContent, applyMenuItemContent } from "@/features/menu/content";
import { mockMenuCategories, mockMenuItems } from "@/features/menu/data/menu";
import type {
  MenuCategory,
  MenuCategoryInput,
  MenuItem,
  MenuItemInput,
  MenuText,
  MenuContentLocale,
} from "@/features/menu/types";
import { mockStaff } from "@/features/staff/data/staff";
import type { StaffInput, StaffMember, StaffStatus } from "@/features/staff/types";
import { useWorkspace } from "@/providers/workspace-provider";

interface MockDataContextValue {
  staff: StaffMember[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  addStaff: (input: StaffInput) => StaffMember;
  updateStaff: (staffId: string, input: StaffInput) => void;
  setStaffStatus: (staffId: string, status: StaffStatus) => void;
  addMenuCategory: (input: MenuCategoryInput) => MenuCategory;
  updateMenuCategory: (categoryId: string, input: MenuCategoryInput) => void;
  addMenuItem: (input: MenuItemInput) => MenuItem;
  updateMenuItem: (itemId: string, input: MenuItemInput) => void;
  setMenuItemStatus: (itemId: string, status: MenuItem["status"]) => void;
}

const MockDataContext = createContext<MockDataContextValue | null>(null);

function nowInstant(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * In-memory feature data store for the mock management experience.
 *
 * Organization and branch state are owned by `WorkspaceProvider` so branch CRUD
 * immediately updates the shell switcher. This provider owns only feature data
 * (staff and menu) and reads the shared workspace for organization/branch
 * context. All mutations are local to the browser session.
 */
export function MockDataProvider({ children }: { children: ReactNode }) {
  const { organization, branches } = useWorkspace();
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(mockMenuCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);

  const addStaff = useCallback(
    (input: StaffInput) => {
      const member: StaffMember = {
        ...input,
        id: crypto.randomUUID(),
        organizationId: organization.id,
        status: "invited",
        joinedAt: nowInstant(),
        lastActiveAt: null,
      };
      setStaff((current) => [...current, member]);
      return member;
    },
    [organization.id],
  );

  const updateStaff = useCallback((staffId: string, input: StaffInput) => {
    setStaff((current) =>
      current.map((member) => (member.id === staffId ? { ...member, ...input } : member)),
    );
  }, []);

  const setStaffStatus = useCallback((staffId: string, status: StaffStatus) => {
    setStaff((current) =>
      current.map((member) => (member.id === staffId ? { ...member, status } : member)),
    );
  }, []);

  const addMenuCategory = useCallback(
    (input: MenuCategoryInput) => {
      const translations: Partial<Record<MenuContentLocale, MenuText>> = {
        [input.contentLocale]: {
          name: input.name,
          description: input.description,
        },
      };
      const category: MenuCategory = {
        id: crypto.randomUUID(),
        organizationId: organization.id,
        name: input.name,
        description: input.description,
        translations,
        status: input.status,
        sortOrder:
          menuCategories.reduce((highest, entry) => Math.max(highest, entry.sortOrder), 0) + 1,
        createdAt: nowInstant(),
      };
      setMenuCategories((current) => [...current, category]);
      return category;
    },
    [menuCategories, organization.id],
  );

  const updateMenuCategory = useCallback((categoryId: string, input: MenuCategoryInput) => {
    setMenuCategories((current) =>
      current.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }
        return {
          ...category,
          ...applyMenuCategoryContent(category, input),
          status: input.status,
        };
      }),
    );
  }, []);

  const addMenuItem = useCallback(
    (input: MenuItemInput) => {
      const timestamp = nowInstant();
      const translations: Partial<Record<MenuContentLocale, MenuText>> = {
        [input.contentLocale]: {
          name: input.name,
          description: input.description,
        },
      };
      const item: MenuItem = {
        id: crypto.randomUUID(),
        organizationId: organization.id,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        translations,
        basePrice: {
          amountMinor: input.basePriceMinor,
          currency: organization.currency,
        },
        status: input.status,
        tags: input.tags,
        variants: [],
        modifierGroups: [],
        branchAvailability: buildBranchAvailability(
          branches.map((branch) => branch.id),
          input.unavailableBranchIds,
        ),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      setMenuItems((current) => [...current, item]);
      return item;
    },
    [branches, organization.currency, organization.id],
  );

  const updateMenuItem = useCallback(
    (itemId: string, input: MenuItemInput) => {
      setMenuItems((current) =>
        current.map((item) => {
          if (item.id !== itemId) {
            return item;
          }
          const existingOverrides = new Map(
            item.branchAvailability.map((entry) => [entry.branchId, entry]),
          );
          return {
            ...item,
            categoryId: input.categoryId,
            ...applyMenuItemContent(item, input),
            basePrice: {
              ...item.basePrice,
              amountMinor: input.basePriceMinor,
            },
            status: input.status,
            tags: input.tags,
            branchAvailability: buildBranchAvailability(
              branches.map((branch) => branch.id),
              input.unavailableBranchIds,
              existingOverrides,
            ),
            updatedAt: nowInstant(),
          };
        }),
      );
    },
    [branches],
  );

  const setMenuItemStatus = useCallback((itemId: string, status: MenuItem["status"]) => {
    setMenuItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, status, updatedAt: nowInstant() } : item,
      ),
    );
  }, []);

  const value = useMemo<MockDataContextValue>(
    () => ({
      staff,
      menuCategories,
      menuItems,
      addStaff,
      updateStaff,
      setStaffStatus,
      addMenuCategory,
      updateMenuCategory,
      addMenuItem,
      updateMenuItem,
      setMenuItemStatus,
    }),
    [
      staff,
      menuCategories,
      menuItems,
      addStaff,
      updateStaff,
      setStaffStatus,
      addMenuCategory,
      updateMenuCategory,
      addMenuItem,
      updateMenuItem,
      setMenuItemStatus,
    ],
  );

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockData(): MockDataContextValue {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error("useMockData must be used inside MockDataProvider.");
  }
  return context;
}
