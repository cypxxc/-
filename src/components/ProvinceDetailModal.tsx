"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProvinceData } from "@/src/data/provinces";
import {
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Star,
  MapPin,
  X,
  Upload,
  Loader2,
  Trash2,
} from "lucide-react";

export interface MockMemory {
  id: string;
  provinceId: string;
  title: string;
  content: string;
  rating: number;
  visitedDate: string;
  images: string[];
}

interface ProvinceDetailModalProps {
  province: ProvinceData | null;
  isVisited: boolean;
  memories: MockMemory[];
  onClose: () => void;
  onToggleVisited: (provinceId: string) => void;
  onAddMemory: (memory: Omit<MockMemory, "id">) => void;
}

export function ProvinceDetailModal({
  province,
  isVisited,
  memories,
  onClose,
  onToggleVisited,
  onAddMemory,
}: ProvinceDetailModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newDate, setNewDate] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!newDate) {
      setNewDate(new Date().toISOString().split("T")[0]);
    }
  }, [newDate]);

  if (!province) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "อัปโหลดรูปล้มเหลว");
        }

        if (data.url) {
          setUploadedImages((prev) => [...prev, data.url]);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError("อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddMemory({
      provinceId: province.id,
      title: newTitle,
      content: newContent,
      rating: newRating,
      visitedDate: newDate,
      images: uploadedImages,
    });

    if (!isVisited) {
      onToggleVisited(province.id);
    }

    setNewTitle("");
    setNewContent("");
    setUploadedImages([]);
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-sky-500 to-indigo-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sky-100 text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            {province.region}
          </div>
          <h2 className="text-2xl font-bold mt-1">
            {province.nameTh}{" "}
            <span className="text-sm font-normal text-sky-100">
              ({province.nameEn})
            </span>
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => onToggleVisited(province.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all ${
                isVisited
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-white text-slate-800 hover:bg-slate-100"
              }`}
            >
              {isVisited ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  เคยไปแล้ว (คลิกเพื่อยกเลิก)
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4" />
                  ยังไม่เคยไป (คลิกเพื่อเช็คอิน)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
              บันทึกการเดินทาง ({memories.length})
            </h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-600 dark:text-sky-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> เพิ่มเรื่องเล่า
              </button>
            )}
          </div>

          {/* Form Create Memory */}
          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                เขียนเรื่องเล่าใหม่
              </h4>
              <input
                type="text"
                placeholder="ชื่อทริป เช่น ขึ้นดอยอินทนนท์หน้าหนาว"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <textarea
                placeholder="เล่าประสบการณ์ ความประทับใจ ร้านอาหารอร่อย..."
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">วันที่ไป</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">คะแนนความชอบ</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="w-full text-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ดาว {"⭐".repeat(n)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload to Cloudinary */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                  รูปถ่ายความทรงจำ (อัปโหลดเข้า Cloudinary)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-upload-input"
                />
                <label
                  htmlFor="image-upload-input"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-500 bg-white dark:bg-slate-900 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                      กำลังอัปโหลดรูปภาพ...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-sky-500" />
                      เลือกรูปภาพจากเครื่อง
                    </>
                  )}
                </label>

                {uploadError && (
                  <p className="text-xs text-rose-500 mt-1">{uploadError}</p>
                )}

                {/* Preview uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2.5">
                    {uploadedImages.map((url, idx) => (
                      <div key={idx} className="relative group shrink-0">
                        <img
                          src={url}
                          alt="preview"
                          className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(idx)}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 text-white rounded-full opacity-90 hover:opacity-100 shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm disabled:opacity-50"
                >
                  บันทึกความทรงจำ
                </button>
              </div>
            </form>
          )}

          {/* List of Memories */}
          {memories.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto stroke-[1.5] mb-2 opacity-50" />
              <p className="text-sm font-medium">ยังไม่มีบันทึกเรื่องเล่าในจังหวัดนี้</p>
              <p className="text-xs mt-1">กดปุ่ม "เพิ่มเรื่องเล่า" เพื่อจดบันทึกและแปะรูปภาพได้เลย</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      {mem.title}
                    </h4>
                    <div className="flex items-center text-amber-500 text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500 mr-1" />
                      {mem.rating}/5
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {mem.visitedDate}
                  </div>
                  {mem.content && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
                      {mem.content}
                    </p>
                  )}
                  {mem.images && mem.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pt-1">
                      {mem.images.map((img, i) => (
                        <a
                          key={i}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0"
                        >
                          <img
                            src={img}
                            alt="Trip Photo"
                            className="h-28 w-40 object-cover rounded-xl border border-slate-100 dark:border-slate-800 hover:opacity-95 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
