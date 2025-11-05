export interface ICategory {
  category_name: CategoryName;
  service_tree_id: string;
}

export enum CategoryName {
  FirstParty = "FirstParty",
  ThirdParty = "ThirdParty",
  None = "None",
}

export interface IAccountCategoryResponse {
  account_id: string;
  category_name: CategoryName;
  service_tree_id: string;
}
