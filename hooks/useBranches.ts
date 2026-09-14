import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  BranchGetAllDto,
  BranchGetByIdDto,
  CreateBranchCommand,
  UpdateBranchCommand,
  DeleteBranchCommand,
  BranchCreateResponseDto,
  BranchUpdateResponseDto,
  ApiDataResult,
} from "@/types/branch.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const branchKeys = {
  all: ["branches"] as const,
  lists: (params?: { tenantId?: number }) => [...branchKeys.all, "list", params] as const,
  detail: (id: number) => [...branchKeys.all, "detail", id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Tüm Şubeleri (Branches) Listele
 * GET /api/branches/getall
 */
export function useBranches(params?: { tenantId?: number }) {
  return useQuery<BranchGetAllDto[]>({
    queryKey: branchKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<BranchGetAllDto[]>("/api/branches/getall", {
        params,
      });
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Şube Detayını Getir
 * GET /api/branches/getbyid?id={id}
 */
export function useBranch(id: number) {
  return useQuery<BranchGetByIdDto>({
    queryKey: branchKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<BranchGetByIdDto>(`/api/branches/getbyid`, {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Yeni Şube Ekle
 * POST /api/branches
 */
export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<BranchCreateResponseDto>, Error, CreateBranchCommand>({
    mutationFn: async (data: CreateBranchCommand) => {
      const response = await axiosInstance.post<ApiDataResult<BranchCreateResponseDto>>(
        "/api/branches",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}

/**
 * Şube Güncelle
 * PUT /api/branches
 */
export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<BranchUpdateResponseDto>, Error, UpdateBranchCommand>({
    mutationFn: async (data: UpdateBranchCommand) => {
      const response = await axiosInstance.put<ApiDataResult<BranchUpdateResponseDto>>(
        "/api/branches",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: branchKeys.detail(variables.id) });
      }
    },
  });
}

/**
 * Şube Sil
 * DELETE /api/branches
 */
export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteBranchCommand>({
    mutationFn: async (data: DeleteBranchCommand) => {
      const response = await axiosInstance.delete<string>("/api/branches", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}
