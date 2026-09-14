"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTenants } from "@/hooks/useTenants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { User, UserDto } from "@/hooks/useUsers";
import { User as UserIcon, School } from "lucide-react";
import { checkIsSuperAdmin } from "@/lib/utils";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: User | null;
  isPending: boolean;
  onSubmit: (data: any) => void;
}

export function UserDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit,
}: UserDialogProps) {
  const { data: session } = useSession();
  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  const { data: tenants } = useTenants();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobilePhones, setMobilePhones] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || initialData.FullName || "");
      setEmail(initialData.email || initialData.Email || "");
      setMobilePhones(initialData.mobilePhones || initialData.MobilePhones || "");
      setPassword("");
      setTenantId(initialData.tenantId ?? initialData.TenantId ?? (!isSuperAdmin && userTenantId > 0 ? userTenantId : undefined));
    } else {
      setFullName("");
      setEmail("");
      setMobilePhones("");
      setPassword("");
      setTenantId(!isSuperAdmin && userTenantId > 0 ? userTenantId : undefined);
    }
  }, [initialData, open, isSuperAdmin, userTenantId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      fullName: fullName.trim(),
      email: email.trim(),
      mobilePhones: mobilePhones.replace(/\s+/g, "").trim() || undefined,
      tenantId: tenantId ?? 0,
    };

    if (initialData) {
      payload.userId = initialData.userId ?? initialData.UserId ?? initialData.id;
    } else {
      payload.password = password;
      payload.status = true;
      payload.citizenId = 0;
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            {initialData ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}
          </DialogTitle>
          <DialogDescription>
            Kullanıcı hesap bilgilerini tanımlayın ve güncelleyin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {/* SuperAdmin Tenant Selection */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="tenant-select" className="flex items-center gap-1.5 font-medium">
                <School className="h-4 w-4 text-primary" />
                Bağlı Olduğu Kurum (Tenant)
              </Label>
              <select
                id="tenant-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={tenantId || ""}
                onChange={(e) => setTenantId(Number(e.target.value) || undefined)}
              >
                <option value="">-- Kurum Yok (Bağımsız / SuperAdmin) --</option>
                {tenants?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (ID: #{t.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fullname">Ad Soyad <span className="text-destructive">*</span></Label>
            <Input
              id="fullname"
              placeholder="Örn: Ahmet Yılmaz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="Örn: ahmet@hakanwear.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon Numarası</Label>
            <Input
              id="phone"
              placeholder="05xxxxxxxxx"
              value={mobilePhones}
              onChange={(e) => setMobilePhones(e.target.value)}
            />
          </div>

          {!initialData && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Kaydediliyor...
                </>
              ) : initialData ? (
                "Güncelle"
              ) : (
                "Kullanıcı Ekle"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
