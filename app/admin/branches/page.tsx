"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "@/hooks/useBranches";
import { useTenants } from "@/hooks/useTenants";
import { BranchGetAllDto } from "@/types/branch.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Building,
  CheckCircle2,
  XCircle,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  MapPin,
  Phone,
  GitBranch,
  School,
} from "lucide-react";
import { getApiErrorMessage, checkIsSuperAdmin } from "@/lib/utils";
import { toast } from "sonner";

function BranchesContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  // Filter for SuperAdmin
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<number | undefined>(undefined);

  // Queries
  const { data: branches, isLoading, isError, refetch } = useBranches(
    !isSuperAdmin && userTenantId > 0
      ? { tenantId: userTenantId }
      : selectedTenantFilter
      ? { tenantId: selectedTenantFilter }
      : undefined
  );
  const { data: tenants } = useTenants(); // For SuperAdmin dropdowns

  // Mutations
  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();
  const deleteBranchMutation = useDeleteBranch();

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchGetAllDto | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<BranchGetAllDto | null>(null);

  // Form Fields
  const [formTenantId, setFormTenantId] = useState<number | undefined>(undefined);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Check URL query action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setSelectedBranch(null);
    setFormTenantId(isSuperAdmin ? (selectedTenantFilter || (tenants && tenants[0]?.id) || undefined) : undefined);
    setName("");
    setAddress("");
    setPhone("");
    setIsActive(true);
    setIsFormOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (branch: BranchGetAllDto) => {
    setSelectedBranch(branch);
    setFormTenantId(branch.tenantId);
    setName(branch.name || "");
    setAddress(branch.address || "");
    setPhone(branch.phone || "");
    setIsActive(branch.isActive ?? true);
    setIsFormOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Şube adı zorunludur.");
      return;
    }

    if (isSuperAdmin && !formTenantId) {
      toast.error("Lütfen şubenin bağlı olacağı kurumu seçiniz.");
      return;
    }

    if (selectedBranch) {
      // Update
      updateBranchMutation.mutate(
        {
          id: selectedBranch.id,
          tenantId: isSuperAdmin ? formTenantId : undefined,
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          isActive,
        },
        {
          onSuccess: (res) => {
            if (res.success !== false) {
              toast.success("Şube bilgileri başarıyla güncellendi.");
              setIsFormOpen(false);
              refetch();
            } else {
              toast.error(getApiErrorMessage(res.message, "Güncelleme sırasında hata oluştu."));
            }
          },
          onError: (err) => {
            toast.error(getApiErrorMessage(err, "Güncelleme yapılamadı."));
          },
        }
      );
    } else {
      // Create
      createBranchMutation.mutate(
        {
          tenantId: isSuperAdmin ? formTenantId : undefined,
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
        },
        {
          onSuccess: (res) => {
            if (res.success !== false) {
              toast.success("Yeni şube başarıyla eklendi.");
              setIsFormOpen(false);
              refetch();
            } else {
              toast.error(getApiErrorMessage(res.message, "Şube eklenirken hata oluştu."));
            }
          },
          onError: (err) => {
            toast.error(getApiErrorMessage(err, "Şube eklenemedi."));
          },
        }
      );
    }
  };

  // Submit Delete
  const handleDeleteConfirm = () => {
    if (!branchToDelete) return;

    deleteBranchMutation.mutate(
      { id: branchToDelete.id },
      {
        onSuccess: () => {
          toast.success("Şube başarıyla silindi.");
          setBranchToDelete(null);
          refetch();
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Silme işlemi başarısız."));
        },
      }
    );
  };

  // Filtered List
  const filteredBranches = (branches || []).filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.address && b.address.toLowerCase().includes(q)) ||
      (b.phone && b.phone.toLowerCase().includes(q)) ||
      (b.tenantName && b.tenantName.toLowerCase().includes(q))
    );
  });

  const totalCount = branches?.length || 0;
  const activeCount = branches?.filter((b) => b.isActive !== false).length || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <GitBranch className="h-8 w-8 text-primary" />
            Şube Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin
              ? "Tüm kurumlara ait şubeleri yönetin, yeni şubeler tanımlayın veya kurum ataması yapın."
              : "Kurumunuza bağlı şubeleri listeleyin, yeni şube ekleyin veya var olan şube bilgilerini güncelleyin."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Yeni Şube Ekle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isSuperAdmin ? "Toplam Şube (Tüm Kurumlar)" : "Toplam Şube"}
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Kayıtlı tüm şubeler</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Şubeler</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Aktif hizmet veren şubeler</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İletişim Bilgili</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {branches?.filter((b) => b.phone || b.address).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Telefon veya adres kayıtlı</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-sm border border-border/80">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Şube Listesi</CardTitle>
              <CardDescription>
                {isSuperAdmin
                  ? "Sistemdeki tüm kurumlara ait şubeler."
                  : "Kurumunuza ait şubelerin detaylı listesi."}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* SuperAdmin Tenant Filter Dropdown */}
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-muted-foreground shrink-0" />
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    value={selectedTenantFilter || ""}
                    onChange={(e) =>
                      setSelectedTenantFilter(Number(e.target.value) || undefined)
                    }
                  >
                    <option value="">Tüm Kurumlar</option>
                    {tenants?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search Input */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Şube adı, telefon veya adres..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">Şubeler yükleniyor...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
              <XCircle className="h-10 w-10" />
              <p className="text-sm font-medium">Şube verileri alınırken bir hata oluştu.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tekrar Dene
              </Button>
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <GitBranch className="h-12 w-12 text-muted-foreground/50" />
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Şube Bulunamadı</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Arama kriterlerinize uygun şube kaydı bulunamadı."
                    : "Sistemde henüz kayıtlı şube bulunmuyor. Yeni bir şube ekleyebilirsiniz."}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={handleOpenCreate} size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-1" /> Yeni Şube Ekle
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-16">#ID</TableHead>
                    {isSuperAdmin && <TableHead>Bağlı Kurum</TableHead>}
                    <TableHead>Şube Adı</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => (
                    <TableRow key={branch.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{branch.id}
                      </TableCell>

                      {/* SuperAdmin Tenant Name Column */}
                      {isSuperAdmin && (
                        <TableCell>
                          <Badge variant="outline" className="font-normal gap-1">
                            <School className="h-3 w-3 text-primary" />
                            {branch.tenantName || `Kurum #${branch.tenantId}`}
                          </Badge>
                        </TableCell>
                      )}

                      <TableCell className="font-medium">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <Building className="h-4 w-4 text-primary shrink-0" />
                          {branch.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {branch.phone ? (
                          <div className="flex items-center gap-1.5 text-sm text-foreground/90 font-mono">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {branch.phone}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {branch.address ? (
                          <div className="flex items-center gap-1.5 text-sm text-foreground/90 truncate">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{branch.address}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {branch.isActive !== false ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Aktif
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/25">
                            <XCircle className="h-3 w-3 mr-1" /> Pasif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(branch)}
                            title="Düzenle"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBranchToDelete(branch)}
                            title="Sil"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <GitBranch className="h-5 w-5 text-primary" />
                {selectedBranch ? "Şube Bilgilerini Düzenle" : "Yeni Şube Ekle"}
              </DialogTitle>
              <DialogDescription>
                {selectedBranch
                  ? "Mevcut şubenin bilgilerini güncelleyin."
                  : "Sisteme yeni bir şube eklemek için formu doldurun."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* SuperAdmin Tenant Selection Dropdown */}
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="branch-tenant">
                    Bağlı Kurum <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="branch-tenant"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formTenantId || ""}
                    onChange={(e) => setFormTenantId(Number(e.target.value) || undefined)}
                    required
                  >
                    <option value="">-- Kurum Seçiniz --</option>
                    {tenants?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Şube Adı */}
              <div className="space-y-2">
                <Label htmlFor="branch-name">
                  Şube Adı <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="branch-name"
                  placeholder="Örn: Kadıköy Şubesi / Merkez Kampüs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Telefon */}
              <div className="space-y-2">
                <Label htmlFor="branch-phone">Telefon Numarası</Label>
                <Input
                  id="branch-phone"
                  placeholder="Örn: 0216 555 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Adres */}
              <div className="space-y-2">
                <Label htmlFor="branch-address">Şube Adresi</Label>
                <Input
                  id="branch-address"
                  placeholder="Örn: Caferağa Mah. Moda Cad. No:12 Kadıköy/İstanbul"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* Status Switch (Edit Mode) */}
              {selectedBranch && (
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Şube Durumu</Label>
                    <p className="text-xs text-muted-foreground">
                      Şubenin aktif veya pasif olduğunu belirtir.
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={
                  createBranchMutation.isPending || updateBranchMutation.isPending
                }
              >
                {createBranchMutation.isPending || updateBranchMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Kaydediliyor...
                  </>
                ) : selectedBranch ? (
                  "Güncelle"
                ) : (
                  "Kaydet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!branchToDelete}
        onOpenChange={(open) => !open && setBranchToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şubeyi Silmek İstiyor Musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-foreground">{branchToDelete?.name}</strong> isimli şube kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteBranchMutation.isPending}
            >
              {deleteBranchMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function BranchesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      }
    >
      <BranchesContent />
    </Suspense>
  );
}
