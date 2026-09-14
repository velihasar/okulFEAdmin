import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  TeacherBranchGetAllDto,
  CreateTeacherBranchCommand,
  DeleteTeacherBranchCommand,
} from "@/types/teacherBranch.types";

export const teacherBranchKeys = {
  all: ["teacherBranches"] as const,
  lists: () => [...teacherBranchKeys.all, "list"] as const,
};

export function useTeacherBranches() {
  return useQuery<TeacherBranchGetAllDto[]>({
    queryKey: teacherBranchKeys.lists(),
    queryFn: async () => {
      const response = await axiosInstance.get<TeacherBranchGetAllDto[]>("/api/teacherbranches/getall");
      return response.data;
    },
  });
}

export function useCreateTeacherBranch() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateTeacherBranchCommand>({
    mutationFn: async (data: CreateTeacherBranchCommand) => {
      const response = await axiosInstance.post("/api/teacherbranches", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherBranchKeys.lists() });
    },
  });
}

export function useDeleteTeacherBranch() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, DeleteTeacherBranchCommand>({
    mutationFn: async (data: DeleteTeacherBranchCommand) => {
      const response = await axiosInstance.delete("/api/teacherbranches", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherBranchKeys.lists() });
    },
  });
}
