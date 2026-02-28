"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/resources/files/upload";

export default function ImageUpload() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Server Action ကို လှမ်းခေါ်မယ်
      const url = await uploadImage(formData);
      setImageUrl(url); // ပြန်ရလာတဲ့ URL ကို state ထဲထည့်မယ်
      console.log("Uploaded URL:", url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("ပုံတင်မရပါ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 border p-4 rounded-xl max-w-sm">
      <label className="block text-sm font-medium text-gray-700">Cover Image</label>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
      />

      {loading && <p className="text-sm text-gray-500">Uploading...</p>}

      {/* ပုံတင်ပြီးရင် Preview ပြမယ် */}
      {imageUrl && (
        <div className="relative aspect-[2/3] w-32 bg-gray-100 rounded-lg overflow-hidden border">
          <img src={imageUrl} alt="Cover Preview" className="object-cover w-full h-full" />
        </div>
      )}

      {/* Form Submit လုပ်တဲ့အခါ Database ထဲထည့်ဖို့ URL ကို Hidden Input အနေနဲ့ ထည့်ထားမယ် */}
      <input type="hidden" name="coverUrl" value={imageUrl || ""} />
    </div>
  );
}