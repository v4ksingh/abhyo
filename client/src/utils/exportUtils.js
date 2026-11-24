import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export JSON data to Excel
 * @param {Array} data - Array of objects
 * @param {string} filename - Filename prefix
 */
export const exportToExcel = (data, filename = 'report') => {
  if (!data || data.length === 0) return;
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Export data to PDF using a table format
 * @param {Array} headers - Array of strings for header row
 * @param {Array} data - Array of arrays for body rows
 * @param {string} filename - Filename prefix
 * @param {string} title - Title text in the PDF
 */
export const exportToPDF = (headers, data, filename = 'report', title = 'Report') => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF('landscape');
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, 14, 15);
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: { 
      fillColor: [79, 70, 229], // indigo-600
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
