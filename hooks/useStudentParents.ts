import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  StudentParentGetAllDto,
  StudentParentGetByIdDto,
  CreateStudentParentDto,
  UpdateStudentParentDto,
} from "@/types/studentParent.types";

export const studentParentKeys = {
  all: ["studentParents"] as const,
  lists: (params?: { tenantId?: number; studentId?: number }) =>
    [...studentParentKeys.all, "list", params] as const,
  detail: (id: number) => [...studentParentKeys.all, "detail", id] as const,
};

/**
 * Tüm Öğrenci-Veli Eşleşmelerini Listele
 * GET /api/StudentParents/getall
 */
export function useStudentParents(params?: { tenantId?: number; studentId?: number }) {
  return useQuery<StudentParentGetAllDto[]>({
    queryKey: studentParentKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<StudentParentGetAllDto[]>(
        "/api/StudentParents/getall",
        { params }
      );
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Öğrenci-Veli Eşleşme Detayını Getir
 * GET /api/StudentParents/getbyid?id={id}
 */
export function useStudentParent(id: number) {
  return useQuery<StudentParentGetByIdDto>({
    queryKey: studentParentKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<StudentParentGetByIdDto>(
        `/api/StudentParents/getbyid`,
        { params: { id } }
      );
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Öğrenciye Veli Bağla
 * POST /api/StudentParents
 */
export function useCreateStudentParent() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateStudentParentDto>({
    mutationFn: async (data: CreateStudentParentDto) => {
      const response = await axiosInstance.post("/api/StudentParents", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentParentKeys.all });
    },
  });
}

/**
 * Öğrenci-Veli Bağlantısını Güncelle (Yakınlık / Birincil Veli)
 * PUT /api/StudentParents
 */
export function useUpdateStudentParent() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UpdateStudentParentDto>({
    mutationFn: async (data: UpdateStudentParentDto) => {
      const response = await axiosInstance.put("/api/StudentParents", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: studentParentKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: studentParentKeys.detail(variables.id) });
      }
    },
  });
}

/**
 * Öğrenci-Veli Bağlantısını Sil / Kaldır
 * DELETE /api/StudentParents
 */
export function useDeleteStudentParent() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, { id: number }>({
    mutationFn: async (data: { id: number }) => {
      const response = await axiosInstance.delete<string>("/api/StudentParents", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentParentKeys.all });
    },
  });
}
