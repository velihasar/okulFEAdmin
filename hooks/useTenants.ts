import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  TenantGetAllDto,
  TenantGetByIdDto,
  CreateTenantCommand,
  UpdateTenantCommand,
  DeleteTenantCommand,
  TenantCreateResponseDto,
  TenantUpdateResponseDto,
  ApiDataResult,
} from "@/types/tenant.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const tenantKeys = {
  all: ["tenants"] as const,
  lists: () => [...tenantKeys.all, "list"] as const,
  detail: (id: number) => [...tenantKeys.all, "detail", id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Tüm Kurumları (Tenants) Listele
 * GET /api/tenants/getall
 */
export function useTenants() {
  return useQuery<TenantGetAllDto[]>({
    queryKey: tenantKeys.lists(),
    queryFn: async () => {
      const response = await axiosInstance.get<TenantGetAllDto[]>("/api/tenants/getall");
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Kurum Detayını Getir
 * GET /api/tenants/getbyid?id={id}
 */
export function useTenant(id: number) {
  return useQuery<TenantGetByIdDto>({
    queryKey: tenantKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<TenantGetByIdDto>(`/api/tenants/getbyid`, {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Yeni Kurum Ekle
 * POST /api/tenants
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<TenantCreateResponseDto>, Error, CreateTenantCommand>({
    mutationFn: async (data: CreateTenantCommand) => {
      const response = await axiosInstance.post<ApiDataResult<TenantCreateResponseDto>>(
        "/api/tenants",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
}

/**
 * Kurum Güncelle
 * PUT /api/tenants
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<TenantUpdateResponseDto>, Error, UpdateTenantCommand>({
    mutationFn: async (data: UpdateTenantCommand) => {
      const response = await axiosInstance.put<ApiDataResult<TenantUpdateResponseDto>>(
        "/api/tenants",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) });
    },
  });
}

/**
 * Kurum Sil
 * DELETE /api/tenants
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteTenantCommand>({
    mutationFn: async (data: DeleteTenantCommand) => {
      const response = await axiosInstance.delete<string>("/api/tenants", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
}
