import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  TeacherGetAllDto,
  TeacherGetByIdDto,
  CreateTeacherCommand,
  UpdateTeacherCommand,
  DeleteTeacherCommand,
  TeacherCreateResponseDto,
  TeacherUpdateResponseDto,
} from "@/types/teacher.types";
import { ApiDataResult } from "@/types/branch.types";

export const teacherKeys = {
  all: ["teachers"] as const,
  lists: () => [...teacherKeys.all, "list"] as const,
  detail: (id: number) => [...teacherKeys.all, "detail", id] as const,
};

export function useTeachers() {
  return useQuery<TeacherGetAllDto[]>({
    queryKey: teacherKeys.lists(),
    queryFn: async () => {
      const response = await axiosInstance.get<TeacherGetAllDto[]>("/api/teachers/getall");
      return response.data;
    },
  });
}

export function useTeacher(id: number) {
  return useQuery<TeacherGetByIdDto>({
    queryKey: teacherKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<TeacherGetByIdDto>("/api/teachers/getbyid", {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<TeacherCreateResponseDto>, Error, CreateTeacherCommand>({
    mutationFn: async (data: CreateTeacherCommand) => {
      const response = await axiosInstance.post<ApiDataResult<TeacherCreateResponseDto>>(
        "/api/teachers",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<TeacherUpdateResponseDto>, Error, UpdateTeacherCommand>({
    mutationFn: async (data: UpdateTeacherCommand) => {
      const response = await axiosInstance.put<ApiDataResult<TeacherUpdateResponseDto>>(
        "/api/teachers",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: teacherKeys.detail(variables.id) });
      }
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteTeacherCommand>({
    mutationFn: async (data: DeleteTeacherCommand) => {
      const response = await axiosInstance.delete<string>("/api/teachers", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}
