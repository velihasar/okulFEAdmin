/**
 * OkulBE Branch (Şube) DTO Tanımları
 * Backend Namespace: Core.Entities.Dtos.BranchDto & Business.Handlers.Branches
 */

// GET /api/branches/getall DTO
export interface BranchGetAllDto {
  id: number;
  tenantId?: number;
  tenantName?: string;
  name: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

// GET /api/branches/getbyid DTO
export interface BranchGetByIdDto {
  id: number;
  tenantId?: number;
  tenantName?: string;
  name: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

// POST /api/branches Body
export interface CreateBranchCommand {
  tenantId?: number;
  name: string;
  address?: string;
  phone?: string;
}

// PUT /api/branches Body
export interface UpdateBranchCommand {
  id: number;
  tenantId?: number;
  name: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

// DELETE /api/branches Body
export interface DeleteBranchCommand {
  id: number;
}

// Backend Response DTOs
export interface BranchCreateResponseDto {
  id: number;
  name: string;
  address?: string;
  phone?: string;
}

export interface BranchUpdateResponseDto {
  id: number;
  name: string;
  address?: string;
  phone?: string;
}

// OkulBE Standart DataResult Yanıt Yapısı
export interface ApiDataResult<T> {
  data: T;
  success: boolean;
  message?: string;
}
