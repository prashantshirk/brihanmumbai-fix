"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  LogOut,
  MoreVertical,
  Eye,
  MapPin,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

// Mock complaints data
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
    citizenName: "Priya Sharma",
    citizenEmail: "priya.s@email.com",
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
    citizenName: "Rahul Mehta",
    citizenEmail: "rahul.m@email.com",
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
    citizenName: "Anjali Desai",
    citizenEmail: "anjali.d@email.com",
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
    citizenName: "Mohammed Khan",
    citizenEmail: "m.khan@email.com",
    description: "Major water pipe leak causing wastage",
  },
  {
    id: "BMF-R2H8I9-W3XY",
    issueType: "Road Damage",
    severity: "Medium",
    location: "LBS Marg, Kurla",
    ward: "L-Ward",
    status: "Submitted",
    department: "PWD",
    submittedAt: "2024-01-08T11:30:00Z",
    citizenName: "Sneha Patil",
    citizenEmail: "sneha.p@email.com",
    description: "Road surface damaged due to waterlogging",
  },
  {
    id: "BMF-S3J9K0-Z4AB",
    issueType: "Illegal Parking",
    severity: "Low",
    location: "Hill Road, Bandra",
    ward: "H/W-Ward",
    status: "Submitted",
    department: "Traffic",
    submittedAt: "2024-01-16T08:20:00Z",
    citizenName: "Vikram Singh",
    citizenEmail: "vikram.s@email.com",
    description: "Vehicles blocking pedestrian access",
  },
];

const wards = [
  "All Wards", "A-Ward", "B-Ward", "C-Ward", "D-Ward", "E-Ward",
  "F/N-Ward", "F/S-Ward", "G/N-Ward", "G/S-Ward",
  "H/E-Ward", "H/W-Ward", "K/E-Ward", "K/W-Ward",
  "L-Ward", "M/E-Ward", "M/W-Ward", "N-Ward",
  "P/N-Ward", "P/S-Ward", "R/C-Ward", "R/N-Ward",
  "R/S-Ward", "S-Ward", "T-Ward"
];

const issueTypes = [
  "All Types", "Pothole", "Garbage Accumulation", "Street Light",
  "Water Leakage", "Road Damage", "Illegal Parking", "Tree Hazard",
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
  citizenName: string;
  citizenEmail: string;
  description: string;
}

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState(mockComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [wardFilter, setWardFilter] = useState("All Wards");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const itemsPerPage = 20;

  const stats = {
    total: mockComplaints.length,
    submitted: mockComplaints.filter((c) => c.status === "Submitted").length,
    inProgress: mockComplaints.filter((c) => c.status === "In Progress").length,
    resolved: mockComplaints.filter((c) => c.status === "Resolved").length,
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const statusMatch = statusFilter === "All Status" || complaint.status === statusFilter;
    const wardMatch = wardFilter === "All Wards" || complaint.ward === wardFilter;
    const typeMatch = typeFilter === "All Types" || complaint.issueType === typeFilter;
    const searchMatch =
      searchQuery === "" ||
      complaint.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.id.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && wardMatch && typeMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const handleStatusUpdate = (complaintId: string, newStatus: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
    );
    if (selectedComplaint?.id === complaintId) {
      setSelectedComplaint((prev) => prev ? { ...prev, status: newStatus } : null);
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
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold">BrihanMumbai Fix</h1>
                <p className="text-xs text-muted-foreground">Authority Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@mcgm.gov.in</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <LogOut className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
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
                  <p className="text-3xl font-bold">{stats.submitted}</p>
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
                  <p className="text-3xl font-bold">{stats.inProgress}</p>
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
                  <p className="text-3xl font-bold">{stats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Complaints Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Complaints</CardTitle>
                <CardDescription>
                  Last refreshed: {lastRefresh.toLocaleTimeString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={wardFilter} onValueChange={setWardFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ward" />
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
                <SelectTrigger className="w-[180px]">
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

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by location or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-mono text-xs">
                      {complaint.id.substring(0, 12)}...
                    </TableCell>
                    <TableCell className="font-medium">{complaint.issueType}</TableCell>
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
                      <Select
                        value={complaint.status}
                        onValueChange={(value) => handleStatusUpdate(complaint.id, value)}
                      >
                        <SelectTrigger className={`w-[130px] h-8 text-xs ${getStatusColor(complaint.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Submitted">Submitted</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{formatDate(complaint.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedComplaint(complaint)}>
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
          </CardContent>
        </Card>
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
                <DialogDescription className="font-mono">
                  {selectedComplaint.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image Placeholder */}
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">Issue Image</span>
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
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedComplaint.department}</p>
                  </div>
                </div>

                {/* Citizen Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Reported by</p>
                  <p className="font-medium">{selectedComplaint.citizenName}</p>
                  <p className="text-sm text-muted-foreground">{selectedComplaint.citizenEmail}</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedComplaint.description}</p>
                </div>
              </div>

              <DialogFooter>
                <Select
                  value={selectedComplaint.status}
                  onValueChange={(value) => handleStatusUpdate(selectedComplaint.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setSelectedComplaint(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
