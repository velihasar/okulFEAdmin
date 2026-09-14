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
  Plus,
  Trash2,
  Star,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  Sparkles,
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
  const studentPerson = people.find((p) => p.id === student.personId);
  const studentFullName = studentPerson
    ? `${studentPerson.firstName} ${studentPerson.lastName}`
    : `Öğrenci #${student.studentNumber}`;

  // Filter people list for existing selection tab (exclude already linked people)
  const linkedPersonIds = linkedStudentParents.map((sp) => {
    const parent = parents.find((p) => p.id === sp.parentId);
    return parent?.personId;
  }).filter(Boolean);

  const availablePeople = people.filter(
    (p) =>
      p.id !== student.personId && // Not the student themselves
      !linkedPersonIds.includes(p.id) && // Not already linked as parent
      (existingSearchTerm.trim() === "" ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(existingSearchTerm.toLowerCase()) ||
        (p.phone && p.phone.includes(existingSearchTerm)) ||
        (p.email && p.email.toLowerCase().includes(existingSearchTerm.toLowerCase())))
  );

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
      // 1. Check if Person is already a Parent record
      let existingParent = parents.find((p) => p.personId === selectedPersonId);

      if (!existingParent) {
        // Create Parent record
        const parentRes: any = await createParentMutation.mutateAsync({
          personId: selectedPersonId,
          tenantId: tenantId,
        });
        const parentId = parentRes?.data?.id || parentRes?.id;
        existingParent = { id: parentId, personId: selectedPersonId };
      }

      // 2. Link StudentParent
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

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Lütfen veli ad ve soyadını giriniz.");
      return;
    }

    try {
      // 1. Create Person
      const personRes: any = await createPersonMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        tenantId: tenantId,
      });

      const newPersonId = personRes?.data?.id || personRes?.id;

      if (!newPersonId) {
        throw new Error("Kişi oluşturulamadı.");
      }

      // 2. Create Parent
      const parentRes: any = await createParentMutation.mutateAsync({
        personId: newPersonId,
        tenantId: tenantId,
      });
      const newParentId = parentRes?.data?.id || parentRes?.id;

      // 3. Create StudentParent
      await createStudentParentMutation.mutateAsync({
        studentId: student.id,
        parentId: newParentId,
        relationship: newRelationship,
        isPrimary: newIsPrimary,
        tenantId: tenantId,
      });

      toast.success("Yeni veli oluşturuldu ve başarıyla bağlandı.");

      // Clear form
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-slate-900 text-white border-slate-800 shadow-2xl">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-100">
            <Users className="w-6 h-6 text-indigo-400" />
            Veli Yönetimi: <span className="text-indigo-300">{studentFullName}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Öğrenci Numarası: <strong className="text-slate-200">{student.studentNumber}</strong> — Öğrencinin anne, baba ve vasi bilgilerini buradan yönetebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6">
          {/* Section 1: Connected Parents */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Bağlı Veliler ({linkedStudentParents.length})
            </h3>

            {linkedStudentParents.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-850 border border-slate-800 text-center">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-amber-400/80 opacity-70" />
                <p className="text-slate-400 text-sm">Bu öğrenciye henüz tanımlı bir veli bulunmuyor.</p>
                <p className="text-xs text-slate-500 mt-1">Aşağıdaki seçeneklerden var olan bir veliyi bağlayabilir veya yeni veli ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {linkedStudentParents.map((sp) => {
                  const parent = parents.find((p) => p.id === sp.parentId);
                  const person = people.find((p) => p.id === parent?.personId);

                  return (
                    <div
                      key={sp.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        sp.isPrimary
                          ? "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50"
                          : "bg-slate-800/60 border-slate-700/60 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300 text-base">
                            {person?.firstName?.charAt(0) || "V"}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-100 text-base">
                              {person ? `${person.firstName} ${person.lastName}` : `Veli #${sp.parentId}`}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-medium text-xs">
                                {sp.relationship || "Veli"}
                              </Badge>
                              {sp.isPrimary && (
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-medium text-xs flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-emerald-300" />
                                  Birincil Veli
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                          onClick={() => handleUnlinkParent(sp.id)}
                          title="Veli Bağlantısını Kaldır"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Contact Info */}
                      <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-300 space-y-1">
                        {person?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{person.phone}</span>
                          </div>
                        )}
                        {person?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{person.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePrimary(sp)}
                          className={`text-xs h-7 gap-1 border-slate-700 ${
                            sp.isPrimary
                              ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-amber-500/30"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${sp.isPrimary ? "fill-amber-300" : ""}`} />
                          {sp.isPrimary ? "Birincil Veli Yapıldı" : "Birincil Veli Yap"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Add Parent Tabs */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Yeni Veli Bağla / Ekle
            </h3>

            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
              <TabsList className="grid grid-cols-2 bg-slate-950 border border-slate-800 p-1 rounded-xl">
                <TabsTrigger value="existing" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg text-xs md:text-sm font-medium">
                  <Users className="w-4 h-4 mr-2" />
                  Mevcut Velilerden Seç (Kardeş Bağlama)
                </TabsTrigger>
                <TabsTrigger value="new" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg text-xs md:text-sm font-medium">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Yeni Veli Oluştur
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: EXISTING PERSON / PARENT */}
              <TabsContent value="existing" className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-300 mb-1.5 block">Veli / Kişi Ara</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="İsim, Soyisim veya Telefon Numarası ile arayın..."
                      value={existingSearchTerm}
                      onChange={(e) => setExistingSearchTerm(e.target.value)}
                      className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                    />
                  </div>
                </div>

                {/* Available Persons List */}
                <div>
                  <Label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Seçilebilir Veliler ({availablePeople.length})
                  </Label>
                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg bg-slate-900 divide-y divide-slate-800">
                    {availablePeople.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500 text-center">
                        Aranan kriterlere uygun veya seçilebilir başka kisi/veli bulunamadı.
                      </p>
                    ) : (
                      availablePeople.map((p) => {
                        const isSelected = selectedPersonId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPersonId(p.id)}
                            className={`p-3 text-sm flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? "bg-indigo-900/40 border-l-4 border-l-indigo-500 text-indigo-200"
                                : "hover:bg-slate-800/60 text-slate-200"
                            }`}
                          >
                            <div>
                              <p className="font-semibold">{p.firstName} {p.lastName}</p>
                              <p className="text-xs text-slate-400">
                                {p.phone || "Telefon yok"} {p.email ? `• ${p.email}` : ""}
                              </p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Options for Linking Existing */}
                {selectedPersonId && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-slate-300">Yakınlık Derecesi</Label>
                        <select
                          value={existingRelationship}
                          onChange={(e) => setExistingRelationship(e.target.value)}
                          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {RELATIONSHIP_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="existingIsPrimary"
                          checked={existingIsPrimary}
                          onChange={(e) => setExistingIsPrimary(e.target.checked)}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <Label htmlFor="existingIsPrimary" className="text-xs text-slate-300 cursor-pointer">
                          Birincil Veli Olarak İşaretle
                        </Label>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleLinkExistingPerson}
                      disabled={createStudentParentMutation.isPending || createParentMutation.isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Mevcut Veliyi Öğrenciye Bağla
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: CREATE NEW PARENT */}
              <TabsContent value="new" className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <form onSubmit={handleCreateAndLinkNewParent} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-slate-300 mb-1 block">Ad *</Label>
                      <Input
                        required
                        type="text"
                        placeholder="Örn: Ahmet"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-300 mb-1 block">Soyad *</Label>
                      <Input
                        required
                        type="text"
                        placeholder="Örn: Yılmaz"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-300 mb-1 block">Telefon</Label>
                      <Input
                        type="text"
                        placeholder="Örn: 0532 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-300 mb-1 block">E-Posta</Label>
                      <Input
                        type="email"
                        placeholder="Örn: ahmet@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-300 mb-1 block">Yakınlık Derecesi</Label>
                      <select
                        value={newRelationship}
                        onChange={(e) => setNewRelationship(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {RELATIONSHIP_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="newIsPrimary"
                        checked={newIsPrimary}
                        onChange={(e) => setNewIsPrimary(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <Label htmlFor="newIsPrimary" className="text-xs text-slate-300 cursor-pointer">
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
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
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
