import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  ParentGetAllDto,
  ParentGetByIdDto,
  CreateParentDto,
  UpdateParentDto,
} from "@/types/parent.types";

export const parentKeys = {
  all: ["parents"] as const,
  lists: (params?: { tenantId?: number }) => [...parentKeys.all, "list", params] as const,
  detail: (id: number) => [...parentKeys.all, "detail", id] as const,
};

/**
 * Tüm Velileri (Parents) Listele
 * GET /api/Parents/getall
 */
export function useParents(params?: { tenantId?: number }) {
  return useQuery<ParentGetAllDto[]>({
    queryKey: parentKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<ParentGetAllDto[]>("/api/Parents/getall", {
        params,
      });
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Veli Detayını Getir
 * GET /api/Parents/getbyid?id={id}
 */
export function useParent(id: number) {
  return useQuery<ParentGetByIdDto>({
    queryKey: parentKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<ParentGetByIdDto>(`/api/Parents/getbyid`, {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Yeni Veli Ekle
 * POST /api/Parents
 */
export function useCreateParent() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateParentDto>({
    mutationFn: async (data: CreateParentDto) => {
      const response = await axiosInstance.post("/api/Parents", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parentKeys.all });
    },
  });
}

/**
 * Veli Güncelle
 * PUT /api/Parents
 */
export function useUpdateParent() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UpdateParentDto>({
    mutationFn: async (data: UpdateParentDto) => {
      const response = await axiosInstance.put("/api/Parents", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: parentKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: parentKeys.detail(variables.id) });
      }
    },
  });
}

/**
 * Veli Sil
 * DELETE /api/Parents
 */
export function useDeleteParent() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, { id: number }>({
    mutationFn: async (data: { id: number }) => {
      const response = await axiosInstance.delete<string>("/api/Parents", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parentKeys.all });
    },
  });
}
