"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { feedAPI, FeedPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Calendar,
  User,
  Plus,
  Filter,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wardFilter, setWardFilter] = useState("All Wards");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const wards = useMemo(() => {
    const unique = Array.from(new Set(posts.map((p) => p.ward_number).filter(Boolean)));
    return ["All Wards", ...unique];
  }, [posts]);

  const issueTypes = useMemo(() => {
    const unique = Array.from(new Set(posts.map((p) => p.issue_type).filter(Boolean)));
    return ["All Types", ...unique];
  }, [posts]);

  const loadPosts = useCallback(async (pageNumber: number, append: boolean) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const data = await feedAPI.getPosts(pageNumber, 12);
      setPosts((prev) => (append ? [...prev, ...(data.posts || [])] : data.posts || []));
      setPage(pageNumber);
      setHasMore(Boolean(data.has_more));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load community feed";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts(1, false);
  }, [loadPosts]);

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const wardMatch = wardFilter === "All Wards" || post.ward_number === wardFilter;
        const typeMatch = typeFilter === "All Types" || post.issue_type === typeFilter;
        return wardMatch && typeMatch;
      }),
    [posts, wardFilter, typeFilter]
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-destructive text-destructive-foreground";
      case "High":
        return "bg-orange-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-white";
      default:
        return "bg-green-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "In Progress":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Community Feed</h1>
              <p className="text-muted-foreground mt-1">
                See what issues citizens are reporting across Mumbai
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/report">
                <Plus className="size-4" />
                Report Issue
              </Link>
            </Button>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="size-4" />
                  <span>Filter by:</span>
                </div>
                <div className="flex flex-1 gap-4">
                  <Select value={wardFilter} onValueChange={setWardFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select Ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Issue Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video" />
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => void loadPosts(1, false)}>Retry</Button>
              </CardContent>
            </Card>
          ) : filteredPosts.length > 0 ? (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <Card key={post.id || post._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.issue_type || "Issue image"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        Issue Image
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={getSeverityColor(post.severity)}>
                        {post.severity}
                      </Badge>
                      <Badge variant="outline" className={`${getStatusColor(post.status)} backdrop-blur`}>
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{post.issue_type}</h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-4" />
                        <span>{post.location || "Mumbai"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="font-normal">
                          {post.ward_number || "N/A"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="size-4" />
                        <span>{post.citizen_name || "Anonymous"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        <span>{formatTimeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => void loadPosts(page + 1, true)}
                    disabled={isLoadingMore}
                    className="gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="size-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No posts found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                No issues match your current filters. Try adjusting your selection.
              </p>
              <Button asChild>
                <Link href="/report">Be the first to report</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
