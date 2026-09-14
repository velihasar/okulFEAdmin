export interface PersonGetAllDto {
  id: number;
  tenantId?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export interface PersonGetByIdDto {
  id: number;
  tenantId?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export interface CreatePersonCommand {
  tenantId?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export interface UpdatePersonCommand {
  id: number;
  tenantId?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export interface DeletePersonCommand {
  id: number;
}

export interface PersonCreateResponseDto {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}
