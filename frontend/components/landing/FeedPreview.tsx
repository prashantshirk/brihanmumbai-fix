"use client";

import { useEffect, useState } from "react";
import { feedAPI, FeedPost } from "@/lib/api";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { hasUserSession } from "@/lib/auth";

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-slate-100 text-slate-700",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

export default function FeedPreview() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    feedAPI
      .preview()
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleViewAll() {
    router.push(hasUserSession() ? "/feed" : "/login");
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <section id="community" className="py-16 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">What Mumbaikars Are Reporting</h2>
          <p className="text-muted-foreground">Live reports from citizens across Mumbai</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
                <div className="aspect-video bg-muted rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground">No reports yet. Be the first!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {posts.map((post) => {
              const postId = post.id || post._id;
              return (
                <div
                  key={postId}
                  className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video bg-muted">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.issue_type}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                        SEVERITY_COLORS[post.severity] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {post.severity}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{post.issue_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status] || ""}`}>
                        {post.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium flex-shrink-0">
                        {post.citizen_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="truncate">{post.citizen_name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-start gap-1 text-xs text-muted-foreground flex-1 min-w-0">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{post.location || "Mumbai"}</span>
                      </div>
                      {post.latitude && post.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${post.latitude},${post.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-1 rounded-full hover:bg-primary/10 text-primary transition-colors"
                          title="Open in Google Maps"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Navigation className="h-3 w-3" />
                        </a>
                      ) : (
                        <Navigation className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {post.created_at ? formatDate(post.created_at) : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={handleViewAll}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
          >
            View All Reports <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
