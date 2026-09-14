import { ApiDataResult } from "./branch.types";
import { PersonGetAllDto } from "./person.types";

export interface StudentGetAllDto {
  id: number;
  tenantId?: number;
  personId: number;
  studentNumber: string;
  enrollmentDate: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export interface StudentGetByIdDto {
  id: number;
  tenantId?: number;
  personId: number;
  studentNumber: string;
  enrollmentDate: string;
}

export interface CreateStudentCommand {
  tenantId?: number;
  personId: number;
  studentNumber: string;
  enrollmentDate: string;
}

export interface UpdateStudentCommand {
  id: number;
  tenantId?: number;
  personId: number;
  studentNumber: string;
  enrollmentDate: string;
  isActive: boolean;
}

export interface DeleteStudentCommand {
  id: number;
}

export interface StudentCreateResponseDto {
  id: number;
  personId: number;
  studentNumber: string;
  enrollmentDate: string;
}

export interface StudentUpdateResponseDto {
  id: number;
  personId: number;
  studentNumber: string;
  enrollmentDate: string;
}

export interface StudentWithPersonDto extends StudentGetAllDto {
  person?: PersonGetAllDto;
}
