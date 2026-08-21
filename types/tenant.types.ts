/**
 * OkulBE Tenant (Kurum / Okul) DTO Tanımları
 * Backend Namespace: Core.Entities.Dtos.TenantDto & Business.Handlers.Tenants
 */

// GET /api/tenants/getall DTO
export interface TenantGetAllDto {
  id: number;
  name: string;
  code?: string;
  logoUrl?: string;
}

// GET /api/tenants/getbyid DTO
export interface TenantGetByIdDto {
  id: number;
  name: string;
  code?: string;
  logoUrl?: string;
}

// POST /api/tenants Body
export interface CreateTenantCommand {
  name: string;
  code?: string;
  logoUrl?: string;
}

// PUT /api/tenants Body
export interface UpdateTenantCommand {
  id: number;
  name: string;
  code?: string;
  logoUrl?: string;
  isActive?: boolean;
}

// DELETE /api/tenants Body
export interface DeleteTenantCommand {
  id: number;
}

// Backend Response DTO
export interface TenantCreateResponseDto {
  id: number;
  name: string;
  code?: string;
  logoUrl?: string;
}

export interface TenantUpdateResponseDto {
  id: number;
  name: string;
  code?: string;
  logoUrl?: string;
}

// OkulBE Standart DataResult Yanıt Yapısı
export interface ApiDataResult<T> {
  data: T;
  success: boolean;
  message?: string;
}
