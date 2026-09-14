import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  StudentGetAllDto,
  StudentGetByIdDto,
  CreateStudentCommand,
  UpdateStudentCommand,
  DeleteStudentCommand,
  StudentCreateResponseDto,
  StudentUpdateResponseDto,
} from "@/types/student.types";
import { ApiDataResult } from "@/types/branch.types";

export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  detail: (id: number) => [...studentKeys.all, "detail", id] as const,
};

export function useStudents() {
  return useQuery<StudentGetAllDto[]>({
    queryKey: studentKeys.lists(),
    queryFn: async () => {
      const response = await axiosInstance.get<StudentGetAllDto[]>("/api/students/getall");
      return response.data;
    },
  });
}

export function useStudent(id: number) {
  return useQuery<StudentGetByIdDto>({
    queryKey: studentKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<StudentGetByIdDto>("/api/students/getbyid", {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<StudentCreateResponseDto>, Error, CreateStudentCommand>({
    mutationFn: async (data: CreateStudentCommand) => {
      const response = await axiosInstance.post<ApiDataResult<StudentCreateResponseDto>>(
        "/api/students",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<StudentUpdateResponseDto>, Error, UpdateStudentCommand>({
    mutationFn: async (data: UpdateStudentCommand) => {
      const response = await axiosInstance.put<ApiDataResult<StudentUpdateResponseDto>>(
        "/api/students",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
      }
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteStudentCommand>({
    mutationFn: async (data: DeleteStudentCommand) => {
      const response = await axiosInstance.delete<string>("/api/students", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}
