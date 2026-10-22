"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { provincesData, ProvinceData } from "@/src/data/provinces";
import { ThailandMap } from "@/src/components/ThailandMap";
import { ProvinceDetailModal, MockMemory } from "@/src/components/ProvinceDetailModal";
import { AuthModal } from "@/src/components/AuthModal";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Compass,
  Search,
  Sparkles,
  UserCheck,
  LogOut,
  LogIn,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";

const REGIONS = [
  "ทั้งหมด",
  "ภาคเหนือ",
  "ภาคกลาง",
  "ภาคตะวันออกเฉียงเหนือ",
  "ภาคตะวันออก",
  "ภาคตะวันตก",
  "ภาคใต้",
];

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");
  const [memories, setMemories] = useState<MockMemory[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchUserData = useCallback(async (userId: string) => {
    const { data: visitedData } = await supabase
      .from("user_visited_provinces")
      .select("province_id")
      .eq("user_id", userId)
      .eq("is_visited", true);

    if (visitedData) {
      setVisitedIds(new Set(visitedData.map((v) => v.province_id)));
    }

    const { data: memData } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (memData) {
      setMemories(
        memData.map((m) => ({
          id: m.id,
          provinceId: m.province_id,
          title: m.title,
          content: m.content || "",
          rating: m.rating || 5,
          visitedDate: m.visited_date || "",
          images: m.images || [],
        }))
      );
    }
  }, [supabase]);

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await fetchUserData(currentUser.id);
      setLoadingUser(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await fetchUserData(currentUser.id);
      else {
        setVisitedIds(new Set());
        setMemories([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchUserData]);

  const toggleVisited = async (provinceId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const isCurrentlyVisited = visitedIds.has(provinceId);
    setVisitedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyVisited) next.delete(provinceId);
      else next.add(provinceId);
      return next;
    });

    try {
      if (isCurrentlyVisited) {
        await supabase
          .from("user_visited_provinces")
          .delete()
          .match({ user_id: user.id, province_id: provinceId });
      } else {
        await supabase.from("user_visited_provinces").upsert({
          user_id: user.id,
          province_id: provinceId,
          is_visited: true,
          first_visited_date: new Date().toISOString().split("T")[0],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMemory = async (memory: Omit<MockMemory, "id">) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("memories")
        .insert({
          user_id: user.id,
          province_id: memory.provinceId,
          title: memory.title,
          content: memory.content,
          rating: memory.rating,
          visited_date: memory.visitedDate || new Date().toISOString().split("T")[0],
          images: memory.images,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMemories((prev) => [
          {
            id: data.id,
            provinceId: data.province_id,
            title: data.title,
            content: data.content || "",
            rating: data.rating || 5,
            visitedDate: data.visited_date || "",
            images: data.images || [],
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const visitedCount = visitedIds.size;
  const totalCount = provincesData.length;
  const percentage = Math.round((visitedCount / totalCount) * 100);

  const filteredProvinces = useMemo(() => {
    return provincesData.filter((p) => {
      const matchRegion =
        selectedRegion === "ทั้งหมด" || p.region === selectedRegion;
      const matchSearch =
        p.nameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchSearch;
    });
  }, [selectedRegion, searchQuery]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#06080d] text-slate-100 select-none">
      {/* Dynamic Background Glows */}
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[150px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-10 w-[600px] h-[500px] bg-sky-500/5 blur-[160px] pointer-events-none z-0" />

      {/* 100% Fullscreen Interactive Canvas */}
      <ThailandMap
        provinces={provincesData}
        visitedProvinceIds={visitedIds}
        selectedProvinceId={selectedProvince?.id || null}
        onSelectProvince={(prov) => setSelectedProvince(prov)}
        onToggleVisited={toggleVisited}
      />

      {/* Floating Top Nav (No box, clean floating overlay) */}
      <nav className="fixed top-6 left-6 right-6 z-40 flex items-center justify-between pointer-events-none">
        {/* Brand */}
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-wider text-white">
              TRAVELED
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
              77 TH
            </span>
          </div>
        </div>

        {/* User / Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {/* Toggle Directory Drawer */}
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800/80 backdrop-blur-2xl border border-white/10 text-xs font-medium text-slate-300 transition-all shadow-2xl active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>ค้นหาจังหวัด ({visitedCount}/77)</span>
          </button>

          {loadingUser ? (
            <div className="w-24 h-10 rounded-full bg-slate-900/80 border border-white/10 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[120px]">
                  {user.email?.split("@")[0]}
                </span>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-all"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </nav>

      {/* Floating HUD: Stats Overlay (Top-Left corner beneath navbar) */}
      <div className="fixed top-24 left-8 z-30 pointer-events-none hidden md:block">
        <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          JOURNEY SCORE
        </p>
        <div className="flex items-baseline gap-2.5 mt-0.5">
          <span className="text-5xl font-black text-white tracking-tight drop-shadow-md">
            {visitedCount}
          </span>
          <span className="text-sm text-slate-500 font-mono">/ 77 PROVINCES</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            {percentage}%
          </span>
          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {memories.length} MEMORIES
          </span>
        </div>
      </div>

      {/* Slide-over Flyout Panel for Province Directory */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#090d16]/95 backdrop-blur-3xl border-l border-white/10 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">สำรวจ 77 จังหวัด</h2>
            <p className="text-xs text-slate-400">
              เช็คอินแล้ว {visitedCount} จาก 77 จังหวัด
            </p>
          </div>
          <button
            onClick={() => setIsPanelOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 space-y-4 border-b border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหาชื่อจังหวัด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`text-[10px] px-3 py-1.5 rounded-full font-mono whitespace-nowrap transition-all ${
                  selectedRegion === region
                    ? "bg-emerald-400 text-slate-950 font-bold"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {filteredProvinces.map((prov) => {
            const isVisited = visitedIds.has(prov.id);
            const provMemories = memories.filter((m) => m.provinceId === prov.id);

            return (
              <div
                key={prov.id}
                onClick={() => {
                  setSelectedProvince(prov);
                  setIsPanelOpen(false);
                }}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisited(prov.id);
                    }}
                    className="shrink-0 transition-transform active:scale-75"
                  >
                    {isVisited ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/20 group-hover:border-white/50" />
                    )}
                  </button>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {prov.nameTh}
                      <span className="text-[10px] text-slate-500 ml-1.5 font-normal">
                        {prov.nameEn}
                      </span>
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {prov.region}
                      {provMemories.length > 0 && (
                        <span className="text-emerald-400 font-medium ml-2">
                          • {provMemories.length} เรื่องเล่า
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            );
          })}
        </div>
      </aside>

      {/* Backdrop */}
      {isPanelOpen && (
        <div
          onClick={() => setIsPanelOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Modals */}
      <ProvinceDetailModal
        province={selectedProvince}
        isVisited={selectedProvince ? visitedIds.has(selectedProvince.id) : false}
        memories={
          selectedProvince
            ? memories.filter((m) => m.provinceId === selectedProvince.id)
            : []
        }
        onClose={() => setSelectedProvince(null)}
        onToggleVisited={toggleVisited}
        onAddMemory={handleAddMemory}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
