"use client";

import { useState } from "react";
import { StudentGetAllDto } from "@/types/student.types";
import { PersonGetAllDto } from "@/types/person.types";
import { ParentGetAllDto } from "@/types/parent.types";
import { StudentParentGetAllDto } from "@/types/studentParent.types";
import { useCreateParent } from "@/hooks/useParents";
import {
  useCreateStudentParent,
  useUpdateStudentParent,
  useDeleteStudentParent,
} from "@/hooks/useStudentParents";
import { useCreatePerson } from "@/hooks/usePeople";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  Trash2,
  Star,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

interface StudentParentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentGetAllDto | null;
  people: PersonGetAllDto[] | undefined;
  parents: ParentGetAllDto[] | undefined;
  studentParents: StudentParentGetAllDto[] | undefined;
  tenantId?: number;
}

const RELATIONSHIP_OPTIONS = ["Anne", "Baba", "Vasi", "Abla", "Ağabey", "Teyze", "Hala", "Dayı", "Amca", "Diğer"];

// Helper for Turkish character case normalization
const normalizeTr = (str?: string) => (str || "").toLocaleLowerCase("tr-TR").trim();

export function StudentParentsDialog({
  isOpen,
  onClose,
  student,
  people = [],
  parents = [],
  studentParents = [],
  tenantId,
}: StudentParentsDialogProps) {
  // Mutations
  const createPersonMutation = useCreatePerson();
  const createParentMutation = useCreateParent();
  const createStudentParentMutation = useCreateStudentParent();
  const updateStudentParentMutation = useUpdateStudentParent();
  const deleteStudentParentMutation = useDeleteStudentParent();

  // Tab State
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");

  // Selection for Existing Person/Parent
  const [existingSearchTerm, setExistingSearchTerm] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<number | undefined>(undefined);
  const [existingRelationship, setExistingRelationship] = useState("Anne");
  const [existingIsPrimary, setExistingIsPrimary] = useState(false);

  // New Parent Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newRelationship, setNewRelationship] = useState("Anne");
  const [newIsPrimary, setNewIsPrimary] = useState(false);

  if (!student) return null;

  // Filter linked studentParents for current student
  const linkedStudentParents = studentParents.filter((sp) => sp.studentId === student.id);

  // Student Person details
  const studentPerson = (student as any).person || people.find((p) => p.id === student.personId);
  const studentFullName = studentPerson
    ? `${studentPerson.firstName} ${studentPerson.lastName}`
    : student.firstName && student.lastName
    ? `${student.firstName} ${student.lastName}`
    : `Öğrenci #${student.studentNumber}`;

  // Effective tenant ID for the student
  const effectiveTenantId = student.tenantId || tenantId;

  // Filter people list for existing selection tab (exclude already linked people, the student, and people from other tenants)
  const linkedPersonIds = linkedStudentParents
    .map((sp) => parents.find((p) => p.id === sp.parentId)?.personId)
    .filter(Boolean);

  const availablePeople = people.filter((p) => {
    if (p.id === student.personId) return false;
    if (linkedPersonIds.includes(p.id)) return false;

    // Institution / Tenant isolation check
    if (effectiveTenantId && effectiveTenantId > 0 && p.tenantId && p.tenantId !== effectiveTenantId) {
      return false;
    }

    const term = normalizeTr(existingSearchTerm);
    if (!term) return true;

    const fullName = normalizeTr(`${p.firstName} ${p.lastName}`);
    const phoneStr = normalizeTr(p.phone);
    const emailStr = normalizeTr(p.email);

    return fullName.includes(term) || phoneStr.includes(term) || emailStr.includes(term);
  });

  // Handlers
  const handleTogglePrimary = async (sp: StudentParentGetAllDto) => {
    try {
      await updateStudentParentMutation.mutateAsync({
        id: sp.id,
        studentId: sp.studentId,
        parentId: sp.parentId,
        relationship: sp.relationship,
        isPrimary: !sp.isPrimary,
        tenantId: sp.tenantId,
      });
      toast.success(sp.isPrimary ? "Birincil veli durumu kaldırıldı." : "Birincil veli olarak işaretlendi.");
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Güncelleme sırasında bir hata oluştu."));
    }
  };

  const handleUnlinkParent = async (spId: number) => {
    try {
      await deleteStudentParentMutation.mutateAsync({ id: spId });
      toast.success("Veli bağlantısı başarıyla kaldırıldı.");
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Veli bağlantısı kaldırılırken hata oluştu."));
    }
  };

  const handleLinkExistingPerson = async () => {
    if (!selectedPersonId) {
      toast.error("Lütfen bağlanacak veliyi seçiniz.");
      return;
    }

    try {
      let existingParent = parents.find((p) => p.personId === selectedPersonId);

      if (!existingParent) {
        const parentRes: any = await createParentMutation.mutateAsync({
          personId: selectedPersonId,
          tenantId: tenantId,
        });
        const parentId = parentRes?.data?.id || parentRes?.id;
        existingParent = { id: parentId, personId: selectedPersonId };
      }

      await createStudentParentMutation.mutateAsync({
        studentId: student.id,
        parentId: existingParent.id,
        relationship: existingRelationship,
        isPrimary: existingIsPrimary,
        tenantId: tenantId,
      });

      toast.success("Mevcut veli başarıyla bağlandı.");
      setSelectedPersonId(undefined);
      setExistingSearchTerm("");
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Veli bağlanırken bir hata oluştu."));
    }
  };

  const handleCreateAndLinkNewParent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toast.error("Lütfen veli ad, soyad ve telefon numarası alanlarını doldurunuz.");
      return;
    }

    try {
      const personRes: any = await createPersonMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.replace(/\s+/g, "").trim() || undefined,
        tenantId: tenantId,
      });

      const newPersonId = personRes?.data?.id || personRes?.id;

      if (!newPersonId) {
        throw new Error("Kişi oluşturulamadı.");
      }

      const parentRes: any = await createParentMutation.mutateAsync({
        personId: newPersonId,
        tenantId: tenantId,
      });
      const newParentId = parentRes?.data?.id || parentRes?.id;

      await createStudentParentMutation.mutateAsync({
        studentId: student.id,
        parentId: newParentId,
        relationship: newRelationship,
        isPrimary: newIsPrimary,
        tenantId: tenantId,
      });

      toast.success("Yeni veli oluşturuldu ve başarıyla bağlandı.");

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setNewRelationship("Anne");
      setNewIsPrimary(false);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Yeni veli eklenirken bir hata oluştu."));
    }
  };

  const selectedPersonObj = people.find((p) => p.id === selectedPersonId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-card text-card-foreground border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
        {/* Unified Header */}
        <DialogHeader className="p-5 border-b border-border bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Users className="w-5 h-5 text-primary" />
            Veli Yönetimi — <span className="text-primary font-extrabold">{studentFullName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Öğrenci: <strong className="text-foreground font-semibold">{studentFullName}</strong> {student.studentNumber ? `(No: ${student.studentNumber})` : ""} — Veli kayıtlarını ekleyebilir, güncelleyebilir veya mevcut velilerden bağlayabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Linked Parents */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>Bağlı Veliler ({linkedStudentParents.length})</span>
            </h3>

            {linkedStudentParents.length === 0 ? (
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                <ShieldAlert className="w-6 h-6 mx-auto mb-1.5 text-amber-500/80" />
                <p className="text-foreground font-medium text-xs">Bu öğrenciye henüz bir veli tanımlanmamış.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Aşağıdaki alandan yeni bir veli ekleyebilir veya sistemdeki velilerden seçebilirsiniz.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedStudentParents.map((sp) => {
                  const parent = parents.find((p) => p.id === sp.parentId);
                  const person = people.find((p) => p.id === parent?.personId);

                  return (
                    <div
                      key={sp.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        sp.isPrimary
                          ? "bg-primary/5 border-primary/40 shadow-sm"
                          : "bg-background border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                            {person?.firstName?.charAt(0) || "V"}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">
                              {person ? `${person.firstName} ${person.lastName}` : `Veli #${sp.parentId}`}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="secondary" className="font-medium text-[11px] px-2 py-0">
                                {sp.relationship || "Veli"}
                              </Badge>
                              {sp.isPrimary && (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                                  Birincil Veli
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleUnlinkParent(sp.id)}
                          title="Veli Bağlantısını Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Contact Info */}
                      <div className="mt-2.5 pt-2.5 border-t border-border/60 text-xs text-muted-foreground space-y-0.5">
                        {person?.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-muted-foreground/70" />
                            <span>{person.phone}</span>
                          </div>
                        )}
                        {person?.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-muted-foreground/70" />
                            <span>{person.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Primary Toggle Action */}
                      <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePrimary(sp)}
                          className={`text-[11px] h-6 px-2 gap-1 border-border ${
                            sp.isPrimary
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                              : "hover:bg-accent text-muted-foreground"
                          }`}
                        >
                          <Star className={`w-3 h-3 ${sp.isPrimary ? "fill-amber-500 text-amber-500" : ""}`} />
                          {sp.isPrimary ? "Birincil Veli" : "Birincil Veli Yap"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Compact Add / Link Parent */}
          <div className="pt-3 border-t border-border">
            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
              <TabsList className="grid grid-cols-2 bg-muted p-1 rounded-xl">
                <TabsTrigger value="existing" className="data-[state=active]:bg-background data-[state=active]:text-foreground shadow-xs text-xs font-semibold">
                  <Users className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  Mevcut Velilerden Seç (Kardeş)
                </TabsTrigger>
                <TabsTrigger value="new" className="data-[state=active]:bg-background data-[state=active]:text-foreground shadow-xs text-xs font-semibold">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  Yeni Veli Kaydet
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: COMPACT EXISTING PERSON / PARENT SELECT */}
              <TabsContent value="existing" className="mt-3 p-3.5 rounded-xl bg-muted/30 border border-border space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1 block">
                      Veli / Kişi Seçin <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={selectedPersonId || ""}
                      onChange={(e) => setSelectedPersonId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Listeden Veli / Kişi Seçiniz --</option>
                      {availablePeople.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} {p.phone ? `(${p.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1 block">
                      Yakınlık Derecesi <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={existingRelationship}
                      onChange={(e) => setExistingRelationship(e.target.value)}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter input for quick narrowing when list is large */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="İsim veya telefon yazarak filtreleyin..."
                      value={existingSearchTerm}
                      onChange={(e) => setExistingSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 px-2">
                    <input
                      type="checkbox"
                      id="existingIsPrimary"
                      checked={existingIsPrimary}
                      onChange={(e) => setExistingIsPrimary(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary rounded cursor-pointer"
                    />
                    <Label htmlFor="existingIsPrimary" className="text-xs text-foreground cursor-pointer select-none whitespace-nowrap">
                      Birincil Veli
                    </Label>
                  </div>
                </div>

                {/* Action button */}
                <Button
                  type="button"
                  onClick={handleLinkExistingPerson}
                  disabled={!selectedPersonId || createStudentParentMutation.isPending || createParentMutation.isPending}
                  className="w-full h-8 text-xs font-semibold gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {selectedPersonObj
                    ? `${selectedPersonObj.firstName} ${selectedPersonObj.lastName} Velisini Öğrenciye Bağla`
                    : "Mevcut Veliyi Öğrenciye Bağla"}
                </Button>
              </TabsContent>

              {/* TAB 2: CREATE NEW PARENT */}
              <TabsContent value="new" className="mt-3 p-3.5 rounded-xl bg-muted/30 border border-border">
                <form onSubmit={handleCreateAndLinkNewParent} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-xs font-medium text-foreground mb-1 block">
                        Ad <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        required
                        type="text"
                        placeholder="Velinin adını giriniz..."
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-foreground mb-1 block">
                        Soyad <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        required
                        type="text"
                        placeholder="Velinin soyadını giriniz..."
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-foreground mb-1 block">
                        Telefon <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        required
                        type="text"
                        placeholder="05xxxxxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-foreground mb-1 block flex items-center justify-between">
                        <span>E-Posta</span>
                        <span className="text-[10px] text-muted-foreground font-normal">(Opsiyonel)</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="ornek@okul.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-foreground mb-1 block">
                        Yakınlık Derecesi <span className="text-destructive">*</span>
                      </Label>
                      <select
                        value={newRelationship}
                        onChange={(e) => setNewRelationship(e.target.value)}
                        className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {RELATIONSHIP_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 pt-5">
                      <input
                        type="checkbox"
                        id="newIsPrimary"
                        checked={newIsPrimary}
                        onChange={(e) => setNewIsPrimary(e.target.checked)}
                        className="w-3.5 h-3.5 accent-primary rounded cursor-pointer"
                      />
                      <Label htmlFor="newIsPrimary" className="text-xs text-foreground cursor-pointer select-none">
                        Birincil Veli Olarak İşaretle
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      createPersonMutation.isPending ||
                      createParentMutation.isPending ||
                      createStudentParentMutation.isPending
                    }
                    className="w-full h-8 text-xs font-semibold gap-1.5 mt-2"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Yeni Veli Oluştur ve Öğrenciye Bağla
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
