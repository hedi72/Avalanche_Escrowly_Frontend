"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Users,
  Search,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ImageIcon,
  Edit,
  Trash2,
  ArrowUpDown,
  UserCheck,
  Award,
  Download,
  CheckCheck,
} from "lucide-react";
import { QuestService } from "@/lib/services";
import { Partner } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PartnerManagementProps {
  className?: string;
}

export function PartnerManagement({ className }: PartnerManagementProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Create partner form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerPhoto, setNewPartnerPhoto] = useState<File | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit partner form state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editPartnerName, setEditPartnerName] = useState("");
  const [editPartnerPhoto, setEditPartnerPhoto] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete partner state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);

  // Copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch partners from API
  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = session?.user?.token;
      const response = await QuestService.getPartners(
        page,
        limit,
        sortOrder,
        debouncedSearchTerm || undefined,
        token
      );

      if (response.success) {
        setPartners(response.partners);
        setFilteredPartners(response.partners); // Set filtered partners to the same as partners since filtering is now server-side
        setTotalPages(response.numberOfPages);
      } else {
        throw new Error("Failed to fetch partners");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      setError(errorMessage);
      console.error("Error fetching partners:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, sortOrder]);

  // Fetch partners on component mount and when dependencies change
  useEffect(() => {
    if (session?.user?.token) {
      fetchPartners();
    }
  }, [page, limit, sortOrder, debouncedSearchTerm, session?.user?.token]);

  // Handle create partner
  const handleCreatePartner = async () => {
    if (!newPartnerName || !newPartnerName.trim()) {
      setCreateError("Partner name is required");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      const token = session?.user?.token;

      await QuestService.createPartner(
        newPartnerName.trim(),
        newPartnerPhoto || undefined,
        token
      );

      // Reset form
      setNewPartnerName("");
      setNewPartnerPhoto(null);
      setIsCreateDialogOpen(false);

      // Show success toast
      toast({
        title: "Partner Created!",
        description: `Partner "${newPartnerName.trim()}" has been created successfully.`,
      });

      // Refresh partners list
      await fetchPartners();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create partner";
      setCreateError(errorMessage);
      console.error("Error creating partner:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPartnerPhoto(file);
    }
  };

  // Handle copy referral code
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);

      toast({
        title: "Referral Code Copied!",
        description: `Copied "${code}" to clipboard`,
      });
    } catch (err) {
      console.error("Failed to copy code:", err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy referral code to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle copy full referral link
  const handleCopyReferralLink = async (code: string) => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
      const referralLink = `${baseUrl}/auth?flow=register&ref=${code}`;

      await navigator.clipboard.writeText(referralLink);
      setCopiedCode(`link-${code}`);
      setTimeout(() => setCopiedCode(null), 2000);

      toast({
        title: "Referral Link Copied!",
        description: `Copied full referral link to clipboard`,
      });
    } catch (err) {
      console.error("Failed to copy referral link:", err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy referral link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle edit partner
  const handleEditPartner = async (partner: Partner) => {
    try {
      setEditLoading(true);
      const token = session?.user?.token;

      console.log("Fetching partner data for ID:", partner.id);

      // Fetch the latest partner data
      const partnerData = await QuestService.getPartner(partner.id, token);

      console.log("Received partner data:", partnerData);

      setEditingPartner(partnerData);
      setEditPartnerName(partnerData.name || "");
      setEditPartnerPhoto(null);
      setEditError(null);
      setIsEditDialogOpen(true);
    } catch (err: any) {
      console.error("Error fetching partner data:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load partner data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Handle update partner
  const handleUpdatePartner = async () => {
    if (!editingPartner || !editPartnerName || !editPartnerName.trim()) {
      setEditError("Partner name is required");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);
      const token = session?.user?.token;

      await QuestService.updatePartner(
        editingPartner.id,
        editPartnerName.trim(),
        editPartnerPhoto || undefined,
        token
      );

      // Reset form
      setEditingPartner(null);
      setEditPartnerName("");
      setEditPartnerPhoto(null);
      setIsEditDialogOpen(false);

      // Show success toast
      toast({
        title: "Partner Updated!",
        description: `Partner "${editPartnerName.trim()}" has been updated successfully.`,
      });

      // Refresh partners list
      await fetchPartners();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update partner";
      setEditError(errorMessage);
      console.error("Error updating partner:", err);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete partner
  const handleDeletePartner = async (partner: Partner) => {
    setPartnerToDelete(partner);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete partner
  const confirmDeletePartner = async () => {
    if (!partnerToDelete) return;

    try {
      setDeleteLoading(true);
      const token = session?.user?.token;

      await QuestService.deletePartner(partnerToDelete.id, token);

      // Reset state
      setPartnerToDelete(null);
      setIsDeleteDialogOpen(false);

      // Show success toast
      toast({
        title: "Partner Deleted!",
        description: `Partner "${partnerToDelete.name}" has been deleted successfully.`,
      });

      // Refresh partners list
      await fetchPartners();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete partner";
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error deleting partner:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle edit file input change
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPartnerPhoto(file);
    }
  };

  // Handle download CSV
  const handleDownloadCSV = async (partnerId: number, partnerName: string) => {
    try {
      const token = session?.user?.token;
      const blob = await QuestService.downloadPartnerReferredUsersCSV(
        partnerId,
        token
      );

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${partnerName.replace(/\s+/g, "_")}_referred_users.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "CSV Downloaded!",
        description: `Referred users data for "${partnerName}" has been downloaded.`,
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to download CSV";
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error downloading CSV:", err);
    }
  };

  // Pagination helpers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  const renderPaginationItems = () => {
    const items: JSX.Element[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={page === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // First page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={page === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Left ellipsis
      if (page > 4) {
        items.push(
          <PaginationItem key="ellipsis-left">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Current page and nearby pages
      const start = Math.max(2, page - 2);
      const end = Math.min(totalPages - 1, page + 2);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={page === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Right ellipsis
      if (page < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis-right">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={page === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  if (error) {
    return (
      <Card className="border-2 border-dashed border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-600/5">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-red-600 font-mono">
              ERROR_LOADING_PARTNERS
            </h3>
            <p className="text-sm text-red-500/80">{error}</p>
            <Button
              onClick={fetchPartners}
              variant="outline"
              size="sm"
              className="border-red-500/20 text-red-600 hover:bg-red-500/10 font-mono"
            >
              RETRY
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/5 rounded-xl" />
        <Card className="relative border-2 border-dashed border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-dashed border-purple-500/30">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="font-mono text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    PARTNER_MANAGEMENT
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    Manage platform partners and referral codes
                  </p>
                </div>
              </div>

              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="font-mono gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="h-4 w-4" />
                    ADD_PARTNER
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-mono">
                      CREATE_NEW_PARTNER
                    </DialogTitle>
                    <DialogDescription>
                      Add a new partner to the platform. Photo is optional.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="partner-name" className="font-mono">
                        PARTNER_NAME*
                      </Label>
                      <Input
                        id="partner-name"
                        placeholder="Enter partner name..."
                        value={newPartnerName}
                        onChange={(e) => setNewPartnerName(e.target.value)}
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="partner-photo" className="font-mono">
                        PARTNER_PHOTO (optional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="partner-photo"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="font-mono"
                        />
                        {newPartnerPhoto && (
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>

                    {createError && (
                      <div className="flex items-center gap-2 p-3 rounded border border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">
                          {createError}
                        </span>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setNewPartnerName("");
                        setNewPartnerPhoto(null);
                        setCreateError(null);
                      }}
                      disabled={createLoading}
                      className="font-mono"
                    >
                      CANCEL
                    </Button>
                    <Button
                      onClick={handleCreatePartner}
                      disabled={
                        createLoading ||
                        !newPartnerName ||
                        !newPartnerName.trim()
                      }
                      className="font-mono gap-2"
                    >
                      {createLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          CREATING...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          CREATE_PARTNER
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Edit Partner Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">EDIT_PARTNER</DialogTitle>
            <DialogDescription>
              Update partner information. Leave photo empty to keep current
              photo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-partner-name" className="font-mono">
                PARTNER_NAME*
              </Label>
              <Input
                id="edit-partner-name"
                placeholder="Enter partner name..."
                value={editPartnerName}
                onChange={(e) => setEditPartnerName(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-partner-photo" className="font-mono">
                UPDATE_PHOTO (optional)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-partner-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileChange}
                  className="font-mono"
                />
                {editPartnerPhoto ? (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500/20"
                  >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    New Photo
                  </Badge>
                ) : (
                  editingPartner?.photo && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-600 border-blue-500/20"
                    >
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Current Photo
                    </Badge>
                  )
                )}
              </div>
              {editingPartner?.photo && (
                <p className="text-xs text-muted-foreground">
                  Current: {editingPartner.photo}
                </p>
              )}
            </div>

            {editError && (
              <div className="flex items-center gap-2 p-3 rounded border border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">{editError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingPartner(null);
                setEditPartnerName("");
                setEditPartnerPhoto(null);
                setEditError(null);
              }}
              disabled={editLoading}
              className="font-mono"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleUpdatePartner}
              disabled={
                editLoading || !editPartnerName || !editPartnerName.trim()
              }
              className="font-mono gap-2"
            >
              {editLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  UPDATING...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  UPDATE_PARTNER
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Partner Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-red-600">
              DELETE_PARTNER
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this partner? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {partnerToDelete && (
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {partnerToDelete.photo ? (
                    <Avatar className="h-12 w-12 border-2 border-red-200">
                      <AvatarImage
                        src={`${
                          process.env.NEXT_PUBLIC_API_URL ||
                          "https://hedera-quests.com"
                        }/uploads/${partnerToDelete.photo}`}
                        alt={partnerToDelete.name}
                      />
                      <AvatarFallback className="bg-red-100 text-red-600 font-mono">
                        {partnerToDelete.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-12 w-12 rounded-full border-2 border-dashed border-red-300 flex items-center justify-center bg-red-100">
                      <ImageIcon className="h-6 w-6 text-red-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium font-mono text-red-700">
                      {partnerToDelete.name}
                    </div>
                    <div className="text-sm text-red-500 font-mono">
                      ID: {partnerToDelete.id}
                    </div>
                    <div className="text-sm text-red-500 font-mono">
                      Code: {partnerToDelete.referral_code}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded border border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <strong>Warning:</strong> Deleting this partner will
                  permanently remove all associated data and referral tracking.
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setPartnerToDelete(null);
              }}
              disabled={deleteLoading}
              className="font-mono"
            >
              CANCEL
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePartner}
              disabled={deleteLoading}
              className="font-mono gap-2"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  DELETING...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  DELETE_PARTNER
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="border-2 border-dashed border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners by name or referral code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select
                value={sortOrder}
                onValueChange={(value: "ASC" | "DESC") => setSortOrder(value)}
              >
                <SelectTrigger className="w-[140px] font-mono">
                  <SelectValue placeholder="Sort by referred users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC" className="font-mono">
                    MOST USERS
                  </SelectItem>
                  <SelectItem value="ASC" className="font-mono">
                    LEAST USERS
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card className="border-2 border-dashed border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="ml-3 font-mono text-emerald-500">
                  LOADING_PARTNERS...
                </span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-dashed border-emerald-500/20">
                    <TableHead className="font-mono text-emerald-600">
                      PARTNER
                    </TableHead>
                    <TableHead className="font-mono text-emerald-600">
                      REFERRAL_CODE
                    </TableHead>
                    <TableHead className="font-mono text-emerald-600 text-center">
                      ANALYTICS
                    </TableHead>
                    <TableHead className="font-mono text-emerald-600 text-right">
                      ACTIONS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.length > 0 ? (
                    filteredPartners.map((partner) => (
                      <TableRow
                        key={partner.id}
                        className="border-b border-dashed border-emerald-500/10 hover:bg-emerald-500/5 transition-colors"
                      >
                        {/* Partner Info with Photo */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {partner.photo ? (
                              <Avatar className="h-12 w-12 border-2 border-dashed border-emerald-500/20">
                                <AvatarImage
                                  src={`${
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    "https://hedera-quests.com"
                                  }/uploads/${partner.photo}`}
                                  alt={partner.name}
                                />
                                <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-mono">
                                  {partner.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-12 w-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium font-mono">
                                {partner.name}
                              </div>
                              <div className="text-sm text-muted-foreground font-mono">
                                ID: {partner.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Referral Code */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono text-xs"
                            >
                              {partner.referral_code}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Analytics Section */}
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            {/* Total Referred Users */}
                            <div className="flex items-center justify-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-mono text-xs flex items-center gap-1"
                              >
                                <Users className="h-3 w-3" />
                                {partner.numberOfReferredUsers || 0} Total
                              </Badge>
                            </div>

                            {/* Sub-metrics */}
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-600 border-green-500/20 font-mono text-[10px] flex items-center gap-1"
                                title="Users who completed DID verification"
                              >
                                <UserCheck className="h-2.5 w-2.5" />
                                {partner.numberOfDidReferredUsers || 0} DID
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-orange-500/10 text-red-600 border-orange-500/20 font-mono text-[10px] flex items-center gap-1"
                                title="Users who completed DoraHacks quest"
                              >
                                <Award className="h-2.5 w-2.5" />
                                {partner.numberOfDorrahacksReferredUsers ||
                                  0}{" "}
                                DoraHacks
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono text-[10px] flex items-center gap-1"
                                title="Users who completed both DID and DoraHacks"
                              >
                                <CheckCheck className="h-2.5 w-2.5" />
                                {partner.numberOfCompletedReferredUsers ||
                                  0}{" "}
                                Both
                              </Badge>
                            </div>

                            {/* Conversion Rate */}
                            {partner.numberOfReferredUsers &&
                              partner.numberOfReferredUsers > 0 && (
                                <div className="text-[10px] text-muted-foreground font-mono text-center">
                                  {(
                                    ((partner.numberOfCompletedReferredUsers ||
                                      0) /
                                      partner.numberOfReferredUsers) *
                                    100
                                  ).toFixed(1)}
                                  % completed both
                                </div>
                              )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopyCode(partner.referral_code)
                              }
                              className="font-mono gap-1 border-blue-500/20 text-blue-600 hover:bg-blue-500/10 text-xs px-2"
                            >
                              {copiedCode === partner.referral_code ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span className="hidden sm:inline">
                                    COPIED
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span className="hidden sm:inline">COPY</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopyReferralLink(partner.referral_code)
                              }
                              className="font-mono gap-1 border-green-500/20 text-green-600 hover:bg-green-500/10 text-xs px-2"
                            >
                              {copiedCode ===
                              `link-${partner.referral_code}` ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span className="hidden sm:inline">LINK</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span className="hidden sm:inline">LINK</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadCSV(partner.id, partner.name)
                              }
                              className="font-mono gap-1 border-purple-500/20 text-purple-600 hover:bg-purple-500/10 text-xs px-2"
                            >
                              <Download className="h-3 w-3" />
                              <span className="hidden sm:inline">CSV</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPartner(partner)}
                              disabled={editLoading}
                              className="font-mono gap-1 border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/10 text-xs px-2"
                            >
                              {editLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Edit className="h-3 w-3" />
                                  <span className="hidden sm:inline">EDIT</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePartner(partner)}
                              className="font-mono gap-1 border-red-500/20 text-red-600 hover:bg-red-500/10 text-xs px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="hidden sm:inline">DELETE</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-muted-foreground/50" />
                          <div className="text-lg font-medium text-muted-foreground font-mono">
                            NO_PARTNERS_FOUND
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm
                              ? "Try adjusting your search criteria"
                              : "Create your first partner to get started"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="border-2 border-dashed border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5">
          <CardContent className="p-4">
            <Pagination className="w-full">
              <PaginationContent className="flex flex-wrap justify-center gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(page - 1)}
                    className={cn(
                      "cursor-pointer font-mono",
                      page === 1 &&
                        "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(page + 1)}
                    className={cn(
                      "cursor-pointer font-mono",
                      page === totalPages &&
                        "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {/* <div className="flex items-center justify-center mt-4 gap-4 text-sm text-muted-foreground font-mono">
              <span>PAGE {page} OF {totalPages}</span>
              <span>•</span>
              <span>{partners.length} PARTNERS TOTAL</span>
            </div> */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PartnerManagement;
