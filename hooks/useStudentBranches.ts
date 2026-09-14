import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

export interface StudentBranchDto {
  studentId: number;
  branchId: number;
  tenantId: number;
  isActive: boolean;
}

export function useStudentBranches(params?: { studentId?: number; branchId?: number }) {
  return useQuery<StudentBranchDto[]>({
    queryKey: ["student-branches", params],
    queryFn: async () => {
      const response = await axiosInstance.get<StudentBranchDto[]>("/api/StudentBranches/getall", {
        params,
      });
      return response.data;
    },
  });
}

export function useCreateStudentBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { tenantId?: number; studentId: number; branchId: number }) => {
      const response = await axiosInstance.post("/api/StudentBranches", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-branches"] });
    },
  });
}

export function useDeleteStudentBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { studentId: number; branchId: number }) => {
      const response = await axiosInstance.delete("/api/StudentBranches", { data });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-branches"] });
    },
  });
}
