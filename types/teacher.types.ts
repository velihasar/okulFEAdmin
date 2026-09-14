import { ApiDataResult } from "./branch.types";
import { PersonGetAllDto } from "./person.types";

export interface TeacherGetAllDto {
  id: number;
  tenantId?: number;
  personId: number;
  startDate: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export interface TeacherGetByIdDto {
  id: number;
  tenantId?: number;
  personId: number;
  startDate: string;
}

export interface CreateTeacherCommand {
  tenantId?: number;
  personId: number;
  startDate: string;
}

export interface UpdateTeacherCommand {
  id: number;
  tenantId?: number;
  personId: number;
  startDate: string;
  isActive: boolean;
}

export interface DeleteTeacherCommand {
  id: number;
}

export interface TeacherCreateResponseDto {
  id: number;
  personId: number;
  startDate: string;
}

export interface TeacherUpdateResponseDto {
  id: number;
  personId: number;
  startDate: string;
}

export interface TeacherWithPersonDto extends TeacherGetAllDto {
  person?: PersonGetAllDto;
}
