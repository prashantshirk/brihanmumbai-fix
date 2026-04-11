"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { complaintAPI } from "@/lib/api";
import {
  Search,
  Loader2,
  MapPin,
  Calendar,
  Building2,
  FileText,
} from "lucide-react";

interface ComplaintData {
  id: string;
  issueType: string;
  severity: string;
  location: string;
  ward: string;
  status: string;
  department: string;
  submittedAt: string;
  description: string;
  additional_details?: string;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string;
}

export default function TrackPage() {
  const [complaintId, setComplaintId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [complaint, setComplaint] = useState<ComplaintData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const hasAutoSearched = useRef(false);

  const searchComplaint = useCallback(async (rawId: string) => {
    const id = rawId.trim();
    if (!id) return;
    setIsSearching(true);
    setNotFound(false);
    setErrorMessage("");
    setComplaint(null);

    try {
      const data = await complaintAPI.getOne(id);
      const mapped: ComplaintData = {
        id: data.id || data._id || id,
        issueType: data.issue_type || "Unknown issue",
        severity: data.severity || "Low",
        location: data.location || "N/A",
        ward: data.ward_number || "N/A",
        status: data.status || "Submitted",
        department: data.department || "General",
        submittedAt: data.created_at || "",
        description: data.description || "",
        additional_details: data.additional_details,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        image_url: data.image_url,
      };
      setComplaint(mapped);
    } catch (err) {
      setNotFound(true);
      setErrorMessage(
        err instanceof Error ? err.message : "Could not fetch complaint details. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId.trim()) return;
    await searchComplaint(complaintId);
  };

  useEffect(() => {
    if (hasAutoSearched.current || typeof window === "undefined") return;
    hasAutoSearched.current = true;
    const id = new URLSearchParams(window.location.search).get("id")?.trim();
    if (!id) return;
    setComplaintId(id);
    void searchComplaint(id);
  }, [searchComplaint]);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Track Your Complaint</h1>
            <p className="text-muted-foreground mt-2">
              Enter your complaint ID to check the current status
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="complaintId" className="sr-only">
                    Complaint ID
                  </Label>
                   <Input
                     id="complaintId"
                     placeholder="Enter complaint ID from your dashboard"
                     value={complaintId}
                     onChange={(e) => setComplaintId(e.target.value)}
                     className="font-mono"
                  />
                </div>
                <Button type="submit" disabled={isSearching || !complaintId.trim()}>
                  {isSearching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Not Found State */}
          {notFound && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="size-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Complaint Not Found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {errorMessage
                    ? errorMessage
                    : `We couldn't find a complaint with ID "${complaintId}". Please check the ID and try again.`}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/report">Report a New Issue</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Complaint Details */}
          {complaint && (
            <div className="space-y-6">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {complaint.issueType}
                        <Badge className={getSeverityColor(complaint.severity)}>
                          {complaint.severity}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="font-mono mt-1">
                        {complaint.id}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(complaint.status)} text-sm`}>
                      {complaint.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Details Grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{complaint.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ward</p>
                        <p className="font-medium">{complaint.ward}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Submitted</p>
                        <p className="font-medium">{formatDate(complaint.submittedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{complaint.department}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Description */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{complaint.description}</p>
                  </div>
                  {complaint.additional_details && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Additional Details</p>
                      <p className="text-sm bg-muted p-3 rounded-lg">{complaint.additional_details}</p>
                    </div>
                  )}
                  {complaint.latitude != null && complaint.longitude != null && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Coordinates</p>
                      <p className="text-sm bg-muted p-3 rounded-lg">
                        {complaint.latitude}, {complaint.longitude}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/dashboard">View All Reports</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/report">Report Another Issue</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!complaint && !notFound && !isSearching && (
            <div className="text-center py-12">
              <div className="size-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Search className="size-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Enter Your Complaint ID</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                You received a complaint ID when you submitted your report. Enter it above to see the current status and timeline.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
