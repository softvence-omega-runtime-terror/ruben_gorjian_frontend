import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";

type CreatePostInput = {
  assetId?: string;
  assetIds?: string[];
  contentItemId?: string;
  caption: string;
  hashtags?: string[];
  scheduledFor?: string;
  platforms: Array<"INSTAGRAM" | "FACEBOOK" | "LINKEDIN">;
  socialAccountIds?: string[];
};

type PublishPostInput = {
  postId: string;
};

export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePostInput) => apiPost("/api/posts", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function usePublishPostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId }: PublishPostInput) =>
      apiPost(`/api/posts/${postId}/publish`, {}),
    onMutate: ({ postId }) => {
      queryClient.setQueryData(["post", postId], (current: { post?: { status: string }; status?: string } | undefined) => {
        if (!current) return current;
        return { ...current, status: "PUBLISHING" };
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}
