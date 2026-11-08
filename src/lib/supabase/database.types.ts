/**
 * Minimal Supabase database types for the M1 integration.
 *
 * These types mirror the public schema owned by restaurant-platform-backend.
 * They are intentionally limited to the tables used by authentication and
 * workspace loading. Replace this file with generated Supabase types once the
 * shared contract/type distribution process is approved.
 *
 * Do not add invented columns here. Update this file only from the backend
 * schema and generated types.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrganizationStatus = "active" | "suspended" | "pending_deletion";
export type BranchStatus = "active" | "inactive";
export type StaffStatus = "invited" | "active" | "suspended" | "deactivated";
export type RoleScope = "organization" | "branch";
export type SubscriptionState = "active" | "expired" | "grace_period" | "restricted";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          default_currency_code: string;
          status: OrganizationStatus;
          deletion_requested_at: string | null;
          deletion_scheduled_for: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          default_currency_code: string;
          status?: OrganizationStatus;
          deletion_requested_at?: string | null;
          deletion_scheduled_for?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          default_currency_code?: string;
          status?: OrganizationStatus;
          deletion_requested_at?: string | null;
          deletion_scheduled_for?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          timezone: string;
          status: BranchStatus;
          deactivated_at: string | null;
          address: string | null;
          phone: string | null;
          latitude: number | null;
          longitude: number | null;
          waitlist_geolocation_enabled: boolean;
          waitlist_radius_meters: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          timezone: string;
          status?: BranchStatus;
          deactivated_at?: string | null;
          address?: string | null;
          phone?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          waitlist_geolocation_enabled?: boolean;
          waitlist_radius_meters?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          timezone?: string;
          status?: BranchStatus;
          deactivated_at?: string | null;
          address?: string | null;
          phone?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          waitlist_geolocation_enabled?: boolean;
          waitlist_radius_meters?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          organization_id: string;
          display_name: string;
          status: StaffStatus;
          invited_at: string | null;
          activated_at: string | null;
          deactivated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          organization_id: string;
          display_name: string;
          status?: StaffStatus;
          invited_at?: string | null;
          activated_at?: string | null;
          deactivated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          organization_id?: string;
          display_name?: string;
          status?: StaffStatus;
          invited_at?: string | null;
          activated_at?: string | null;
          deactivated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_role_assignments: {
        Row: {
          id: string;
          staff_id: string;
          organization_id: string;
          role_code: string;
          scope_type: RoleScope;
          assigned_by_staff_id: string | null;
          assigned_at: string;
          revoked_at: string | null;
          revoked_by_staff_id: string | null;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          organization_id: string;
          role_code: string;
          scope_type: RoleScope;
          assigned_by_staff_id?: string | null;
          assigned_at?: string;
          revoked_at?: string | null;
          revoked_by_staff_id?: string | null;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          organization_id?: string;
          role_code?: string;
          scope_type?: RoleScope;
          assigned_by_staff_id?: string | null;
          assigned_at?: string;
          revoked_at?: string | null;
          revoked_by_staff_id?: string | null;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_branch_assignments: {
        Row: {
          id: string;
          staff_id: string;
          organization_id: string;
          branch_id: string;
          assigned_by_staff_id: string | null;
          assigned_at: string;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          organization_id: string;
          branch_id: string;
          assigned_by_staff_id?: string | null;
          assigned_at?: string;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          organization_id?: string;
          branch_id?: string;
          assigned_by_staff_id?: string | null;
          assigned_at?: string;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan_code: string;
          state: SubscriptionState;
          current_period_start: string | null;
          current_period_end: string | null;
          grace_period_ends_at: string | null;
          restricted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan_code: string;
          state?: SubscriptionState;
          current_period_start?: string | null;
          current_period_end?: string | null;
          grace_period_ends_at?: string | null;
          restricted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan_code?: string;
          state?: SubscriptionState;
          current_period_start?: string | null;
          current_period_end?: string | null;
          grace_period_ends_at?: string | null;
          restricted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          code: string;
          name: string;
          is_free: boolean;
          branch_limit: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          name: string;
          is_free?: boolean;
          branch_limit?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          is_free?: boolean;
          branch_limit?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      organization_status: OrganizationStatus;
      branch_status: BranchStatus;
      staff_status: StaffStatus;
      role_scope: RoleScope;
      subscription_state: SubscriptionState;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
