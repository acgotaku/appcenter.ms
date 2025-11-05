import { ICategory } from "./category";
import { Origin } from "./origin";

/**
 * Contract for an Organization.
 */
export interface IOrganization {
  id?: string;
  name: string;
  display_name?: string;
  avatar_url?: string;
  description?: string;
  email?: string;
  collaborators_count?: number;
  collaborator_role?: OrganizationUserRole;
  origin?: Origin;
  feature_flags?: string[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  organization_category?: ICategory;
}

export type OrganizationUserRole = "admin" | "collaborator" | "member";
export const OrganizationUserRole = {
  Admin: "admin",
  Collaborator: "collaborator",
  Member: "member",
};
