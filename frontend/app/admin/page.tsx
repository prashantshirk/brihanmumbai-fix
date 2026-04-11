"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminAPI, Complaint as ApiComplaint } from "@/lib/api";
import { getAdmin, logoutAdmin, saveAdminSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  complaintText?: string;
  image_url?: string;
}

const wards = [
  "All Wards",
  "A-Ward",
  "B-Ward",
  "C-Ward",
  "D-Ward",
  "E-Ward",
  "F/N-Ward",
  "F/S-Ward",
  "G/N-Ward",
  "G/S-Ward",
  "H/E-Ward",
  "H/W-Ward",
  "K/E-Ward",
  "K/W-Ward",
  "L-Ward",
  "M/E-Ward",
  "M/W-Ward",
  "N-Ward",
  "P/N-Ward",
  "P/S-Ward",
  "R/C-Ward",
  "R/N-Ward",
  "R/S-Ward",
  "S-Ward",
  "T-Ward",
];

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [wardFilter, setWardFilter] = useState("All Wards");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [adminInfo, setAdminInfo] = useState<{ name: string; email: string } | null>(null);

  const itemsPerPage = 20;

  const mapComplaint = (complaint: ApiComplaint & { user_name?: string; user_email?: string }): Complaint => ({
    id: complaint.id || complaint._id || "",
    issueType: complaint.issue_type || "",
    severity: complaint.severity || "Low",
    location: complaint.location || "N/A",
    ward: complaint.ward_number || "N/A",
    status: complaint.status || "Submitted",
    department: complaint.department || "General",
    submittedAt: complaint.created_at || "",
    citizenName: complaint.user_name || "Citizen",
    citizenEmail: complaint.user_email || "N/A",
    description: complaint.description || "",
    complaintText: complaint.complaint_text || "",
    image_url: complaint.image_url,
  });

  const fetchAdminData = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const cachedAdmin = getAdmin();
      if (cachedAdmin) {
        setAdminInfo({ name: cachedAdmin.name, email: cachedAdmin.email });
      } else {
        const me = await adminAPI.me();
        const profile = { name: me.name || "Admin", email: me.email || "" };
        saveAdminSession({ id: me.id, name: profile.name, email: profile.email });
        setAdminInfo(profile);
      }

      const [complaintsData, statsData] = await Promise.all([
        adminAPI.getComplaints({ page: 1, limit: 200 }),
        adminAPI.getStats(),
      ]);

      setComplaints((complaintsData.complaints || []).map(mapComplaint));
      setStats({
        total: statsData.total || 0,
        submitted: statsData.submitted || 0,
        inProgress: statsData.in_progress || 0,
        resolved: statsData.resolved || 0,
      });
      setLastRefresh(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load admin dashboard data";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAdminData(true);
  }, [fetchAdminData]);

  const issueTypes = useMemo(() => {
    const unique = Array.from(new Set(complaints.map((c) => c.issueType).filter(Boolean)));
    return ["All Types", ...unique];
  }, [complaints]);

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((complaint) => {
        const statusMatch = statusFilter === "All Status" || complaint.status === statusFilter;
        const wardMatch = wardFilter === "All Wards" || complaint.ward === wardFilter;
        const typeMatch = typeFilter === "All Types" || complaint.issueType === typeFilter;
        const searchMatch =
          searchQuery === "" ||
          complaint.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          complaint.id.toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && wardMatch && typeMatch && searchMatch;
      }),
    [complaints, searchQuery, statusFilter, typeFilter, wardFilter]
  );

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdminData(false);
  };

  const handleLogout = async () => {
    await logoutAdmin();
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      await adminAPI.updateStatus(complaintId, newStatus);
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
      );
      if (selectedComplaint?.id === complaintId) {
        setSelectedComplaint((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update complaint status";
      setError(message);
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

  const formatDate = (dateString: string) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  return (
    <div className="min-h-screen bg-muted/30">
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
                  <AvatarFallback>
                    {(adminInfo?.name || "Admin")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "AD"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{adminInfo?.name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground">{adminInfo?.email || "Not available"}</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => void handleLogout()} aria-label="Logout">
                  <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void fetchAdminData(true)}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
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

            <Card>
              <CardHeader>
                <CardTitle>All Complaints</CardTitle>
                <CardDescription>Last refreshed: {lastRefresh.toLocaleTimeString()}</CardDescription>
              </CardHeader>
              <CardContent>
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
                          {complaint.id ? `${complaint.id.substring(0, 12)}...` : "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">{complaint.issueType}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{complaint.location}</TableCell>
                        <TableCell>{complaint.ward}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(complaint.severity)}>{complaint.severity}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={complaint.status}
                            onValueChange={(value) => void handleStatusUpdate(complaint.id, value)}
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
          </>
        )}
      </main>

      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="w-[92vw] sm:!max-w-xl !max-h-[85vh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          {selectedComplaint && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedComplaint.issueType}
                  <Badge className={getSeverityColor(selectedComplaint.severity)}>
                    {selectedComplaint.severity}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="font-mono">{selectedComplaint.id}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 min-h-0 overflow-y-auto pr-2">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {selectedComplaint.image_url ? (
                    <img
                      src={selectedComplaint.image_url}
                      alt={selectedComplaint.issueType}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Issue Image
                    </div>
                  )}
                </div>

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

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Reported by</p>
                  <p className="font-medium">{selectedComplaint.citizenName}</p>
                  <p className="text-sm text-muted-foreground">{selectedComplaint.citizenEmail}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedComplaint.description}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Formal Complaint Letter (AI Generated)</p>
                  <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                    {selectedComplaint.complaintText || "Formal complaint letter not available for this complaint."}
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t">
                <Select
                  value={selectedComplaint.status}
                  onValueChange={(value) => void handleStatusUpdate(selectedComplaint.id, value)}
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
