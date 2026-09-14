import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  PersonGetAllDto,
  PersonGetByIdDto,
  CreatePersonCommand,
  UpdatePersonCommand,
  DeletePersonCommand,
  PersonCreateResponseDto,
} from "@/types/person.types";
import { ApiDataResult } from "@/types/branch.types";

export const personKeys = {
  all: ["people"] as const,
  lists: () => [...personKeys.all, "list"] as const,
  detail: (id: number) => [...personKeys.all, "detail", id] as const,
};

export function usePeople() {
  return useQuery<PersonGetAllDto[]>({
    queryKey: personKeys.lists(),
    queryFn: async () => {
      const response = await axiosInstance.get<PersonGetAllDto[]>("/api/people/getall");
      return response.data;
    },
  });
}

export function usePerson(id: number) {
  return useQuery<PersonGetByIdDto>({
    queryKey: personKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<PersonGetByIdDto>("/api/people/getbyid", {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<PersonCreateResponseDto>, Error, CreatePersonCommand>({
    mutationFn: async (data: CreatePersonCommand) => {
      const response = await axiosInstance.post<ApiDataResult<PersonCreateResponseDto>>(
        "/api/people",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personKeys.lists() });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<PersonCreateResponseDto>, Error, UpdatePersonCommand>({
    mutationFn: async (data: UpdatePersonCommand) => {
      const response = await axiosInstance.put<ApiDataResult<PersonCreateResponseDto>>(
        "/api/people",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: personKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: personKeys.detail(variables.id) });
      }
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeletePersonCommand>({
    mutationFn: async (data: DeletePersonCommand) => {
      const response = await axiosInstance.delete<string>("/api/people", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personKeys.lists() });
    },
  });
}

export function useUploadPersonPhoto() {
  return useMutation<{ photoUrl: string; url: string }, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post<{ photoUrl: string; url: string }>(
        "/api/people/upload-photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
  });
}
