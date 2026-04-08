"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Trash2,
  Eye,
  Calendar,
  User,
  MoreHorizontal,
  RefreshCcw,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dayjs from "dayjs";
import { buildStorageUrl } from "@/lib/storage-utils";
import { getEnvVarWithDefault } from "@/lib/env-utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { toUTC } from "@/lib/timezone";
import PostDetailsModal from "@/app/dashboard/calendar/post-details-modal";
import PostModal from "@/app/dashboard/calendar/post-modal";
import { useUpload } from "@/hooks/use-upload";
import { useCalendar } from "@/app/dashboard/calendar/calendar-context";
import { useSocket } from "@/app/providers/SocketProvider";

const STORAGE_BASE_URL = getEnvVarWithDefault(
  "NEXT_PUBLIC_STORAGE_BASE_URL",
  "",
);

type AdminPost = {
  id: string;
  caption: string | null;
  scheduledFor: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHING" | "POSTED" | "FAILED";
  failureReason?: string | null;
  asset?: {
    id: string;
    storageKey: string;
    type: "IMAGE" | "VIDEO";
  };
  user?: {
    id: string;
    name: string | null;
    fullName: string | null;
    email: string;
  };
  owner?: {
    id: string;
    name: string | null;
    email: string;
  };
  author?: {
    id: string;
    name: string | null;
    fullName: string | null;
    email: string;
  };
  targets: Array<{
    id: string;
    platform: string;
    status: string;
    errorMessage?: string | null;
    failureReason?: string | null;
    socialAccount?: {
      id: string;
      displayName: string;
    };
  }>;
};

export default function AdminPostsPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const { uploadFile, uploading } = useUpload();
  const { socket } = useSocket();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Admin should see all posts. If backend requires date range, we'll use a wide one.
      const res = await fetch("/api/scheduler/posts", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch posts");

      const data = await res.json();
      // Assume data.items or just data array
      const items = Array.isArray(data) ? data : data.items || [];
      console.log("DEBUG_POST:", items[0]);
      setPosts(items);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!socket) return;
    const handleStatus = () => {
      fetchPosts();
    };
    socket.on("post:status_changed", handleStatus);
    socket.on("post:updated", handleStatus);
    socket.on("post:deleted", handleStatus);
    socket.on("post:failed", handleStatus);
    socket.on("post:published", handleStatus);
    return () => {
      socket.off("post:status_changed", handleStatus);
      socket.off("post:updated", handleStatus);
      socket.off("post:deleted", handleStatus);
      socket.off("post:failed", handleStatus);
      socket.off("post:published", handleStatus);
    };
  }, [socket, fetchPosts]);

  const handleDeletePost = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    )
      return;

    try {
      const res = await fetch(`/api/scheduler/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        toast({ title: "Success", description: "Post deleted successfully" });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete post");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const extractUserIdFromPost = (post: any) => {
    let id = post.owner?.id || post.user?.id || post.author?.id;
    if (id) return id;

    // Fallback: Extract from asset storage key or URL if backend omits the owner
    const extractFromUrl = (url: string) => {
      const match = /\/user\/([a-z0-9]+)\//.exec(`/${url}`);
      return match ? match[1] : null;
    };

    if (post.asset?.storageKey) {
      const match = extractFromUrl(post.asset.storageKey);
      if (match) return match;
    }

    if (post.media && post.media.length > 0) {
      const storageKey = post.media[0].storageKey || post.media[0].url || '';
      const match = extractFromUrl(storageKey);
      if (match) return match;
    }

    if (post.assets && post.assets.length > 0) {
      const match = extractFromUrl(post.assets[0]);
      if (match) return match;
    }

    return null;
  };

  const handleViewPost = (postId: string) => {
    setViewingPostId(postId);
    setDetailsModalOpen(true);
  };

  const handleEditPost = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      const targetUserId = extractUserIdFromPost(post);
      if (!targetUserId) {
         toast({ title: "Error", description: "Cannot determine the user for this post as the backend did not provide an ID and there are no media assets.", variant: "destructive" });
         return;
      }
      // Fetch user's social accounts for editing
      const res = await fetch(
        `/api/admin/users/${targetUserId}/connected-platforms`,
        {
          credentials: "include",
        },
      );
      
      let loadedAccounts: any[] = [];
      if (res.ok) {
        const data = await res.json();
        const rawAccounts = Array.isArray(data) ? data : data.links || data.items || data.platforms || [];
        loadedAccounts = rawAccounts.map((acc: any) => ({
          id: acc.id || acc._id,
          platform: acc.platform?.toUpperCase(),
          displayName: acc.username || acc.displayName,
        }));
      }

      // If backend leaves socialAccount: null or loadedAccounts is missing the platform,
      // fallback to mocking the accounts directly from the post's targets so Admin is not blocked
      const accountIds: string[] = [];
      if (post.targets && post.targets.length > 0) {
        post.targets.forEach((t: any) => {
          const plat = t.platform?.toUpperCase();
          const targetAccId = t.socialAccount?.id;
          
          if (targetAccId) {
             accountIds.push(targetAccId);
             if (!loadedAccounts.find(a => a.id === targetAccId)) {
               loadedAccounts.push({
                 id: targetAccId,
                 platform: plat,
                 displayName: t.socialAccount?.displayName || `${plat} Account`,
               });
             }
          } else {
             // target has no socialAccount object, let's find one or mock one
             let matchingAcc = loadedAccounts.find(acc => acc.platform === plat);
             if (!matchingAcc) {
               matchingAcc = {
                 id: `mock-${plat}-${t.id}`,
                 platform: plat,
                 displayName: `${plat} (Pre-selected)`,
               };
               loadedAccounts.push(matchingAcc);
             }
             if (!accountIds.includes(matchingAcc.id)) {
               accountIds.push(matchingAcc.id);
             }
          }
        });
      }

      setSocialAccounts(loadedAccounts);

      setEditingPost({
        id: post.id,
        caption: post.caption || "",
        scheduledFor: post.scheduledFor,
        assetId: post.asset?.id,
        socialAccountIds: accountIds,
      });
      setEditModalOpen(true);
    } catch (err) {
      console.error("Failed to prepare edit modal:", err);
    }
  };

  const handleSavePost = async (payload: any) => {
    try {
      const res = await fetch(`/api/scheduler/posts/${editingPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          data: JSON.stringify({
            caption: payload.caption || ".",
            scheduledAt: toUTC(
              dayjs(payload.scheduledFor),
              "UTC",
            ).toISOString(),
            userId: extractUserIdFromPost(posts.find((p) => p.id === editingPost.id)),
            adminReason: "Modified by Administrator",
            assetIds:
              payload.assetIds || (payload.assetId ? [payload.assetId] : []),
            hashtags: payload.hashtags || [],
            platforms: payload.platforms,
            socialAccountIds: payload.socialAccountIds,
          }),
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Post updated successfully" });
        fetchPosts();
        setEditModalOpen(false);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update post");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handlePublishFromModal = async (payload: any) => {
    try {
      if (editingPost) {
        await handleSavePost(payload);
        await handlePublishPost(editingPost.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishPost = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.allSuccessful === false && data.results) {
          const errors = data.results.filter((r: any) => !r.success).map((r: any) => r.error);
          throw new Error(errors.join(", ") || "Publishing failed");
        }
        toast({
          title: "Success",
          description: "Publication triggered successfully",
        });
        fetchPosts();
      } else {
        const data = await res.json();
        throw new Error(data.error || data.message || "Failed to publish post");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: AdminPost["status"]) => {
    switch (status) {
      case "POSTED":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Published
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            Scheduled
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            Draft
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
            Failed
          </Badge>
        );
      case "PUBLISHING":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
            Publishing
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Post Management</h1>
          <p className="text-sm text-slate-400">
            Monitor and manage all scheduled content across all users.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPosts}
          disabled={loading}
          className="border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          <RefreshCcw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-lime-400" />
            All Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="w-[80px]">Media</TableHead>
                <TableHead>Caption</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
                      Loading posts...
                    </div>
                  </TableCell>
                </TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-48 text-center text-slate-500"
                  >
                    No posts found.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post: any) => {
                  let mediaUrl = null;
                  if (post.asset?.storageKey) {
                    mediaUrl = buildStorageUrl(STORAGE_BASE_URL, post.asset.storageKey);
                  } else if (post.media && post.media.length > 0) {
                    mediaUrl = post.media[0].url || buildStorageUrl(STORAGE_BASE_URL, post.media[0].storageKey);
                  } else if (post.assets && post.assets.length > 0) {
                    mediaUrl = post.assets[0];
                  }

                  return (
                    <TableRow
                      key={post.id}
                      className="border-slate-800 hover:bg-slate-800/30 transition-colors group"
                    >
                      <TableCell>
                        <div className="h-12 w-12 rounded-lg bg-slate-800 overflow-hidden relative border border-slate-700 group-hover:border-slate-600 transition-colors">
                          {mediaUrl ? (
                            <Image
                              src={mediaUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-600">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="line-clamp-2 text-sm text-slate-200">
                          {post.caption || (
                            <span className="text-slate-500 italic">
                              No caption
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-200">
                            {post.owner?.name || post.user?.fullName || post.user?.name || post.author?.fullName || post.author?.name || (extractUserIdFromPost(post) ? `User: ${extractUserIdFromPost(post)?.substring(0, 8)}...` : "Unknown User")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {post.owner?.email || post.user?.email || post.author?.email || "No email"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {post.targets?.map((t: any) => (
                            <Badge
                              key={t.id}
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 border-slate-700 bg-slate-900 text-slate-400 uppercase"
                            >
                              {t.platform}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(post.status)}
                          {post.status === "FAILED" && (post.failureReason || post.targets?.some((t: any) => t.errorMessage || t.failureReason)) && (
                            <span 
                              className="text-[10px] text-rose-400 max-w-[150px] truncate" 
                              title={post.failureReason || post.targets?.find((t: any) => t.errorMessage || t.failureReason)?.errorMessage || post.targets?.find((t: any) => t.errorMessage || t.failureReason)?.failureReason || "Failed"}
                            >
                              {post.failureReason || post.targets?.find((t: any) => t.errorMessage || t.failureReason)?.errorMessage || post.targets?.find((t: any) => t.errorMessage || t.failureReason)?.failureReason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-300">
                          {dayjs(post.scheduledFor).format("MMM D, YYYY")}
                        </div>
                        <div className="text-xs text-slate-500">
                          {dayjs(post.scheduledFor).format("HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-40 bg-slate-900 border-slate-800 text-slate-300"
                          >
                            <DropdownMenuItem
                              className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                              onClick={() => handleViewPost(post.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                              onClick={() => handleEditPost(post.id)}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Edit Post
                            </DropdownMenuItem>
                            {post.status !== "POSTED" && (
                              <DropdownMenuItem
                                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer text-lime-400"
                                onClick={() => handlePublishPost(post.id)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Publish Now
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 cursor-pointer"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PostDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        postId={viewingPostId}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        posts={posts as any}
      />

      <PostModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialDate={null}
        socialAccounts={socialAccounts}
        editingPost={editingPost}
        onCreate={handleSavePost}
        onPublish={handlePublishFromModal}
        onUpload={uploadFile as any}
        uploading={uploading}
        isAdmin={true}
      />
    </div>
  );
}
