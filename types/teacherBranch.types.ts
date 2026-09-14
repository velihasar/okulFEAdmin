export interface TeacherBranchGetAllDto {
  tenantId: number;
  teacherId: number;
  branchId: number;
}

export interface CreateTeacherBranchCommand {
  tenantId?: number;
  teacherId: number;
  branchId: number;
}

export interface DeleteTeacherBranchCommand {
  teacherId: number;
  branchId: number;
}
