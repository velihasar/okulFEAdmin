"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  useTenants,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
} from "@/hooks/useTenants";
import { TenantGetAllDto } from "@/types/tenant.types";
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  School,
  Hash,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getMinioUrl, getApiErrorMessage, checkIsSuperAdmin } from "@/lib/utils";
import { toast } from "sonner";

function TenantLogoItem({ logoUrl, name }: { logoUrl?: string | null; name?: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  if (!logoUrl || hasError) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
        {name ? name.charAt(0).toUpperCase() : "O"}
      </div>
    );
  }

  return (
    <div className="h-12 w-12 flex items-center justify-center rounded-lg border bg-card p-1 shadow-xs overflow-hidden">
      <img
        src={getMinioUrl(logoUrl)}
        alt={name || "Tenant Logo"}
        className="max-h-full max-w-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default function TenantsPage() {
  const { data: tenants, isLoading, isError, refetch } = useTenants();
  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();
  const deleteTenantMutation = useDeleteTenant();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantGetAllDto | null>(null);

  // Delete Dialog
  const [tenantToDelete, setTenantToDelete] = useState<TenantGetAllDto | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  // Open Add Dialog
  const handleOpenAdd = () => {
    setSelectedTenant(null);
    setName("");
    setCode("");
    setLogoUrl("");
    setLogoFile(null);
    setPreviewUrl("");
    setIsActive(true);
    setIsFormOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (tenant: TenantGetAllDto) => {
    setSelectedTenant(tenant);
    setName(tenant.name || "");
    setCode(tenant.code || "");
    setLogoUrl(tenant.logoUrl || "");
    setLogoFile(null);
    setPreviewUrl(tenant.logoUrl || "");
    setIsActive(tenant.isActive ?? true);
    setIsFormOpen(true);
  };

  // Handle Logo File Select
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Kurum adı zorunludur.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    if (code.trim()) formData.append("code", code.trim());
    formData.append("isActive", String(isActive));

    if (logoFile) {
      formData.append("logo", logoFile);
    } else if (logoUrl.trim()) {
      formData.append("logoUrl", logoUrl.trim());
    }

    if (selectedTenant) {
      // Update
      formData.append("id", String(selectedTenant.id));

      updateTenantMutation.mutate(formData, {
        onSuccess: (res) => {
          if (res.success !== false) {
            toast.success("Kurum bilgileri başarıyla güncellendi.");
            setIsFormOpen(false);
            refetch();
          } else {
            toast.error(getApiErrorMessage(res.message, "Güncelleme sırasında hata oluştu."));
          }
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Güncelleme yapılamadı."));
        },
      });
    } else {
      // Create
      createTenantMutation.mutate(formData, {
        onSuccess: (res) => {
          if (res.success !== false) {
            toast.success("Yeni kurum başarıyla eklendi.");
            setIsFormOpen(false);
            refetch();
          } else {
            toast.error(getApiErrorMessage(res.message, "Kurum eklenirken hata oluştu."));
          }
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Kurum eklenemedi."));
        },
      });
    }
  };

  // Submit Delete
  const handleDeleteConfirm = () => {
    if (!tenantToDelete) return;

    deleteTenantMutation.mutate(
      { id: tenantToDelete.id },
      {
        onSuccess: () => {
          toast.success("Kurum başarıyla silindi.");
          setTenantToDelete(null);
          refetch();
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Silme işlemi başarısız."));
        },
      }
    );
  };

  const { data: session } = useSession();
  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  // Filtered List
  const filteredTenants = (tenants || []).filter((t) => {
    if (!isSuperAdmin && userTenantId > 0 && t.id !== userTenantId) {
      return false;
    }
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.code && t.code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Kurumlar / Okullar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-primary" />
            Kurum / Okul Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin
              ? "Sistemdeki tüm okul ve kurum tanımlamalarını bu ekrandan yönetebilirsiniz."
              : "Kurumunuza ait genel bilgileri bu ekrandan görüntüleyebilir ve güncellleyebilirsiniz."}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={handleOpenAdd} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Yeni Kurum Ekle
          </Button>
        )}
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Kayıtlı Kurumlar</CardTitle>
              <CardDescription>
                Sistemde tanımlı toplam {tenants?.length || 0} kurum bulunmaktadır.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Kurum adı veya kodu ara..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                title="Yenile"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Spinner className="h-8 w-8 text-primary" />
              <p className="text-sm">Kurum verileri yükleniyor...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive gap-2">
              <p className="font-medium">Veriler yüklenirken bir sorun oluştu.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tekrar Dene
              </Button>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <School className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-base font-medium">
                {searchQuery ? "Aramanıza uygun kurum bulunamadı." : "Henüz bir kurum eklenmemiş."}
              </p>
              {!searchQuery && (
                <Button variant="outline" size="sm" onClick={handleOpenAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  İlk Kurumu Ekle
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#ID</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Kurum Adı</TableHead>
                  <TableHead>Kurum Kodu</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{tenant.id}
                    </TableCell>
                    <TableCell>
                      <TenantLogoItem logoUrl={tenant.logoUrl} name={tenant.name} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="font-semibold text-foreground">{tenant.name}</div>
                    </TableCell>
                    <TableCell>
                      {tenant.code ? (
                        <Badge variant="outline" className="gap-1 font-mono">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          {tenant.code}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Belirtilmedi</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tenant.isActive !== false ? (
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(tenant)}
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTenantToDelete(tenant)}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTenant ? "Kurum Bilgilerini Düzenle" : "Yeni Kurum Ekle"}
            </DialogTitle>
            <DialogDescription>
              {selectedTenant
                ? "Kurum bilgilerini güncelleyip kaydedin."
                : "Sisteme yeni bir okul / kurum kaydı ekleyin."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tenant-name">
                Kurum Adı <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="tenant-name"
                placeholder="Örn: Atatürk Anadolu Lisesi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-code">Kurum Kodu (İsteğe Bağlı)</Label>
              <Input
                id="tenant-code"
                placeholder="Örn: AAL-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="tenant-logo">Kurum Logosu</Label>
              {previewUrl && (
                <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl border border-dashed border-border/70 gap-2">
                  <div className="h-28 w-28 flex items-center justify-center rounded-lg border bg-card p-2 shadow-sm shrink-0 overflow-hidden">
                    <img
                      src={getMinioUrl(previewUrl)}
                      alt="Logo Önizleme"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {logoFile ? `Seçilen: ${logoFile.name}` : "Mevcut Logo"}
                  </span>
                </div>
              )}
              <label
                htmlFor="tenant-logo"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm cursor-pointer transition-all shadow-xs active:scale-[0.99] w-full"
              >
                <Upload className="w-4 h-4" />
                <span>{logoFile ? "Farklı Görsel Seç" : "Görsel Dosyası Seç (PNG, JPG)"}</span>
                <input
                  id="tenant-logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Kurum Durumu (Aktif / Pasif) */}
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-2xs mt-3">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Kurum Durumu</Label>
                <p className="text-xs text-muted-foreground">
                  Kurumun sistemde aktif veya pasif olduğunu belirtir.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <DialogFooter className="mt-6">
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
                  createTenantMutation.isPending || updateTenantMutation.isPending
                }
              >
                {createTenantMutation.isPending || updateTenantMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Kaydediliyor...
                  </div>
                ) : selectedTenant ? (
                  "Güncelle"
                ) : (
                  "Kaydet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!tenantToDelete}
        onOpenChange={(open) => !open && setTenantToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kurumu Silmek İstiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{tenantToDelete?.name}"</strong> adlı kurumu silmek üzeresiniz. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteTenantMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
