"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { createTagAction, updateTagAction, deleteTagAction } from "@/lib/tags/actions";

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export function useTags(): { data: Tag[] | undefined; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tags(),
    queryFn: async () => {
      const res = await fetch("/api/tags");
      const json = await res.json();
      return json.tags as Tag[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  return { data, isLoading };
}

export function useCreateTag(): {
  mutateAsync: (params: { name: string; color: string }) => Promise<Tag>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: { name: string; color: string }) => {
      const result = await createTagAction(params.name, params.color);
      if (!result.success) {
        throw new Error(Object.values(result.errors).join(", "));
      }
      return result.tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
    },
  });

  return { mutateAsync: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateTag(): {
  mutateAsync: (params: {
    tagId: string;
    data: { name?: string; color?: string };
  }) => Promise<Tag>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: {
      tagId: string;
      data: { name?: string; color?: string };
    }) => {
      const result = await updateTagAction(params.tagId, params.data);
      if (!result.success) {
        throw new Error(Object.values(result.errors).join(", "));
      }
      return result.tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
    },
  });

  return { mutateAsync: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteTag(): {
  mutate: (tagId: string) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (tagId: string) => {
      const result = await deleteTagAction(tagId);
      if (!result.success) {
        throw new Error(Object.values(result.errors).join(", "));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
    },
  });

  return { mutate: mutation.mutate, isPending: mutation.isPending };
}
