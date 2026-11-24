import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import { Award, Printer, ShieldCheck } from 'lucide-react';
import { getImageUrl } from '../../lib/imageUrl';

export default function CertificateView() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/public/certificates/${id}`)
      .then(res => setCert(res.data.data))
      .catch(err => setError(err.response?.data?.error || 'Certificate not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Verification Failed</h2>
        <p className="text-slate-500">{error}</p>
      </div>
    </div>
  );

  const formattedDate = new Date(cert.updatedAt || cert.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center py-10 px-4 print:p-0 print:bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
      `}</style>
      
      <div className="mb-6 flex items-center justify-between w-full max-w-5xl print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" /> Official Certificate
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">ID: {cert.id}</p>
        </div>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Printer size={18} /> Print / Save as PDF
        </button>
      </div>

      <div className="w-[1056px] h-[816px] bg-white relative shadow-2xl overflow-hidden flex flex-col print:shadow-none print:w-[11in] print:h-[8.5in] print:m-0" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 0%, #f8fafc 100%)' }}>
        {/* Certificate Border */}
        <div className="absolute inset-4 border-[12px] border-double border-slate-200"></div>
        <div className="absolute inset-6 border-[3px] border-amber-500/80"></div>
        
        {/* Background Watermark */}
        {cert.institute?.logo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <img src={getImageUrl(cert.institute.logo)} alt="" className="w-1/2 h-1/2 object-contain grayscale" />
          </div>
        )}

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-20 text-center">
          
          <div className="flex justify-between items-start w-full absolute top-16 px-16">
            <div className="flex flex-col items-center">
               {cert.institute?.logo ? (
                 <img src={getImageUrl(cert.institute.logo)} alt="Logo" className="h-24 w-auto object-contain mb-2" />
               ) : (
                 <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center mb-2">
                   <Award size={40} className="text-slate-400" />
                 </div>
               )}
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID: {cert.id.split('-')[0]}</p>
            </div>
            
            <div className="w-24 h-24 border-2 border-slate-200 p-1 flex items-center justify-center bg-white relative">
               {/* Dummy QR placeholder since real QR needs a library */}
               <div className="w-full h-full bg-slate-900" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #fff 25%, #fff 75%, #000 75%, #000)', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }}></div>
               <div className="absolute text-[8px] font-black uppercase bg-white px-1 -bottom-4 tracking-widest">Scan to Verify</div>
            </div>
          </div>

          <div className="mt-10">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase mb-4" style={{ fontFamily: 'Times New Roman, serif' }}>
              {cert.institute?.name || 'Institute Name'}
            </h1>
            <h2 className="text-xl font-bold text-amber-600 uppercase tracking-[0.3em] mb-12">
              Certificate of Achievement
            </h2>
          </div>

          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">
            This is proudly presented to
          </p>

          <h3 className="text-6xl text-slate-800 mb-8 pb-4 border-b border-slate-300 w-3/4 mx-auto" style={{ fontFamily: "'Great Vibes', cursive, Times New Roman, serif", fontStyle: 'italic' }}>
            {cert.fullName}
          </h3>

          <p className="max-w-2xl text-base text-slate-600 leading-relaxed font-medium mb-6">
            In recognition of their exceptional dedication, outstanding performance, and successful completion of the comprehensive curriculum for
          </p>

          <h4 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-6 px-10 py-2 border-y border-slate-200 inline-block">
            {cert.course?.title}
          </h4>

          <p className="text-sm text-slate-500 font-medium">
            prescribed by the academic board.
          </p>

          <div className="flex justify-between items-end w-full absolute bottom-16 px-24">
            <div className="text-center w-48">
              <p className="text-2xl text-slate-800 border-b border-slate-400 pb-2 mb-2" style={{ fontFamily: "'Great Vibes', cursive, Times New Roman, serif", fontStyle: 'italic' }}>
                {formattedDate}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date of Issuance</p>
            </div>

            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-4 border-double border-white shadow-xl flex items-center justify-center relative z-10 mx-auto">
                <div className="w-[110px] h-[110px] rounded-full border border-amber-300/50 flex items-center justify-center p-4 text-center">
                  <span className="text-[11px] font-black text-white uppercase tracking-widest leading-snug">Official<br/>Certified<br/>Seal</span>
                </div>
              </div>
            </div>

            <div className="text-center w-48">
              <div className="h-10 border-b border-slate-400 mb-2 w-full">
                {/* Signature placeholder */}
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f6/Signature_of_John_Hancock.svg" alt="Signature" className="h-full object-contain opacity-50 mx-auto" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Program Director</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
