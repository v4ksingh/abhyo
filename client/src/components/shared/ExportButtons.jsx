import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, ChevronDown } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

export default function ExportButtons({ data, filename, title, headers, pdfDataMapping }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExcel = () => {
    exportToExcel(data, filename);
    setIsOpen(false);
  };

  const handlePDF = () => {
    const tableData = data.map(pdfDataMapping);
    exportToPDF(headers, tableData, filename, title);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2 !px-4 hover:border-primary-300 shadow-sm"
      >
        <Download size={16} className="text-slate-500" /> Export Report
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          <button
            onClick={handleExcel}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            <Table size={16} className="text-emerald-500" /> Download Excel
          </button>
          <button
            onClick={handlePDF}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileText size={16} className="text-rose-500" /> Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
