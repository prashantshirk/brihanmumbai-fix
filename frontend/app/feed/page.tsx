"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";

// Mock community feed data
const mockFeedPosts = [
  {
    id: "1",
    issueType: "Pothole",
    severity: "High",
    location: "Link Road, Andheri West",
    ward: "K/W-Ward",
    status: "In Progress",
    citizenName: "Priya S.",
    submittedAt: "2024-01-16T08:30:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Large pothole near the bus stop causing traffic issues",
  },
  {
    id: "2",
    issueType: "Garbage Accumulation",
    severity: "Critical",
    location: "Sector 17, Vashi",
    ward: "H/E-Ward",
    status: "Submitted",
    citizenName: "Rahul M.",
    submittedAt: "2024-01-16T07:15:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Garbage overflowing from public bins for 3 days",
  },
  {
    id: "3",
    issueType: "Street Light",
    severity: "Medium",
    location: "MG Road, Fort",
    ward: "A-Ward",
    status: "Resolved",
    citizenName: "Anjali D.",
    submittedAt: "2024-01-15T22:45:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Street light flickering and causing safety concerns",
  },
  {
    id: "4",
    issueType: "Water Leakage",
    severity: "High",
    location: "Station Road, Bandra",
    ward: "H/W-Ward",
    status: "In Progress",
    citizenName: "Mohammed K.",
    submittedAt: "2024-01-15T18:30:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Water main leak flooding the street",
  },
  {
    id: "5",
    issueType: "Road Damage",
    severity: "Medium",
    location: "LBS Marg, Kurla",
    ward: "L-Ward",
    status: "Submitted",
    citizenName: "Sneha P.",
    submittedAt: "2024-01-15T16:20:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Road surface deteriorating after recent rains",
  },
  {
    id: "6",
    issueType: "Illegal Parking",
    severity: "Low",
    location: "Hill Road, Bandra",
    ward: "H/W-Ward",
    status: "Submitted",
    citizenName: "Vikram S.",
    submittedAt: "2024-01-15T14:10:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Vehicles parked on footpath blocking pedestrian access",
  },
];

const wards = [
  "All Wards",
  "A-Ward", "B-Ward", "C-Ward", "D-Ward", "E-Ward",
  "F/N-Ward", "F/S-Ward", "G/N-Ward", "G/S-Ward",
  "H/E-Ward", "H/W-Ward", "K/E-Ward", "K/W-Ward",
  "L-Ward", "M/E-Ward", "M/W-Ward", "N-Ward",
  "P/N-Ward", "P/S-Ward", "R/C-Ward", "R/N-Ward",
  "R/S-Ward", "S-Ward", "T-Ward"
];

const issueTypes = [
  "All Types",
  "Pothole",
  "Garbage Accumulation",
  "Street Light",
  "Water Leakage",
  "Road Damage",
  "Illegal Parking",
  "Tree Hazard",
  "Building Violation",
];

export default function FeedPage() {
  const [posts, setPosts] = useState(mockFeedPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [wardFilter, setWardFilter] = useState("All Wards");
  const [typeFilter, setTypeFilter] = useState("All Types");

  const filteredPosts = posts.filter((post) => {
    const wardMatch = wardFilter === "All Wards" || post.ward === wardFilter;
    const typeMatch = typeFilter === "All Types" || post.issueType === typeFilter;
    return wardMatch && typeMatch;
  });

  const loadMore = async () => {
    setIsLoading(true);
    // Simulate loading more posts
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

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
          {/* Page Header */}
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

          {/* Filters */}
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

          {/* Feed Posts */}
          {filteredPosts.length > 0 ? (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      Issue Image
                    </div>
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
                        <h3 className="font-semibold text-lg">{post.issueType}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {post.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-4" />
                        <span>{post.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="font-normal">
                          {post.ward}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="size-4" />
                        <span>{post.citizenName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        <span>{formatTimeAgo(post.submittedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Load More */}
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
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

          {/* Loading Skeletons (for initial load) */}
          {false && (
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
