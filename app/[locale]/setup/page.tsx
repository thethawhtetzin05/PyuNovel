"use client";

import { useState } from "react";
import { runMigration } from "@/app/actions";

export default function SetupPage() {
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");

  const handleRun = async () => {
    setStatus("Running...");
    setError("");
    try {
      const result = await runMigration();
      if (result.success) {
        setStatus("Success! Tables created.");
      } else {
        setStatus("Failed.");
        setError(result.error || "Unknown error");
      }
    } catch (e: any) {
      setStatus("Error");
      setError(e.message);
    }
  };

  return (
    <div className="p-10 font-sans max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PyuNovel Database Setup</h1>
      <p className="mb-4 text-gray-600">
        Click below to create the necessary tables in Cloudflare D1.
        <br/>
        (This will DROP existing tables and recreate them - use with caution!)
      </p>
      
      <button 
        onClick={handleRun}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
      >
        Run Migrations (Reset DB)
      </button>

      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <p className="font-semibold">Status: <span className={status.includes("Success") ? "text-green-600" : status.includes("Failed") ? "text-red-600" : "text-gray-700"}>{status}</span></p>
        {error && <p className="text-red-500 mt-2 text-sm bg-red-50 p-2 rounded border border-red-100 font-mono whitespace-pre-wrap">{error}</p>}
      </div>
    </div>
  );
}
