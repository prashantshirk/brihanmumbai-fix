"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { complaintAPI, Complaint as ApiComplaint } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  MapPin,
  Calendar,
  Building2,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Complaint {
  id: string;
  issueType: string;
  issue_type?: string;
  severity: string;
  location: string;
  ward: string;
  status: string;
  department: string;
  submittedAt: string;
  image_url?: string;
  imageUrl?: string;
  description: string;
  additional_details?: string;
  complaintText?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function DashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const itemsPerPage = 10;

  useEffect(() => {
    complaintAPI
      .list(1, 10)
      .then((data) => {
        const mapped = (data.complaints || []).map((complaint: ApiComplaint) => ({
          id: complaint.id || complaint._id || "",
          issueType: complaint.issue_type || "",
          issue_type: complaint.issue_type || "",
          severity: complaint.severity || "Low",
          location: complaint.location || "",
          ward: complaint.ward_number || "",
          status: complaint.status || "Submitted",
          department: complaint.department || "General",
          submittedAt: complaint.created_at || "",
          image_url: complaint.image_url,
          imageUrl: complaint.image_url,
          description: complaint.description || "",
          additional_details: complaint.additional_details,
          complaintText: complaint.complaint_text || "",
          latitude: complaint.latitude,
          longitude: complaint.longitude,
        }));
        setComplaints(mapped);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load complaints:", err);
        setIsLoading(false);
      });
  }, []);

  const complaint = selectedComplaint;

  const stats = {
    total: complaints.length,
    submitted: complaints.filter((c) => c.status === "Submitted").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (activeTab === "all") return true;
    if (activeTab === "submitted") return complaint.status === "Submitted";
    if (activeTab === "progress") return complaint.status === "In Progress";
    if (activeTab === "resolved") return complaint.status === "Resolved";
    return true;
  });

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Track and manage your reported issues
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/report">
                <Plus className="size-4" />
                Report New Issue
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <AlertCircle className="size-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.submitted}</p>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="size-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="size-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Complaints Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Reports</CardTitle>
              <CardDescription>
                View and track all your submitted civic issue reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                  <TabsTrigger value="submitted">Submitted ({stats.submitted})</TabsTrigger>
                  <TabsTrigger value="progress">In Progress ({stats.inProgress})</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {isLoading ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">Loading complaints...</div>
                  ) : paginatedComplaints.length > 0 ? (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Ward</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedComplaints.map((complaint) => (
                              <TableRow key={`${complaint.id}-${complaint.submittedAt}`}>
                                <TableCell className="font-mono text-xs">
                                  {complaint.id ? `${complaint.id.substring(0, 12)}...` : "N/A"}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {complaint.issueType}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {complaint.location}
                                </TableCell>
                                <TableCell>{complaint.ward}</TableCell>
                                <TableCell>
                                  <Badge className={getSeverityColor(complaint.severity)}>
                                    {complaint.severity}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={getStatusColor(complaint.status)}>
                                    {complaint.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(complaint.submittedAt)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedComplaint(complaint)}
                                  >
                                    <Eye className="size-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-4">
                        {paginatedComplaints.map((complaint) => (
                          <Card key={`${complaint.id}-${complaint.submittedAt}`} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedComplaint(complaint)}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge className={getSeverityColor(complaint.severity)}>
                                      {complaint.severity}
                                    </Badge>
                                    <Badge variant="outline" className={getStatusColor(complaint.status)}>
                                      {complaint.status}
                                    </Badge>
                                  </div>
                                  <p className="font-medium">{complaint.issueType}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {complaint.location}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(complaint.submittedAt)}
                                  </p>
                                </div>
                                <Eye className="size-5 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t">
                          <p className="text-sm text-muted-foreground">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                            {Math.min(currentPage * itemsPerPage, filteredComplaints.length)} of{" "}
                            {filteredComplaints.length} results
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-sm px-2">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                            >
                              <ChevronRight className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <FileText className="size-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">No reports found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {activeTab === "all"
                          ? "You haven't submitted any reports yet."
                          : `No ${activeTab} reports found.`}
                      </p>
                      <Button asChild>
                        <Link href="/report">Report an Issue</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Complaint Detail Dialog */}
      <Dialog open={!!complaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="w-[92vw] sm:max-w-lg h-[85vh] max-h-[85vh] flex flex-col overflow-hidden p-0">
          {complaint && (
            <>
              <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  {complaint.issueType}
                  <Badge className={getSeverityColor(complaint.severity)}>
                    {complaint.severity}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Complaint ID: {complaint.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 min-h-0 overflow-y-auto px-6 pb-6">
                {/* Image */}
                <div className="rounded-lg">
                  <img
                    src={complaint.image_url || complaint.imageUrl}
                    alt={complaint.issue_type || "Complaint image"}
                    className="w-full h-44 object-cover rounded-lg"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector(".img-fallback")) {
                        const fallback = document.createElement("div");
                        fallback.className =
                          "img-fallback w-full h-44 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm";
                        fallback.textContent = complaint.issue_type || "Image unavailable";
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{complaint.location || "Location not provided"}</span>
                    </div>
                    {complaint.latitude && complaint.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-1"
                      >
                        <Navigation className="h-4 w-4" />
                        Open exact location in Google Maps
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Navigation className="h-4 w-4 opacity-40" />
                        GPS coordinates not available
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="size-4" /> Ward
                    </p>
                    <p className="font-medium">{complaint.ward}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="size-4" /> Submitted
                    </p>
                    <p className="font-medium">{formatDate(complaint.submittedAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline" className={getStatusColor(complaint.status)}>
                      {complaint.status}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{complaint.description}</p>
                </div>

                {complaint.additional_details && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Details</p>
                    <p className="text-sm">{complaint.additional_details}</p>
                  </div>
                )}

                {/* Department */}
                <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-3">
                  <Building2 className="size-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned to</p>
                    <p className="font-medium">{complaint.department}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Formal Complaint Letter (AI Generated)</p>
                  <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                    {complaint.complaintText || "Formal complaint letter not available for this complaint."}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
