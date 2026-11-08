"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { mockOrganization } from "@/features/organization/data/organization";
import type { Organization, OrganizationProfileInput } from "@/features/organization/types";
import { mockBranches } from "@/features/branches/data/branches";
import type { Branch, BranchInput } from "@/features/branches/types";
import { mockStaff } from "@/features/staff/data/staff";
import type { StaffInput, StaffMember, StaffStatus } from "@/features/staff/types";
import { mockMenuCategories, mockMenuItems } from "@/features/menu/data/menu";
import type {
  MenuCategory,
  MenuCategoryInput,
  MenuItem,
  MenuItemInput,
  MenuText,
  MenuContentLocale,
} from "@/features/menu/types";

interface MockDataContextValue {
  organization: Organization;
  branches: Branch[];
  staff: StaffMember[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  updateOrganization: (input: OrganizationProfileInput) => void;
  addBranch: (input: BranchInput) => Branch;
  updateBranch: (branchId: string, input: BranchInput) => void;
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

function toBranchAvailability(
  input: MenuItemInput,
  branchIds: string[],
  existingOverrides?: Map<string, MenuItem["branchAvailability"][number]>,
): MenuItem["branchAvailability"] {
  return branchIds.map((branchId) => ({
    branchId,
    isAvailable: !input.unavailableBranchIds.includes(branchId),
    priceOverride: existingOverrides?.get(branchId)?.priceOverride ?? null,
  }));
}

/**
 * In-memory data store for the mock management experience.
 *
 * It mirrors the shape a future server-backed data layer will expose, but all
 * mutations are local to the browser session. Nothing here talks to Supabase.
 */
export function MockDataProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization>(mockOrganization);
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(mockMenuCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);

  const updateOrganization = useCallback((input: OrganizationProfileInput) => {
    setOrganization((current) => ({ ...current, ...input }));
  }, []);

  const addBranch = useCallback(
    (input: BranchInput) => {
      const branch: Branch = {
        ...input,
        id: crypto.randomUUID(),
        organizationId: organization.id,
        createdAt: nowInstant(),
      };
      setBranches((current) => [...current, branch]);
      return branch;
    },
    [organization.id],
  );

  const updateBranch = useCallback((branchId: string, input: BranchInput) => {
    setBranches((current) =>
      current.map((branch) => (branch.id === branchId ? { ...branch, ...input } : branch)),
    );
  }, []);

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
        const translations = { ...category.translations };
        if (input.contentLocale === "en") {
          translations.en = {
            name: input.name,
            description: input.description,
          };
          return {
            ...category,
            name: input.name,
            description: input.description,
            status: input.status,
            translations,
          };
        }
        translations[input.contentLocale] = {
          name: input.name,
          description: input.description,
        };
        if (!translations.en) {
          translations.en = {
            name: category.name,
            description: category.description,
          };
        }
        return { ...category, status: input.status, translations };
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
        branchAvailability: toBranchAvailability(
          input,
          branches.map((branch) => branch.id),
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
          const translations = { ...item.translations };
          if (input.contentLocale === "en") {
            translations.en = {
              name: input.name,
              description: input.description,
            };
          } else {
            translations[input.contentLocale] = {
              name: input.name,
              description: input.description,
            };
            if (!translations.en) {
              translations.en = {
                name: item.name,
                description: item.description,
              };
            }
          }
          return {
            ...item,
            categoryId: input.categoryId,
            name: input.contentLocale === "en" ? input.name : item.name,
            description: input.contentLocale === "en" ? input.description : item.description,
            translations,
            basePrice: {
              ...item.basePrice,
              amountMinor: input.basePriceMinor,
            },
            status: input.status,
            tags: input.tags,
            branchAvailability: toBranchAvailability(
              input,
              branches.map((branch) => branch.id),
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
      organization,
      branches,
      staff,
      menuCategories,
      menuItems,
      updateOrganization,
      addBranch,
      updateBranch,
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
      organization,
      branches,
      staff,
      menuCategories,
      menuItems,
      updateOrganization,
      addBranch,
      updateBranch,
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
