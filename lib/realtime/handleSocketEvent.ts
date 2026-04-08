import { queryClient } from "@/lib/queryClient";

type ToastFn = (args: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

type PostStatusPayload = {
  postId: string;
  status: "published" | "failed" | "scheduled" | "processing";
  platform?: string;
  error?: string;
  updatedAt?: string;
};

type NotificationPayload = {
  type: "success" | "error" | "info";
  message: string;
};

const statusMap: Record<PostStatusPayload["status"], string> = {
  published: "POSTED",
  failed: "FAILED",
  scheduled: "SCHEDULED",
  processing: "PUBLISHING",
};

export function handleSocketEvent(
  eventName: string,
  payload: unknown,
  toast?: ToastFn
) {
  if (eventName === "post:status_changed") {
    const data = payload as PostStatusPayload;
    const mappedStatus = statusMap[data.status];

    queryClient.setQueryData(["post", data.postId], (current: { post?: { status: string; updatedAt?: string }; status?: string; updatedAt?: string } | undefined) => {
      if (!current) return current;
      if (current.post) {
        return {
          ...current,
          post: {
            ...current.post,
            status: mappedStatus,
            updatedAt: data.updatedAt ?? current.post.updatedAt,
          },
        };
      }
      return {
        ...current,
        status: mappedStatus,
        updatedAt: data.updatedAt ?? current.updatedAt,
      };
    });

    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["calendar"] });

    if (toast) {
      if (data.status === "published") {
        toast({ title: "Post published successfully" });
      }
      if (data.status === "failed") {
        toast({
          title: "Post failed to publish",
          description: data.error,
          variant: "destructive",
        });
      }
    }
    return;
  }

  if (eventName === "notification") {
    const data = payload as NotificationPayload;
    if (!toast) return;
    const title =
      data.type === "success"
        ? "Success"
        : data.type === "error"
          ? "Error"
          : "Info";
    toast({
      title,
      description: data.message,
      variant: data.type === "error" ? "destructive" : "default",
    });
  }
}
