"use client";

import { useState } from "react";
import { Plus, Edit2, X, Leaf, Thermometer } from "lucide-react";
import { createPlantTemplate, updatePlantTemplate, deletePlantTemplate } from "@/actions/plant-master";
import { PlantTemplate } from "@prisma/client";

interface PlantTemplateFormProps {
  template?: PlantTemplate;
  isEdit?: boolean;
}

export function PlantTemplateForm({ template, isEdit }: PlantTemplateFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: template?.name || "",
    targetMoisturePct: template?.targetMoisturePct || 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await updatePlantTemplate(template.id, formData);
      } else {
        await createPlantTemplate(formData);
        setFormData({ name: "", targetMoisturePct: 60 });
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this template?")) {
      setLoading(true);
      try {
        await deletePlantTemplate(template.id);
        setIsOpen(false);
      } catch (error) {
        console.error(error);
        alert("Failed to delete template");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      {isEdit ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-[#0E6633] transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#0E6633] text-white rounded-2xl text-sm font-bold hover:bg-[#0c592b] transition-all shadow-lg shadow-[#0E6633]/20"
        >
          <Plus className="w-4 h-4" /> Add New Template
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-[#0E6633]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1e1e1e]">
                    {isEdit ? "Edit Template" : "New Plant Template"}
                  </h3>
                  <p className="text-xs text-[#757575] font-medium uppercase tracking-wider">Hydration Configuration</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest px-1">Plant Species Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] focus:border-transparent transition-all"
                  placeholder="e.g. Snake Plant"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest px-1 flex items-center gap-1">
                  <Thermometer className="w-3 h-3" /> Target Moisture (%)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={formData.targetMoisturePct}
                  onChange={(e) => setFormData({ ...formData, targetMoisturePct: parseInt(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-4 flex gap-4">
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 px-6 py-4 border border-red-100 text-red-500 rounded-2xl text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] px-6 py-4 bg-[#0E6633] text-white rounded-2xl text-sm font-bold hover:bg-[#0c592b] transition-all shadow-lg shadow-[#0E6633]/20 disabled:opacity-50"
                >
                  {loading ? "Saving..." : isEdit ? "Update Template" : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
