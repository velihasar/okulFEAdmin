"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/useStudents";
import { usePeople, useCreatePerson, useUpdatePerson, useUploadPersonPhoto } from "@/hooks/usePeople";
import { useTenants } from "@/hooks/useTenants";
import { useBranches } from "@/hooks/useBranches";
import { useStudentBranches, useCreateStudentBranch, useDeleteStudentBranch } from "@/hooks/useStudentBranches";
import { useParents } from "@/hooks/useParents";
import { useStudentParents } from "@/hooks/useStudentParents";
import { StudentParentsDialog } from "@/components/admin/student-parents-dialog";
import { StudentGetAllDto } from "@/types/student.types";
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
  GraduationCap,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  UserPlus,
  Users,
  Calendar,
  Phone,
  Mail,
  Sparkles,
  IdCard,
  Building2,
  Camera,
  User,
  X,
  GitFork,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

export function getPersonPhotoUrl(photoUrl?: string) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://") || photoUrl.startsWith("data:")) {
    return photoUrl;
  }
  const cleanName = photoUrl.split("/").pop();
  return `http://localhost:5000/api/People/photo/${cleanName}`;
}

function StudentsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Role & Tenant Checks
  const userTenantId = (session?.user as any)?.tenantId || 0;
  const userRoles: string[] = (session?.user as any)?.roles || [];
  const isSuperAdmin = userRoles.includes("SuperAdmin") || userRoles.includes("SUPER_ADMIN") || userTenantId === 0;

  // Queries
  const { data: students, isLoading: isLoadingStudents, isError: isErrorStudents, refetch: refetchStudents } = useStudents();
  const { data: people, isLoading: isLoadingPeople, refetch: refetchPeople } = usePeople();
  const { data: tenants } = useTenants();
  const { data: branches } = useBranches();
  const { data: studentBranches, refetch: refetchStudentBranches } = useStudentBranches();
  const { data: parents } = useParents();
  const { data: studentParents } = useStudentParents();

  // Mutations
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const createPersonMutation = useCreatePerson();
  const updatePersonMutation = useUpdatePerson();
  const uploadPhotoMutation = useUploadPersonPhoto();
  const createStudentBranchMutation = useCreateStudentBranch();
  const deleteStudentBranchMutation = useDeleteStudentBranch();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantFilter, setTenantFilter] = useState<number | undefined>(undefined);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentGetAllDto | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentGetAllDto | null>(null);
  const [selectedStudentForParents, setSelectedStudentForParents] = useState<StudentGetAllDto | null>(null);

  // Form Mode: "new_person" vs "existing_person" vs "edit_person"
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

  // Student Form Fields
  const [studentNumber, setStudentNumber] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);

  // Open modal if ?action=new is in query params
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Auto-generate student number helper
  const generateStudentNumber = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    setStudentNumber(`OGR-${year}-${randomNum}`);
  };

  const handleOpenCreate = () => {
    setSelectedStudent(null);
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
    generateStudentNumber();
    setEnrollmentDate(new Date().toISOString().split("T")[0]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: StudentGetAllDto) => {
    setSelectedStudent(student);
    const person = people?.find((p) => p.id === student.personId);
    const existingSb = (studentBranches || []).find((sb) => sb.studentId === student.id);

    setPersonSelectionMode("edit_person");
    setSelectedPersonId(student.personId);
    const effectiveTenantId = student.tenantId || person?.tenantId || userTenantId;
    setSelectedTenantId(effectiveTenantId || (tenants && tenants.length > 0 ? tenants[0].id : undefined));
    setFirstName(person?.firstName || "");
    setLastName(person?.lastName || "");
    setEmail(person?.email || "");
    setPhone(person?.phone || "");
    setPhotoUrl(person?.photoUrl || "");
    setDateOfBirth(person?.dateOfBirth ? person.dateOfBirth.split("T")[0] : "");
    setStudentNumber(student.studentNumber || "");
    setEnrollmentDate(student.enrollmentDate ? student.enrollmentDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setSelectedBranchId(existingSb?.branchId);
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
      toast.error(getApiErrorMessage(err, "Fotoğraf yüklenirken bir hata oluştu. MinIO açık olduğundan emin olun."));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentNumber.trim()) {
      toast.error("Lütfen öğrenci numarasını giriniz.");
      return;
    }

    if (isSuperAdmin && !selectedTenantId) {
      toast.error("SuperAdmin olarak işlem yapmaktasınız. Lütfen bir kurum/okul seçiniz.");
      return;
    }

    try {
      if (selectedStudent) {
        // Mode A: Editing Existing Student & Person
        const targetPersonId = selectedPersonId || selectedStudent.personId;

        // 1. Update Person Details & Photo
        if (targetPersonId && (firstName.trim() || lastName.trim())) {
          await updatePersonMutation.mutateAsync({
            id: targetPersonId,
            tenantId: isSuperAdmin ? selectedTenantId : undefined,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            photoUrl: photoUrl.trim() || undefined,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
          });
        }

        // 2. Update Student Details
        await updateStudentMutation.mutateAsync({
          id: selectedStudent.id,
          tenantId: isSuperAdmin ? selectedTenantId : undefined,
          personId: targetPersonId,
          studentNumber: studentNumber.trim(),
          enrollmentDate: new Date(enrollmentDate).toISOString(),
          isActive: true,
        });

        // 3. Update StudentBranch
        const targetTenant = isSuperAdmin ? selectedTenantId : userTenantId;
        const currentSb = (studentBranches || []).find((sb) => sb.studentId === selectedStudent.id);

        if (currentSb && currentSb.branchId !== selectedBranchId) {
          try {
            await deleteStudentBranchMutation.mutateAsync({
              studentId: selectedStudent.id,
              branchId: currentSb.branchId,
            });
          } catch (e) {
            console.error("Old student branch delete error:", e);
          }
        }

        if (selectedBranchId && (!currentSb || currentSb.branchId !== selectedBranchId)) {
          await createStudentBranchMutation.mutateAsync({
            tenantId: targetTenant,
            studentId: selectedStudent.id,
            branchId: selectedBranchId,
          });
        }

        toast.success("Öğrenci ve kişi bilgileri başarıyla güncellendi.");
        setIsFormOpen(false);
        refetchStudents();
        refetchPeople();
        refetchStudentBranches();
      } else {
        // Mode B: Creating New Student
        let targetPersonId = selectedPersonId;

        if (personSelectionMode === "new_person") {
          if (!firstName.trim() || !lastName.trim()) {
            toast.error("Lütfen ad ve soyad alanlarını doldurunuz.");
            return;
          }

          // Step 1: Create Person
          const personRes = await createPersonMutation.mutateAsync({
            tenantId: isSuperAdmin ? selectedTenantId : undefined,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
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

        // Step 2: Create Student
        const studentRes = await createStudentMutation.mutateAsync({
          tenantId: isSuperAdmin ? selectedTenantId : undefined,
          personId: targetPersonId,
          studentNumber: studentNumber.trim(),
          enrollmentDate: new Date(enrollmentDate).toISOString(),
        });

        let createdStudentId = (studentRes as any)?.data?.id || (studentRes as any)?.Data?.Id || (studentRes as any)?.id;
        if (!createdStudentId) {
          const updatedStudents = await refetchStudents();
          const newSt = updatedStudents.data?.find((s) => s.studentNumber === studentNumber.trim());
          if (newSt) createdStudentId = newSt.id;
        }

        // Step 3: Create StudentBranch if selectedBranchId is chosen
        if (createdStudentId && selectedBranchId) {
          const targetTenant = isSuperAdmin ? selectedTenantId : userTenantId;
          await createStudentBranchMutation.mutateAsync({
            tenantId: targetTenant,
            studentId: createdStudentId,
            branchId: selectedBranchId,
          });
        }

        toast.success("Yeni öğrenci kaydı başarıyla oluşturuldu.");
        setIsFormOpen(false);
        refetchStudents();
        refetchPeople();
        refetchStudentBranches();
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "İşlem sırasında bir hata oluştu."));
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;

    try {
      await deleteStudentMutation.mutateAsync({ id: studentToDelete.id });
      toast.success("Öğrenci kaydı başarıyla silindi.");
      setStudentToDelete(null);
      refetchStudents();
      refetchStudentBranches();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Öğrenci silinirken bir hata oluştu."));
    }
  };

  // Merge Student, Person & Branch Data
  const studentListWithPerson = (students || []).map((st) => {
    const matchedPerson = (people || []).find((p) => p.id === st.personId);
    const person = matchedPerson || (st.firstName ? {
      id: st.personId,
      tenantId: st.tenantId,
      firstName: st.firstName || "",
      lastName: st.lastName || "",
      email: st.email || "",
      phone: st.phone || "",
      photoUrl: st.photoUrl || "",
      dateOfBirth: st.dateOfBirth || "",
    } : undefined);
    const studentBranch = (studentBranches || []).find((sb) => sb.studentId === st.id);
    const branch = studentBranch ? (branches || []).find((b) => b.id === studentBranch.branchId) : null;
    return {
      ...st,
      person,
      studentBranch,
      branch,
    };
  });

  // Filter List
  const filteredStudents = studentListWithPerson.filter((st) => {
    const search = searchTerm.toLowerCase();
    const studentNo = st.studentNumber?.toLowerCase() || "";
    const fullName = `${st.person?.firstName || ""} ${st.person?.lastName || ""}`.toLowerCase();
    const emailStr = st.person?.email?.toLowerCase() || "";
    const phoneStr = st.person?.phone?.toLowerCase() || "";

    const matchesSearch =
      studentNo.includes(search) ||
      fullName.includes(search) ||
      emailStr.includes(search) ||
      phoneStr.includes(search);

    const matchesTenant =
      !tenantFilter ||
      st.tenantId === tenantFilter ||
      st.person?.tenantId === tenantFilter;

    return matchesSearch && matchesTenant;
  });

  const isSubmitting =
    createStudentMutation.isPending ||
    updateStudentMutation.isPending ||
    createPersonMutation.isPending ||
    updatePersonMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            Öğrenci Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Öğrenci fotoğraflarını ve bilgilerini düzenleyin, yeni öğrenci kaydı ekleyin.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStudents();
              refetchPeople();
            }}
            disabled={isLoadingStudents || isLoadingPeople}
            className="h-10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingStudents || isLoadingPeople) ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Button onClick={handleOpenCreate} className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Öğrenci Kaydet
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Öğrenci</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Sistemdeki kayıtlı tüm öğrenciler</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fotoğraflı Öğrenciler</CardTitle>
            <Camera className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentListWithPerson.filter((s) => s.person?.photoUrl).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Profil fotoğrafı yüklenmiş olanlar</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gösterilen Öğrenciler</CardTitle>
            <IdCard className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStudents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Arama filtresindeki öğrenci sayısı</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="p-4 md:p-6 border-b border-border/40">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Öğrenci Listesi</CardTitle>
              <CardDescription>
                Okulunuzda kayıtlı tüm öğrencilerin fotoğrafları, numaraları, ad soyad ve iletişim bilgileri.
              </CardDescription>
            </div>
            {/* Filter & Search Inputs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {isSuperAdmin && (
                <div className="w-full sm:w-56">
                  <select
                    value={tenantFilter || ""}
                    onChange={(e) => setTenantFilter(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                  >
                    <option value="">Tüm Kurumlar (Hepsi)</option>
                    {(tenants || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.id} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Öğrenci No, Ad, Soyad veya Telefon ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingStudents || isLoadingPeople ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Spinner className="h-8 w-8 text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Öğrenciler yükleniyor...</p>
            </div>
          ) : isErrorStudents ? (
            <div className="p-8 text-center text-destructive">
              <p className="font-semibold">Öğrenci verileri yüklenirken bir hata oluştu.</p>
              <Button variant="outline" size="sm" onClick={() => refetchStudents()} className="mt-4">
                Tekrar Dene
              </Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold text-foreground">Henüz kayıtlı öğrenci bulunamadı.</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                {searchTerm ? "Arama kriterlerinize uygun öğrenci bulunamadı." : "Yeni bir öğrenci eklemek için aşağıdaki butonu kullanabilirsiniz."}
              </p>
              {!searchTerm && (
                <Button onClick={handleOpenCreate} size="sm" className="bg-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Öğrenciyi Ekle
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12">Foto</TableHead>
                    <TableHead>Öğrenci No</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    {isSuperAdmin && <TableHead>Kurum / Okul</TableHead>}
                    <TableHead>Şube</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right w-24">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((st) => {
                    const avatarSrc = getPersonPhotoUrl(st.person?.photoUrl);
                    return (
                      <TableRow key={st.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="h-10 w-10 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-muted-foreground shadow-sm">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={st.person ? `${st.person.firstName} ${st.person.lastName}` : "Öğrenci"}
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
                        <TableCell>
                          <Badge variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20 px-2.5 py-0.5">
                            {st.studentNumber || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {st.person ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">
                                {st.person.firstName} {st.person.lastName}
                              </span>
                              {st.person.dateOfBirth && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(st.person.dateOfBirth).toLocaleDateString("tr-TR")}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Kişi ID #{st.personId}</span>
                          )}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1 w-fit">
                              <Building2 className="h-3 w-3" />
                              {tenants?.find((t) => t.id === (st.tenantId || st.person?.tenantId))?.name || `Kurum #${st.tenantId || st.person?.tenantId || "-"}`}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          {st.branch ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit font-normal">
                              <GitFork className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              {st.branch.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Tanımsız</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            {st.person?.email && (
                              <span className="flex items-center gap-1 text-foreground/80">
                                <Mail className="h-3 w-3 text-primary/70" />
                                {st.person.email}
                              </span>
                            )}
                            {st.person?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {st.person.phone}
                              </span>
                            )}
                            {!st.person?.email && !st.person?.phone && <span>-</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {st.enrollmentDate
                            ? new Date(st.enrollmentDate).toLocaleDateString("tr-TR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(() => {
                              const parentCount = (studentParents || []).filter((sp) => sp.studentId === st.id).length;
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedStudentForParents(st)}
                                  title="Veli İşlemleri"
                                  className="h-8 gap-1 text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20 font-medium"
                                >
                                  <Users className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                                  <span>Veliler</span>
                                  {parentCount > 0 && (
                                    <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 h-4 text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-200 border-none font-bold">
                                      {parentCount}
                                    </Badge>
                                  )}
                                </Button>
                              );
                            })()}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(st)}
                              title="Düzenle"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setStudentToDelete(st)}
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

      {/* Student Parents Dialog */}
      <StudentParentsDialog
        isOpen={!!selectedStudentForParents}
        onClose={() => setSelectedStudentForParents(null)}
        student={selectedStudentForParents}
        people={people}
        parents={parents}
        studentParents={studentParents}
        tenantId={isSuperAdmin ? selectedTenantId : userTenantId}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <GraduationCap className="h-6 w-6 text-primary" />
              {selectedStudent ? "Öğrenci & Kişi Bilgilerini Düzenle" : "Yeni Öğrenci Kaydı"}
            </DialogTitle>
            <DialogDescription>
              {selectedStudent
                ? "Öğrenciye ait profil fotoğrafı, ad, soyad ve okul bilgilerini güncelleyin."
                : "Öğrenci kaydı oluşturmak için fotoğraf, kişi ve okul bilgilerini doldurun."}
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
                  <option value="" disabled>-- Öğrencinin Bağlı Olacağı Kurumu Seçiniz --</option>
                  {(tenants || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} - {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!selectedStudent && (
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

            {/* Person Form & Photo Upload (Show on New Person OR Edit Mode) */}
            {(personSelectionMode === "new_person" || personSelectionMode === "edit_person") && (
              <div className="space-y-4 p-4 rounded-lg border border-border/60 bg-card/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  Kişi & Profil Fotoğrafı Bilgileri
                </h4>

                {/* Photo Upload Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-muted/20 rounded-lg border border-dashed border-border">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center text-muted-foreground shadow-sm">
                      {photoUrl ? (
                        <img
                          src={getPersonPhotoUrl(photoUrl) || ""}
                          alt="Önizleme"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground/50" />
                      )}
                    </div>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl("")}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow hover:bg-destructive/90"
                        title="Fotoğrafı Kaldır"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5 text-center sm:text-left">
                    <Label htmlFor="photoUpload" className="text-xs font-semibold cursor-pointer text-primary hover:underline flex items-center justify-center sm:justify-start gap-1">
                      <Camera className="h-3.5 w-3.5" />
                      {photoUrl ? "Profil Fotoğrafını Değiştir" : "Öğrenci Profil Fotoğrafı Yükle"}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      PNG, JPG, WEBP formatları desteklenir. (MinIO sunucusuna yüklenir)
                    </p>
                    <div className="relative mt-1">
                      <Input
                        id="photoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileChange}
                        disabled={isUploadingPhoto}
                        className="cursor-pointer text-xs"
                      />
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 text-xs font-medium">
                          <Spinner className="h-3.5 w-3.5 text-primary" />
                          Yükleniyor...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Ad *</Label>
                    <Input
                      id="firstName"
                      placeholder="Ahmet"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Soyad *</Label>
                    <Input
                      id="lastName"
                      placeholder="Yılmaz"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-posta Adresi</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ahmet@okul.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Telefon Numarası</Label>
                    <Input
                      id="phone"
                      placeholder="0555 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth">Doğum Tarihi</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Existing Person Selection Mode */}
            {personSelectionMode === "existing_person" && !selectedStudent && (
              <div className="space-y-2 p-4 rounded-lg border border-border/60 bg-card/50">
                <Label htmlFor="personSelect">Kayıtlı Kişi Seçin *</Label>
                <select
                  id="personSelect"
                  value={selectedPersonId || ""}
                  onChange={(e) => setSelectedPersonId(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>-- Seçiniz --</option>
                  {(people || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {p.firstName} {p.lastName} {p.email ? `(${p.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Student Specific Details */}
            <div className="space-y-4 p-4 rounded-lg border border-border/60 bg-card/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                Öğrenci Okul Kaydı
              </h4>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="studentNumber">Öğrenci Numarası *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateStudentNumber}
                    className="h-7 text-xs text-primary hover:text-primary/90"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Otomatik Üret
                  </Button>
                </div>
                <Input
                  id="studentNumber"
                  placeholder="OGR-2026-1001"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enrollmentDate">Okul Kayıt Tarihi *</Label>
                <Input
                  id="enrollmentDate"
                  type="date"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  required
                />
              </div>

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
                ) : selectedStudent ? (
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
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Öğrenci Kaydını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {studentToDelete && (
                <>
                  <span className="font-semibold text-foreground">
                    #{studentToDelete.studentNumber}
                  </span>{" "}
                  numaralı öğrenci kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStudentMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteStudentMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStudentMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Spinner className="h-8 w-8 text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Öğrenci modülü yükleniyor...</p>
        </div>
      }
    >
      <StudentsContent />
    </Suspense>
  );
}
