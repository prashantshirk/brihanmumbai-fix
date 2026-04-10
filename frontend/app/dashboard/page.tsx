"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Mock data for complaints
const mockComplaints = [
  {
    id: "BMF-K7X2A9-P4QM",
    issueType: "Pothole",
    severity: "High",
    location: "Link Road, near Andheri Station",
    ward: "K/W-Ward",
    status: "In Progress",
    department: "Roads & Infrastructure",
    submittedAt: "2024-01-15T10:30:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Large pothole causing traffic disruption",
  },
  {
    id: "BMF-M3B8C2-R7TN",
    issueType: "Garbage Accumulation",
    severity: "Critical",
    location: "Sector 5, Vashi",
    ward: "H/E-Ward",
    status: "Submitted",
    department: "Sanitation",
    submittedAt: "2024-01-14T14:20:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Garbage piling up for over a week",
  },
  {
    id: "BMF-P9D4E5-S2KL",
    issueType: "Street Light",
    severity: "Medium",
    location: "MG Road, Fort",
    ward: "A-Ward",
    status: "Resolved",
    department: "Electricity",
    submittedAt: "2024-01-10T09:15:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Street light not working for 3 days",
  },
  {
    id: "BMF-Q1F6G7-T8UV",
    issueType: "Water Leakage",
    severity: "High",
    location: "Station Road, Bandra",
    ward: "H/W-Ward",
    status: "In Progress",
    department: "Water Supply",
    submittedAt: "2024-01-12T16:45:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Major water pipe leak causing wastage",
  },
  {
    id: "BMF-R2H8I9-W3XY",
    issueType: "Road Damage",
    severity: "Medium",
    location: "LBS Marg, Kurla",
    ward: "L-Ward",
    status: "Resolved",
    department: "PWD",
    submittedAt: "2024-01-08T11:30:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Road surface damaged due to waterlogging",
  },
  {
    id: "BMF-S3J9K0-Z4AB",
    issueType: "Pothole",
    severity: "Low",
    location: "Linking Road, Santacruz",
    ward: "H/W-Ward",
    status: "Submitted",
    department: "Roads & Infrastructure",
    submittedAt: "2024-01-16T08:20:00Z",
    imageUrl: "/api/placeholder/400/300",
    description: "Small pothole developing near school",
  },
];

interface Complaint {
  id: string;
  issueType: string;
  severity: string;
  location: string;
  ward: string;
  status: string;
  department: string;
  submittedAt: string;
  imageUrl: string;
  description: string;
}

export default function DashboardPage() {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const itemsPerPage = 10;

  const stats = {
    total: mockComplaints.length,
    submitted: mockComplaints.filter((c) => c.status === "Submitted").length,
    inProgress: mockComplaints.filter((c) => c.status === "In Progress").length,
    resolved: mockComplaints.filter((c) => c.status === "Resolved").length,
  };

  const filteredComplaints = mockComplaints.filter((complaint) => {
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
                  {paginatedComplaints.length > 0 ? (
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
                              <TableRow key={complaint.id}>
                                <TableCell className="font-mono text-xs">
                                  {complaint.id.substring(0, 12)}...
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
                          <Card key={complaint.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedComplaint(complaint)}>
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
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedComplaint && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedComplaint.issueType}
                  <Badge className={getSeverityColor(selectedComplaint.severity)}>
                    {selectedComplaint.severity}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Complaint ID: {selectedComplaint.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Issue Image
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="size-4" /> Location
                    </p>
                    <p className="font-medium">{selectedComplaint.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="size-4" /> Ward
                    </p>
                    <p className="font-medium">{selectedComplaint.ward}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="size-4" /> Submitted
                    </p>
                    <p className="font-medium">{formatDate(selectedComplaint.submittedAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline" className={getStatusColor(selectedComplaint.status)}>
                      {selectedComplaint.status}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedComplaint.description}</p>
                </div>

                {/* Department */}
                <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-3">
                  <Building2 className="size-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned to</p>
                    <p className="font-medium">{selectedComplaint.department}</p>
                  </div>
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
