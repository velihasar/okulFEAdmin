"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from "@/hooks/useTeachers";
import { usePeople, useCreatePerson, useUpdatePerson, useUploadPersonPhoto } from "@/hooks/usePeople";
import { useTenants } from "@/hooks/useTenants";
import { useBranches } from "@/hooks/useBranches";
import { useTeacherBranches, useCreateTeacherBranch, useDeleteTeacherBranch } from "@/hooks/useTeacherBranches";
import { TeacherGetAllDto } from "@/types/teacher.types";
import { PersonGetAllDto } from "@/types/person.types";
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
  UserCheck,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  UserPlus,
  Users,
  Calendar,
  Phone,
  Mail,
  Building2,
  Camera,
  User,
  GitFork,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { getPersonPhotoUrl } from "../students/page";

function TeachersContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Role & Tenant Checks
  const userTenantId = (session?.user as any)?.tenantId || 0;
  const userRoles: string[] = (session?.user as any)?.roles || [];
  const isSuperAdmin = userRoles.includes("SuperAdmin") || userRoles.includes("SUPER_ADMIN") || userTenantId === 0;

  // Queries
  const { data: teachers, isLoading: isLoadingTeachers, refetch: refetchTeachers } = useTeachers();
  const { data: people, isLoading: isLoadingPeople, refetch: refetchPeople } = usePeople();
  const { data: tenants } = useTenants();
  const { data: branches } = useBranches();
  const { data: teacherBranches, refetch: refetchTeacherBranches } = useTeacherBranches();

  // Mutations
  const createTeacherMutation = useCreateTeacher();
  const updateTeacherMutation = useUpdateTeacher();
  const deleteTeacherMutation = useDeleteTeacher();
  const createPersonMutation = useCreatePerson();
  const updatePersonMutation = useUpdatePerson();
  const uploadPhotoMutation = useUploadPersonPhoto();
  const createTeacherBranchMutation = useCreateTeacherBranch();
  const deleteTeacherBranchMutation = useDeleteTeacherBranch();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantFilter, setTenantFilter] = useState<number | undefined>(undefined);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherGetAllDto | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherGetAllDto | null>(null);

  // Form Mode
  const [personSelectionMode, setPersonSelectionMode] = useState<"new_person" | "existing_person" | "edit_person">("new_person");

  // Form Tenant Selection
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(undefined);

  // Person Form Fields
  const [selectedPersonId, setSelectedPersonId] = useState<number | undefined>(undefined);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Teacher Form Fields
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);

  // Open modal if ?action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
    }
  }, [searchParams]);

  const handleOpenCreate = () => {
    setSelectedTeacher(null);
    setPersonSelectionMode("new_person");
    setSelectedPersonId(undefined);
    setSelectedTenantId(isSuperAdmin ? (tenants && tenants.length > 0 ? tenants[0].id : undefined) : userTenantId || undefined);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDateOfBirth("");
    setPhotoUrl("");
    setSelectedBranchId(undefined);
    setStartDate(new Date().toISOString().split("T")[0]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherGetAllDto) => {
    setSelectedTeacher(teacher);
    const person = people?.find((p) => p.id === teacher.personId);
    const existingTb = (teacherBranches || []).find((tb) => tb.teacherId === teacher.id);

    setPersonSelectionMode("edit_person");
    setSelectedPersonId(teacher.personId);
    const effectiveTenantId = teacher.tenantId || person?.tenantId || userTenantId;
    setSelectedTenantId(effectiveTenantId || (tenants && tenants.length > 0 ? tenants[0].id : undefined));
    setFirstName(teacher.firstName || person?.firstName || "");
    setLastName(teacher.lastName || person?.lastName || "");
    setEmail(teacher.email || person?.email || "");
    setPhone(teacher.phone || person?.phone || "");
    setPhotoUrl(teacher.photoUrl || person?.photoUrl || "");
    setDateOfBirth(teacher.dateOfBirth ? teacher.dateOfBirth.split("T")[0] : person?.dateOfBirth ? person.dateOfBirth.split("T")[0] : "");
    setStartDate(teacher.startDate ? teacher.startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setSelectedBranchId(existingTb?.branchId);
    setIsFormOpen(true);
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const res = await uploadPhotoMutation.mutateAsync(file);
      const uploadedUrl = res.photoUrl || res.url;
      setPhotoUrl(uploadedUrl);
      toast.success("Fotoğraf başarıyla yüklendi.");
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Fotoğraf yüklenirken bir hata oluştu."));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuperAdmin && !selectedTenantId) {
      toast.error("SuperAdmin olarak işlem yapmaktasınız. Lütfen bir kurum/okul seçiniz.");
      return;
    }

    try {
      if (selectedTeacher) {
        // Edit Teacher & Person
        const targetPersonId = selectedPersonId || selectedTeacher.personId;

        if (targetPersonId && (firstName.trim() || lastName.trim())) {
          await updatePersonMutation.mutateAsync({
            id: targetPersonId,
            tenantId: isSuperAdmin ? selectedTenantId : undefined,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim() || undefined,
            phone: phone.replace(/\s+/g, "").trim() || undefined,
            photoUrl: photoUrl.trim() || undefined,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
          });
        }

        await updateTeacherMutation.mutateAsync({
          id: selectedTeacher.id,
          tenantId: isSuperAdmin ? selectedTenantId : undefined,
          personId: targetPersonId,
          startDate: new Date(startDate).toISOString(),
          isActive: true,
        });

        // Update TeacherBranch
        const targetTenant = isSuperAdmin ? selectedTenantId : userTenantId;
        const currentTb = (teacherBranches || []).find((tb) => tb.teacherId === selectedTeacher.id);

        if (currentTb && currentTb.branchId !== selectedBranchId) {
          try {
            await deleteTeacherBranchMutation.mutateAsync({
              teacherId: selectedTeacher.id,
              branchId: currentTb.branchId,
            });
          } catch (e) {
            console.error("Old teacher branch delete error:", e);
          }
        }

        if (selectedBranchId && (!currentTb || currentTb.branchId !== selectedBranchId)) {
          await createTeacherBranchMutation.mutateAsync({
            tenantId: targetTenant,
            teacherId: selectedTeacher.id,
            branchId: selectedBranchId,
          });
        }

        toast.success("Öğretmen bilgileri başarıyla güncellendi.");
        setIsFormOpen(false);
        refetchTeachers();
        refetchPeople();
        refetchTeacherBranches();
      } else {
        // Create New Teacher
        let targetPersonId = selectedPersonId;

        if (personSelectionMode === "new_person") {
          if (!firstName.trim() || !lastName.trim()) {
            toast.error("Lütfen ad ve soyad alanlarını doldurunuz.");
            return;
          }

          const personRes = await createPersonMutation.mutateAsync({
            tenantId: isSuperAdmin ? selectedTenantId : undefined,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim() || undefined,
            phone: phone.replace(/\s+/g, "").trim() || undefined,
            photoUrl: photoUrl.trim() || undefined,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
          });

          if (personRes?.data?.id) {
            targetPersonId = personRes.data.id;
          } else if ((personRes as any)?.Data?.Id) {
            targetPersonId = (personRes as any).Data.Id;
          } else {
            const updatedPeople = await refetchPeople();
            const createdPerson = updatedPeople.data?.find(
              (p) => p.firstName === firstName.trim() && p.lastName === lastName.trim()
            );
            if (createdPerson) {
              targetPersonId = createdPerson.id;
            }
          }
        }

        if (!targetPersonId) {
          toast.error("Kişi kaydı oluşturulamadı veya seçilemedi.");
          return;
        }

        const teacherRes = await createTeacherMutation.mutateAsync({
          tenantId: isSuperAdmin ? selectedTenantId : undefined,
          personId: targetPersonId,
          startDate: new Date(startDate).toISOString(),
        });

        let createdTeacherId = (teacherRes as any)?.data?.id || (teacherRes as any)?.Data?.Id || (teacherRes as any)?.id;
        if (!createdTeacherId) {
          const updatedTeachers = await refetchTeachers();
          const newTech = updatedTeachers.data?.find((t) => t.personId === targetPersonId);
          if (newTech) createdTeacherId = newTech.id;
        }

        if (createdTeacherId && selectedBranchId) {
          const targetTenant = isSuperAdmin ? selectedTenantId : userTenantId;
          await createTeacherBranchMutation.mutateAsync({
            tenantId: targetTenant,
            teacherId: createdTeacherId,
            branchId: selectedBranchId,
          });
        }

        toast.success("Yeni öğretmen kaydı başarıyla oluşturuldu.");
        setIsFormOpen(false);
        refetchTeachers();
        refetchPeople();
        refetchTeacherBranches();
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "İşlem sırasında bir hata oluştu."));
    }
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;

    try {
      await deleteTeacherMutation.mutateAsync({ id: teacherToDelete.id });
      toast.success("Öğretmen kaydı başarıyla silindi.");
      setTeacherToDelete(null);
      refetchTeachers();
      refetchTeacherBranches();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Öğretmen silinirken bir hata oluştu."));
    }
  };

  // Merge Teacher, Person & Branch Data
  const teacherListWithPerson = (teachers || []).map((t) => {
    const matchedPerson = (people || []).find((p) => p.id === t.personId);
    const person = matchedPerson || (t.firstName ? {
      id: t.personId,
      tenantId: t.tenantId,
      firstName: t.firstName || "",
      lastName: t.lastName || "",
      email: t.email || "",
      phone: t.phone || "",
      photoUrl: t.photoUrl || "",
      dateOfBirth: t.dateOfBirth || "",
    } : undefined);

    const teacherBranch = (teacherBranches || []).find((tb) => tb.teacherId === t.id);
    const branch = teacherBranch ? (branches || []).find((b) => b.id === teacherBranch.branchId) : null;

    return {
      ...t,
      person,
      teacherBranch,
      branch,
    };
  });

  const filteredTeachers = teacherListWithPerson.filter((t) => {
    const search = searchTerm.toLowerCase();
    const fullName = `${t.person?.firstName || ""} ${t.person?.lastName || ""}`.toLowerCase();
    const emailStr = t.person?.email?.toLowerCase() || "";
    const phoneStr = t.person?.phone?.toLowerCase() || "";

    const matchesSearch =
      fullName.includes(search) ||
      emailStr.includes(search) ||
      phoneStr.includes(search);

    const matchesTenant =
      !tenantFilter ||
      t.tenantId === tenantFilter ||
      t.person?.tenantId === tenantFilter;

    return matchesSearch && matchesTenant;
  });

  const isSubmitting =
    createTeacherMutation.isPending ||
    updateTeacherMutation.isPending ||
    createPersonMutation.isPending ||
    updatePersonMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-primary" />
            Öğretmen Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Öğretmen bilgilerini ve şube atamalarını yönetin, yeni öğretmen kaydı oluşturun.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchTeachers();
              refetchPeople();
              refetchTeacherBranches();
            }}
            disabled={isLoadingTeachers || isLoadingPeople}
            className="h-10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingTeachers || isLoadingPeople) ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Button onClick={handleOpenCreate} className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Öğretmen Ekle
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Öğretmen Listesi</CardTitle>
              <CardDescription>
                Okulunuzda görev yapan tüm öğretmenlerin detaylı listesi ve şube atamaları.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {isSuperAdmin && (
                <select
                  value={tenantFilter || ""}
                  onChange={(e) => setTenantFilter(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Tüm Kurumlar</option>
                  {(tenants || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ad, Soyad veya İletişim ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingTeachers || isLoadingPeople ? (
            <div className="flex justify-center items-center py-16">
              <Spinner className="h-8 w-8 text-primary" />
              <span className="ml-3 text-muted-foreground font-medium">Öğretmenler yükleniyor...</span>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Öğretmen Kaydı Bulunamadı</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {searchTerm ? "Arama kriterlerinize uygun öğretmen bulunamadı." : "Henüz sisteme öğretmen kaydı eklenmemiş."}
              </p>
              <Button onClick={handleOpenCreate} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                İlk Öğretmeni Ekle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12">Foto</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    {isSuperAdmin && <TableHead>Kurum / Okul</TableHead>}
                    <TableHead>Şube</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>İşe Başlama Tarihi</TableHead>
                    <TableHead className="text-right w-24">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((t) => {
                    const avatarSrc = getPersonPhotoUrl(t.person?.photoUrl);
                    return (
                      <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="h-10 w-10 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-muted-foreground shadow-sm">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={t.person ? `${t.person.firstName} ${t.person.lastName}` : "Öğretmen"}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground/70" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {t.person ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">
                                {t.person.firstName} {t.person.lastName}
                              </span>
                              {t.person.dateOfBirth && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(t.person.dateOfBirth).toLocaleDateString("tr-TR")}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Kişi ID #{t.personId}</span>
                          )}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1 w-fit">
                              <Building2 className="h-3 w-3" />
                              {tenants?.find((tn) => tn.id === (t.tenantId || t.person?.tenantId))?.name || `Kurum #${t.tenantId || t.person?.tenantId || "-"}`}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          {t.branch ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit font-normal">
                              <GitFork className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              {t.branch.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Tanımsız</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            {t.person?.email && (
                              <span className="flex items-center gap-1 text-foreground/80">
                                <Mail className="h-3 w-3 text-primary/70" />
                                {t.person.email}
                              </span>
                            )}
                            {t.person?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {t.person.phone}
                              </span>
                            )}
                            {!t.person?.email && !t.person?.phone && <span>-</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.startDate
                            ? new Date(t.startDate).toLocaleDateString("tr-TR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(t)}
                              title="Düzenle"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setTeacherToDelete(t)}
                              title="Sil"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserCheck className="h-6 w-6 text-primary" />
              {selectedTeacher ? "Öğretmen & Kişi Bilgilerini Düzenle" : "Yeni Öğretmen Kaydı"}
            </DialogTitle>
            <DialogDescription>
              {selectedTeacher
                ? "Öğretmene ait profil fotoğrafı, kişi, şube ve işe başlama bilgilerini güncelleyin."
                : "Yeni öğretmen eklemek için profil, kişi ve şube bilgilerini doldurun."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            {/* SuperAdmin Tenant Select Dropdown */}
            {isSuperAdmin && (
              <div className="space-y-2 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <Label htmlFor="tenantSelect" className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  Kurum / Okul Seçimi * (SuperAdmin)
                </Label>
                <select
                  id="tenantSelect"
                  value={selectedTenantId || ""}
                  onChange={(e) => setSelectedTenantId(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                >
                  <option value="" disabled>-- Öğretmenin Bağlı Olacağı Kurumu Seçiniz --</option>
                  {(tenants || []).map((tn) => (
                    <option key={tn.id} value={tn.id}>
                      #{tn.id} - {tn.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!selectedTeacher && (
              <div className="bg-muted/40 p-1.5 rounded-lg flex gap-1 border border-border/50">
                <Button
                  type="button"
                  variant={personSelectionMode === "new_person" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1 text-xs h-9"
                  onClick={() => setPersonSelectionMode("new_person")}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Yeni Kişi Oluştur & Kaydet
                </Button>
                <Button
                  type="button"
                  variant={personSelectionMode === "existing_person" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1 text-xs h-9"
                  onClick={() => setPersonSelectionMode("existing_person")}
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Mevcut Kişilerden Seç
                </Button>
              </div>
            )}

            {/* Person Form & Photo Upload */}
            {(personSelectionMode === "new_person" || personSelectionMode === "edit_person") && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1.5 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Kişisel & Profil Bilgileri
                </h4>

                {/* Photo Upload */}
                <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden border border-border bg-background flex items-center justify-center shrink-0">
                    {photoUrl ? (
                      <img src={getPersonPhotoUrl(photoUrl) || photoUrl} alt="Profil Fotoğrafı" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground/60" />
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Spinner className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="photoUpload" className="text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 text-primary hover:underline">
                      <Camera className="h-3.5 w-3.5" />
                      Fotoğraf Seç & Yükle
                    </Label>
                    <Input
                      id="photoUpload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      disabled={isUploadingPhoto}
                      className="text-xs h-8 text-muted-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground">PNG, JPG veya WEBP. Max 5MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">
                      Ad <span className="text-destructive">*</span>
                    </Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Öğretmenin adını giriniz..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">
                      Soyad <span className="text-destructive">*</span>
                    </Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Öğretmenin soyadını giriniz..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="flex items-center justify-between">
                      <span>E-Posta Adresi</span>
                      <span className="text-[10px] text-muted-foreground font-normal">(Opsiyonel)</span>
                    </Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@okul.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="flex items-center justify-between">
                      <span>Telefon Numarası</span>
                      <span className="text-[10px] text-muted-foreground font-normal">(Opsiyonel)</span>
                    </Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxxx" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth">Doğum Tarihi</Label>
                  <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
              </div>
            )}

            {personSelectionMode === "existing_person" && !selectedTeacher && (
              <div className="space-y-3">
                <Label htmlFor="personSelect">
                  Mevcut Kişilerden Öğretmen Seç <span className="text-destructive">*</span>
                </Label>
                <select
                  id="personSelect"
                  value={selectedPersonId || ""}
                  onChange={(e) => setSelectedPersonId(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>-- Sistemdeki Kayıtlı Kişilerden Seçiniz --</option>
                  {(people || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.email || p.phone || `ID #${p.id}`})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Teacher Details & Branch Selection */}
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1.5 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Öğretmen Atama & Şube Bilgileri
              </h4>

              <div className="space-y-1.5">
                <Label htmlFor="startDate">
                  İşe Başlama Tarihi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              {/* Branch Selection Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="branchSelect">Şube Seçimi</Label>
                <select
                  id="branchSelect"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedBranchId || ""}
                  onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">-- Şube Seçiniz (Opsiyonel) --</option>
                  {(() => {
                    const allBranches = branches || [];
                    let available = allBranches;
                    if (isSuperAdmin && selectedTenantId) {
                      const filtered = allBranches.filter((b) => !b.tenantId || b.tenantId === selectedTenantId);
                      if (filtered.length > 0) {
                        available = filtered;
                      }
                    }
                    return available.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} {branch.tenantName ? `(${branch.tenantName})` : ""}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting || isUploadingPhoto}>
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploadingPhoto} className="bg-primary text-primary-foreground">
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Kaydediliyor...
                  </>
                ) : selectedTeacher ? (
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
      <AlertDialog open={!!teacherToDelete} onOpenChange={(open) => !open && setTeacherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Öğretmen Kaydını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {teacherToDelete && (
                <>
                  <span className="font-semibold text-foreground">
                    {(teacherToDelete as any)?.person?.firstName || (teacherToDelete as any)?.firstName} {(teacherToDelete as any)?.person?.lastName || (teacherToDelete as any)?.lastName}
                  </span>{" "}
                  isimli öğretmenin kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TeachersPage() {
  return (
    <Suspense fallback={<div className="p-6">Yükleniyor...</div>}>
      <TeachersContent />
    </Suspense>
  );
}
