import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHING" | "POSTED" | "FAILED";

export type PostListItem = {
  id: string;
  status: PostStatus;
  caption: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostsFilters = {
  status?: PostStatus[];
  search?: string;
  limit?: number;
};

type PostsResponse = {
  items: PostListItem[];
  nextCursor?: string | null;
};

type PostResponse = {
  post: PostListItem;
};

export function usePostsQuery(filters: PostsFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["posts", filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (filters.status?.length) params.set("status", filters.status.join(","));
      if (filters.search) params.set("q", filters.search);
      if (filters.limit) params.set("limit", String(filters.limit));
      if (pageParam) params.set("cursor", pageParam);
      return apiGet<PostsResponse>(`/api/posts?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });
}

export function usePostQuery(postId?: string | null) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => apiGet<PostResponse>(`/api/posts/${postId}`),
    enabled: Boolean(postId),
  });
}
