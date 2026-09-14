export interface StudentParentGetAllDto {
  id: number;
  studentId: number;
  parentId: number;
  relationship?: string;
  isPrimary: boolean;
  tenantId?: number;
}

export interface StudentParentGetByIdDto {
  id: number;
  studentId: number;
  parentId: number;
  relationship?: string;
  isPrimary: boolean;
  tenantId?: number;
}

export interface CreateStudentParentDto {
  studentId: number;
  parentId: number;
  relationship?: string;
  isPrimary?: boolean;
  tenantId?: number;
}

export interface UpdateStudentParentDto {
  id: number;
  studentId: number;
  parentId: number;
  relationship?: string;
  isPrimary?: boolean;
  tenantId?: number;
}
