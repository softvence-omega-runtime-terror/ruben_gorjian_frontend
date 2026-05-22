"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
import logo from "@/components/assets/talexia_ai_logo.png";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  HelpCircle,
  ChevronDown,
  LogOut,
  Settings,
  BookOpen,
  Mail,
  Info,
  Menu,
  X,
} from "lucide-react";

interface OnboardingHeaderNavProps {
  currentStep: number;
  totalSteps: number;
  sectionNames?: Array<{ id: number; title: string }>;
  onLeave?: () => void;
}

const planBadgeMap: Record<string, string> = {
  CALENDAR_ONLY: "Calendar (Access-only)",
  VISUAL_CALENDAR: "Visual Calendar",
  VISUAL_ADD_ON: "Visual Only",
  FULL_MANAGEMENT: "Full Management",
};

export function OnboardingHeaderNav({
  currentStep,
  totalSteps,
  sectionNames = [],
  onLeave,
}: OnboardingHeaderNavProps) {
  const { session, refresh } = useSessionContext();
  const router = useRouter();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showSectionsSheet, setShowSectionsSheet] = useState(false);

  const planCategory = session?.subscription?.planCategory || "";
  const planBadge = planBadgeMap[planCategory] || "Onboarding";
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const isCompleted = session
    ? (planCategory === "CALENDAR_ONLY" &&
        session.calendarOnboardingCompleted) ||
      (planCategory === "VISUAL_CALENDAR" &&
        session.calendarOnboardingCompleted) ||
      (planCategory === "VISUAL_ADD_ON" && session.visualOnboardingCompleted) ||
      (planCategory === "FULL_MANAGEMENT" &&
        session.fullManagementOnboardingCompleted)
    : false;

  const handleLogoClick = (e: React.MouseEvent) => {
    if (!isCompleted) {
      e.preventDefault();
      setShowLeaveDialog(true);
    }
  };

  const handleLeave = () => {
    setShowLeaveDialog(false);
    if (onLeave) {
      onLeave();
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await refresh();
    router.push("/login");
  };

  const userInitials = session?.email
    ? session.email.slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left cluster */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image src={logo} alt="Talexia.ai" className="h-8 w-8" />
              <span className="hidden sm:inline text-lg font-semibold text-white">
                Talexia.ai
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm font-medium text-slate-300">
                Onboarding
              </span>
              <Badge
                variant="outline"
                className="border-lime-400/50 text-lime-300 bg-lime-400/10"
              >
                {planBadge}
              </Badge>
            </div>
          </div>

          {/* Center cluster - Progress (hidden on mobile) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8 items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>
                  Step {currentStep} of {totalSteps}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} max={100} />
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {/* Mobile: Sections button */}
            {sectionNames.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-slate-300 hover:text-white"
                  onClick={() => setShowSectionsSheet(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                {showSectionsSheet && (
                  <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                      className="absolute inset-0 bg-black/50"
                      onClick={() => setShowSectionsSheet(false)}
                    />
                    <div className="relative h-full w-72 max-w-[80vw] bg-slate-900 border-r border-slate-800 shadow-xl">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Sections
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowSectionsSheet(false)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          {sectionNames.map((section) => {
                            const isCompleted = section.id < currentStep;
                            const isCurrent = section.id === currentStep;
                            return (
                              <div
                                key={section.id}
                                className={`px-3 py-2 rounded-md text-sm ${
                                  isCurrent
                                    ? "bg-lime-400/10 text-lime-300 font-medium"
                                    : isCompleted
                                      ? "text-slate-300"
                                      : "text-slate-500"
                                }`}
                              >
                                {isCompleted && <span className="mr-2">✓</span>}
                                {section.id}. {section.title}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Mobile: Compact progress */}
            <div className="lg:hidden text-xs text-slate-400 font-medium">
              {currentStep}/{totalSteps}
            </div>

            {/* Help dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden md:inline">Need help?</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-slate-900 text-slate-400"
              >
                <DropdownMenuItem
                  onClick={() => window.open("/help", "_blank")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Help centre
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open("/contact", "_blank")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => window.open("/pricing", "_blank")}
                >
                  <Info className="h-4 w-4 mr-2" />
                  What&apos;s included in my plan?
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  <Avatar fallback={userInitials} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-slate-900 text-slate-400"
              >
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Account settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="lg:hidden border-t border-slate-800 px-4 py-2">
          <Progress value={progress} max={100} />
        </div>
      </header>

      {/* Leave confirmation dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave onboarding?</DialogTitle>
            <DialogDescription>
              You can come back anytime. Your progress will be saved. Leave
              onboarding?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowLeaveDialog(false)}
              className="text-slate-300 hover:text-white"
            >
              Stay
            </Button>
            <Button
              onClick={handleLeave}
              className="bg-lime-400 text-slate-900 hover:bg-lime-300"
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
