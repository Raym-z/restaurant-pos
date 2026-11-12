/**
 * Minimal Supabase database types for the POS integrations.
 *
 * These types mirror the public schema owned by restaurant-platform-backend.
 * They cover the M1 authentication/workspace tables plus the M3 menu read,
 * table/session/order RPC, and enum contracts. Replace this file with generated
 * Supabase types once the shared contract/type distribution process is
 * approved.
 *
 * Do not add invented columns here. Update this file only from the backend
 * schema and generated types.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrganizationStatus = "active" | "suspended" | "pending_deletion";
export type BranchStatus = "active" | "inactive";
export type StaffStatus = "invited" | "active" | "suspended" | "deactivated";
export type RoleScope = "organization" | "branch";
export type StaffInvitationStatus = "pending" | "accepted" | "revoked" | "expired";
export type SubscriptionState = "active" | "expired" | "grace_period" | "restricted";
export type TableStatus = "active" | "inactive";
export type DiningSessionStatus = "active" | "closed";
export type OrderStatus =
  "pending" | "accepted" | "preparing" | "ready" | "served" | "completed" | "cancelled";
export type OrderItemStatus =
  "pending" | "accepted" | "preparing" | "ready" | "served" | "cancelled";
export type OrderSource = "guest" | "staff";
export type KitchenStationStatus = "active" | "inactive";
export type KitchenTicketStatus =
  "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type KitchenTicketItemStatus =
  "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type WaitlistStatus = "waiting" | "notified" | "seated" | "cancelled" | "no_show";

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
      staff_invitations: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string | null;
          email: string;
          display_name: string;
          role_code: string;
          scope_type: RoleScope;
          token_hash: string;
          status: StaffInvitationStatus;
          invited_by_staff_id: string;
          expires_at: string;
          last_sent_at: string | null;
          send_count: number;
          accepted_at: string | null;
          accepted_by_staff_id: string | null;
          revoked_at: string | null;
          revoked_by_staff_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id?: string | null;
          email: string;
          display_name: string;
          role_code: string;
          scope_type: RoleScope;
          token_hash: string;
          status?: StaffInvitationStatus;
          invited_by_staff_id: string;
          expires_at: string;
          last_sent_at?: string | null;
          send_count?: number;
          accepted_at?: string | null;
          accepted_by_staff_id?: string | null;
          revoked_at?: string | null;
          revoked_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          branch_id?: string | null;
          email?: string;
          display_name?: string;
          role_code?: string;
          scope_type?: RoleScope;
          token_hash?: string;
          status?: StaffInvitationStatus;
          invited_by_staff_id?: string;
          expires_at?: string;
          last_sent_at?: string | null;
          send_count?: number;
          accepted_at?: string | null;
          accepted_by_staff_id?: string | null;
          revoked_at?: string | null;
          revoked_by_staff_id?: string | null;
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
          branch_id: string | null;
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
          branch_id?: string | null;
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
          branch_id?: string | null;
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
      menu_categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          sort_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          organization_id: string;
          category_id: string;
          name: string;
          description: string | null;
          base_price_minor: number;
          currency_code: string;
          sort_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          category_id: string;
          name: string;
          description?: string | null;
          base_price_minor: number;
          currency_code: string;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          base_price_minor?: number;
          currency_code?: string;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      branch_menu_categories: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          menu_category_id: string;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          menu_category_id: string;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          branch_id?: string;
          menu_category_id?: string;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      branch_menu_items: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          menu_item_id: string;
          is_available: boolean;
          price_override_minor: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          menu_item_id: string;
          is_available?: boolean;
          price_override_minor?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          branch_id?: string;
          menu_item_id?: string;
          is_available?: boolean;
          price_override_minor?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      modifier_groups: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          min_selections: number;
          max_selections: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          min_selections?: number;
          max_selections?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          min_selections?: number;
          max_selections?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      modifier_options: {
        Row: {
          id: string;
          organization_id: string;
          modifier_group_id: string;
          name: string;
          price_delta_minor: number;
          sort_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          modifier_group_id: string;
          name: string;
          price_delta_minor?: number;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          modifier_group_id?: string;
          name?: string;
          price_delta_minor?: number;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_item_modifier_groups: {
        Row: {
          id: string;
          organization_id: string;
          menu_item_id: string;
          modifier_group_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          menu_item_id: string;
          modifier_group_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          menu_item_id?: string;
          modifier_group_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_menu_category: {
        Args: { p_name: string; p_description?: string | null; p_sort_order?: number };
        Returns: Json;
      };
      update_menu_category: {
        Args: {
          p_category_id: string;
          p_name: string;
          p_description?: string | null;
          p_sort_order?: number;
        };
        Returns: Json;
      };
      archive_menu_category: {
        Args: { p_category_id: string };
        Returns: Json;
      };
      create_menu_item: {
        Args: {
          p_category_id: string;
          p_name: string;
          p_base_price_minor: number;
          p_description?: string | null;
          p_sort_order?: number;
        };
        Returns: Json;
      };
      update_menu_item: {
        Args: {
          p_menu_item_id: string;
          p_name: string;
          p_base_price_minor: number;
          p_description?: string | null;
          p_sort_order?: number;
        };
        Returns: Json;
      };
      archive_menu_item: {
        Args: { p_menu_item_id: string };
        Returns: Json;
      };
      set_branch_item_availability: {
        Args: { p_branch_id: string; p_menu_item_id: string; p_is_available: boolean };
        Returns: Json;
      };
      create_table: {
        Args: { p_branch_id: string; p_label: string; p_capacity: number };
        Returns: Json;
      };
      update_table: {
        Args: { p_table_id: string; p_label: string; p_capacity: number };
        Returns: Json;
      };
      deactivate_table: {
        Args: { p_table_id: string; p_reason?: string | null };
        Returns: Json;
      };
      list_branch_tables: {
        Args: { p_branch_id: string; p_include_inactive?: boolean };
        Returns: Json;
      };
      get_table: {
        Args: { p_table_id: string };
        Returns: Json;
      };
      get_table_availability: {
        Args: { p_table_id: string };
        Returns: Json;
      };
      get_active_dining_session: {
        Args: { p_table_id: string };
        Returns: Json;
      };
      list_branch_dining_sessions: {
        Args: {
          p_branch_id: string;
          p_status?: DiningSessionStatus | null;
          p_from?: string | null;
          p_to?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Json;
      };
      open_dining_session: {
        Args: { p_table_id: string; p_idempotency_key?: string | null };
        Returns: Json;
      };
      get_dining_session: {
        Args: { p_session_id: string };
        Returns: Json;
      };
      close_dining_session: {
        Args: { p_session_id: string; p_reason?: string | null };
        Returns: Json;
      };
      create_order: {
        Args: {
          p_dining_session_id: string;
          p_items: Json;
          p_notes?: string | null;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      get_order: {
        Args: { p_order_id: string };
        Returns: Json;
      };
      list_orders_by_session: {
        Args: {
          p_dining_session_id: string;
          p_status?: OrderStatus | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Json;
      };
      list_branch_orders: {
        Args: {
          p_branch_id: string;
          p_status?: OrderStatus | null;
          p_from?: string | null;
          p_to?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Json;
      };
      add_order_item: {
        Args: {
          p_order_id: string;
          p_menu_item_id: string;
          p_quantity: number;
          p_modifier_option_ids?: string[];
          p_notes?: string | null;
        };
        Returns: Json;
      };
      update_order_item_quantity: {
        Args: { p_order_item_id: string; p_quantity: number };
        Returns: Json;
      };
      remove_order_item: {
        Args: { p_order_item_id: string; p_reason?: string | null };
        Returns: Json;
      };
      transition_order_status: {
        Args: { p_order_id: string; p_status: OrderStatus; p_reason?: string | null };
        Returns: Json;
      };
      cancel_order: {
        Args: { p_order_id: string; p_reason: string };
        Returns: Json;
      };
      list_kitchen_tickets: {
        Args: {
          p_branch_id: string;
          p_station_id?: string | null;
          p_statuses?: KitchenTicketStatus[] | null;
          p_limit?: number;
          p_offset?: number;
          p_from?: string | null;
          p_to?: string | null;
        };
        Returns: Json;
      };
      get_kitchen_ticket: {
        Args: { p_ticket_id: string };
        Returns: Json;
      };
      list_kitchen_stations: {
        Args: { p_branch_id: string };
        Returns: Json;
      };
      create_kitchen_station: {
        Args: { p_branch_id: string; p_name: string; p_description?: string | null };
        Returns: Json;
      };
      update_kitchen_station: {
        Args: { p_station_id: string; p_name: string; p_description?: string | null };
        Returns: Json;
      };
      deactivate_kitchen_station: {
        Args: { p_station_id: string; p_reason?: string | null };
        Returns: Json;
      };
      reactivate_kitchen_station: {
        Args: { p_station_id: string };
        Returns: Json;
      };
      add_kitchen_station_category_route: {
        Args: { p_station_id: string; p_menu_category_id: string };
        Returns: Json;
      };
      remove_kitchen_station_category_route: {
        Args: { p_station_id: string; p_menu_category_id: string };
        Returns: Json;
      };
      add_kitchen_station_item_route: {
        Args: { p_station_id: string; p_menu_item_id: string };
        Returns: Json;
      };
      remove_kitchen_station_item_route: {
        Args: { p_station_id: string; p_menu_item_id: string };
        Returns: Json;
      };
      start_kitchen_ticket_item: {
        Args: { p_ticket_item_id: string };
        Returns: Json;
      };
      mark_kitchen_ticket_item_ready: {
        Args: { p_ticket_item_id: string };
        Returns: Json;
      };
      complete_kitchen_ticket_item: {
        Args: { p_ticket_item_id: string };
        Returns: Json;
      };
      list_staff_invitations: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      revoke_staff_invitation: {
        Args: { p_invitation_id: string; p_reason: string };
        Returns: Json;
      };
      accept_staff_invitation: {
        Args: { p_token_hash_hex: string };
        Returns: Json;
      };
      list_waitlist_entries: {
        Args: {
          p_branch_id: string;
          p_statuses?: WaitlistStatus[] | null;
          p_search?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      organization_status: OrganizationStatus;
      branch_status: BranchStatus;
      staff_status: StaffStatus;
      role_scope: RoleScope;
      staff_invitation_status: StaffInvitationStatus;
      subscription_state: SubscriptionState;
      table_status: TableStatus;
      dining_session_status: DiningSessionStatus;
      order_status: OrderStatus;
      order_item_status: OrderItemStatus;
      order_source: OrderSource;
      kitchen_station_status: KitchenStationStatus;
      kitchen_ticket_status: KitchenTicketStatus;
      kitchen_ticket_item_status: KitchenTicketItemStatus;
      waitlist_status: WaitlistStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
