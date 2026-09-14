"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, checkIsSuperAdmin } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  GitFork,
  GraduationCap,
  UserCheck,
  Users,
  HeartHandshake,
  Contact,
  UserCog,
  ShieldCheck,
  ChevronLeft,
  Menu,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles?: string[];
  exact?: boolean;
  canAdd?: boolean;
  addHref?: string;
  addTitle?: string;
  hideForSuperAdmin?: boolean;
  superAdminOnly?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = checkIsSuperAdmin(session?.user);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Kurumlar / Okullar",
      href: "/admin/tenants",
      icon: Building2,
      canAdd: true,
      addHref: "/admin/tenants?action=new",
      addTitle: "Yeni Kurum Ekle",
    },
    {
      title: "Şubeler",
      href: "/admin/branches",
      icon: GitFork,
      canAdd: true,
      addHref: "/admin/branches?action=new",
      addTitle: "Yeni Şube Ekle",
    },
    {
      title: "Öğrenciler",
      href: "/admin/students",
      icon: GraduationCap,
      hideForSuperAdmin: true,
      canAdd: true,
      addHref: "/admin/students?action=new",
      addTitle: "Yeni Öğrenci Kaydet",
    },
    {
      title: "Öğretmenler",
      href: "/admin/teachers",
      icon: UserCheck,
      hideForSuperAdmin: true,
      canAdd: true,
      addHref: "/admin/teachers?action=new",
      addTitle: "Yeni Öğretmen Ekle",
    },
    {
      title: "Veliler",
      href: "/admin/parents",
      icon: Users,
      hideForSuperAdmin: true,
      canAdd: true,
      addHref: "/admin/parents?action=new",
      addTitle: "Yeni Veli Kaydet",
    },
    {
      title: "Öğrenci - Veli Eşleştirme",
      href: "/admin/student-parents",
      icon: HeartHandshake,
      hideForSuperAdmin: true,
    },
    {
      title: "Kişi Kayıtları",
      href: "/admin/people",
      icon: Contact,
      hideForSuperAdmin: true,
    },
    {
      title: "Kullanıcılar",
      href: "/admin/users",
      icon: UserCog,
      canAdd: true,
      addHref: "/admin/users?action=new",
      addTitle: "Yeni Kullanıcı Ekle",
    },
    {
      title: "Roller & İzinler",
      href: "/admin/roles",
      icon: ShieldCheck,
      canAdd: true,
      addHref: "/admin/roles?action=new",
      addTitle: "Yeni Rol Ekle",
    },
  ];

  const visibleItems = navItems.filter((item) => {
    if (isSuperAdmin) {
      return !item.hideForSuperAdmin;
    }
    return !item.superAdminOnly;
  });

  return (
    <div 
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out h-screen sticky top-0 hidden md:flex select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-border", isCollapsed ? "justify-center px-0" : "justify-between px-6")}>
        {!isCollapsed && (
          <Link href="/admin" className="shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <Logo className="w-32 text-primary" />
          </Link>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(isCollapsed ? "mx-auto" : "ml-auto")}
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                className={cn(
                  "flex items-center justify-center rounded-lg p-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </Link>
            );
          }

          return (
            <div
              key={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Link
                href={item.href}
                className="flex items-center flex-1 min-w-0 py-0.5"
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 mr-3 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>

              {item.canAdd && (
                <Link
                  href={item.addHref!}
                  title={item.addTitle || "Yeni Ekle"}
                  className={cn(
                    "shrink-0 h-6 w-6 rounded-md flex items-center justify-center transition-all ml-1.5",
                    isActive
                      ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/30 hover:scale-105 active:scale-95"
                      : "bg-muted/70 text-muted-foreground/75 hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 shadow-2xs"
                  )}
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}