export interface ParentGetAllDto {
  id: number;
  personId: number;
  tenantId?: number;
  isActive?: boolean;
}

export interface ParentGetByIdDto {
  id: number;
  personId: number;
  tenantId?: number;
  isActive?: boolean;
}

export interface CreateParentDto {
  personId: number;
  tenantId?: number;
}

export interface UpdateParentDto {
  id: number;
  personId: number;
  tenantId?: number;
  isActive?: boolean;
}
