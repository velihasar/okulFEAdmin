export interface ParentGetAllDto {
  id: number;
  personId: number;
  tenantId?: number;
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  person?: {
    id: number;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
  };
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
