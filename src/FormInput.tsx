import React, { useRef, useState } from 'react';

const FormInput = () => {
  const [formData, setFormData] = useState({
    nama: '',
    nrp: '',
    materi: '',
    instruktur: '',
    tanggal: '',
    persetujuan: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
  
    const link = document.createElement('a');
    link.href = image;
    link.download = `TandaTangan_${formData.nama || 'tanpa_nama'}.png`;
    link.click();
  };  

  // Fungsi posisi sentuhan (untuk touchscreen)
  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - (rect?.left || 0),
      y: touch.clientY - (rect?.top || 0),
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    let x = 0, y = 0;
    if ('touches' in e) {
      const pos = getTouchPos(e);
      x = pos.x;
      y = pos.y;
    } else {
      x = (e as React.MouseEvent).nativeEvent.offsetX;
      y = (e as React.MouseEvent).nativeEvent.offsetY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    let x = 0, y = 0;
    if ('touches' in e) {
      const pos = getTouchPos(e);
      x = pos.x;
      y = pos.y;
    } else {
      x = (e as React.MouseEvent).nativeEvent.offsetX;
      y = (e as React.MouseEvent).nativeEvent.offsetY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    setIsDrawing(false);
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validasi form
  if (!formData.persetujuan) {
    alert('Anda harus menyetujui pernyataan');
    return;
  }

  // Validasi field wajib lainnya
  if (!formData.nama || !formData.nrp || !formData.materi || !formData.instruktur || !formData.tanggal) {
    alert('Harap lengkapi semua field wajib');
    return;
  }

  try {
    // Konversi tanda tangan ke base64
    let signatureData = "";
    if (uploadedFile) {
      signatureData = await toBase64(uploadedFile);
    } else if (canvasRef.current) {
      signatureData = canvasRef.current.toDataURL();
    } else {
      alert('Harap berikan tanda tangan');
      return;
    }

    const payload = {
      ...formData,
      signature: signatureData,
      timestamp: new Date().toISOString() // Tambahkan timestamp
    };

    // URL Google Apps Script
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwQpKounVvNAmErqrJgEwa5ETXP8W_-ZCLWklgpHVjn6Iv9dT3B2MHrdNyw7QeKlVyjkw/exec';

    // Pastikan URL menggunakan HTTPS
    const secureScriptUrl = scriptUrl.replace('http://', 'https://');

    // Menggunakan proxy di development
    const apiUrl = import.meta.env.DEV 
      ? `/api/${secureScriptUrl.split('/macros/')[1]}`
      : secureScriptUrl;

    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors', // Penting untuk Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Karena mode no-cors, kita tidak bisa membaca response secara langsung
    // Jadi kita anggap berhasil jika tidak ada error
    alert('Data berhasil dikirim!');
    clearForm();

  } catch (error) {
    console.error('Error:', error);
    alert(`Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const clearForm = () => {
  setFormData({
    nama: '',
    nrp: '',
    materi: '',
    instruktur: '',
    tanggal: '',
    persetujuan: false,
  });
  if (canvasRef.current) {
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }
  setUploadedFile(null);
};

// Fungsi untuk mengkonversi file ke base64
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

  return (  
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
        {/* Logo kanan atas */}
      <div className="flex justify-between items-center mb-4">
      <div></div>
      <img src="/logo-alamtri.png" alt="Logo Perusahaan" className="w-24 h-auto object-contain" />
    </div>
      <h2 className="text-2xl font-bold mb-4 text-center">SURAT PERNYATAAN</h2>

      <input className="mb-2 p-2 w-full border" type="text" name="nama" placeholder="Nama" value={formData.nama} onChange={handleChange} required />
      <input className="mb-2 p-2 w-full border" type="text" name="nrp" placeholder="NRP" value={formData.nrp} onChange={handleChange} required />

      <select name="materi" value={formData.materi} onChange={handleChange} required className="mb-2 p-2 w-full border">
        <option value="">Pilih Materi</option>
        <option value="Pilihan 1">Pengetahuan Unit</option>
        <option value="Pilihan 2">Methode Operasi Unit</option>
        <option value="Pilihan 3">Defensive Driving</option>
        <option value="Pilihan 4">Fatigue Management</option>
        <option value="Pilihan 5">Traffict Management</option>
        <option value="Pilihan 6">Emergency Response</option>
        <option value="Pilihan 7">Productivity</option>
        <option value="Pilihan 8">Prosedur Operasi</option>
        <option value="Pilihan 9">Jigsaw/Mine Pro</option>
        <option value="Pilihan 10">P2H</option>
        <option value="Pilihan 11">Persiapan Operasi</option>
        <option value="Pilihan 12">Pengoperasian Unit</option>
        <option value="Pilihan 13">Metode Parkir</option>
        <option value="Pilihan 14">Defensive  Driving 'praktek'</option>
        <option value="Pilihan 15">Emergency  Response 'praktek'</option>
      </select>

      <select name="instruktur" value={formData.instruktur} onChange={handleChange} required className="mb-2 p-2 w-full border">
        <option value="">Pilih Instruktur</option>
        <option value="Nama 1">ABDUL RAHMAN SIDIK</option>
        <option value="Nama 2">ANANTO NINGGAR SEJATI</option>
        <option value="Nama 3">DWI HARIONO</option>
        <option value="Nama 4">HADI SUTARTO</option>
        <option value="Nama 5">HERRY KISWANTO KANONENG</option>
        <option value="Nama 6">IRI SAEFUDDIN</option>
        <option value="Nama 7">DARTO</option>
        <option value="Nama 8">KHAIRULLAH MILKAN AZMI</option>
        <option value="Nama 9">KHUMAIDI NOVAL</option>
        <option value="Nama 10">ANTON SERSANDI WAHYU</option>
        <option value="Nama 11">MUHAMMAD SYAUKANI</option>
        <option value="Nama 12">MUJIANSYAH</option>
        <option value="Nama 13">IRWANUDDIN</option>
        <option value="Nama 14">WAHYUDI</option>
        <option value="Nama 15">NASRULLAH</option>
        <option value="Nama 16">RAHMAT</option>
        <option value="Nama 17">RYAN PAMUNGKAS</option>
        <option value="Nama 18">SINTAR</option>
        <option value="Nama 19">SOLIHIN ROSADI</option>
        <option value="Nama 20">SUNARWOTO</option>
        <option value="Nama 21">SYAIFUL DAFIT ADI SAPUTRA</option>
        <option value="Nama 22">TEGUH ARIFIATNA</option>
        <option value="Nama 23">WAHYU UTOMO</option>
        <option value="Nama 24">IRWAN</option>
        <option value="Nama 25">ABDUL KODIR</option>
        <option value="Nama 26">RUDI MARDIANTO</option>
        <option value="Nama 27">MOHAMMAD KHOIRUL UMAM</option>
        <option value="Nama 28">BUDIMAN</option>
        <option value="Nama 29">MUHAMMAD ABDIANNOOR</option>
        <option value="Nama 30">ASEP CAHYADI</option>
        <option value="Nama 31">ADLIN ZAID ISMAIL</option>
        <option value="Nama 32">NARYONO</option>
        <option value="Nama 33">INDRA HARAPAN</option>
        <option value="Nama 34">GATOT SETIAWAN</option>
        <option value="Nama 35">SLAMET HERIANTO</option>
        <option value="Nama 36">YULIAN MUSTOFA</option>

      </select>

      <input className="mb-2 p-2 w-full border" type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} required />

      <label className="block mb-1">Tanda Tangan:</label>
<canvas
  ref={canvasRef}
  width={300}
  height={100}
  className="border mb-2 bg-white touch-none"
  onMouseDown={startDrawing}
  onMouseMove={draw}
  onMouseUp={stopDrawing}
  onMouseLeave={stopDrawing}
  onTouchStart={startDrawing}
  onTouchMove={draw}
  onTouchEnd={stopDrawing}
/>

{/* Menampilkan nama di bawah tanda tangan */}
{formData.nama && (
  <p className="mb-2 text-sm text-gray-700 italic">Tertanda: {formData.nama}</p>
)}

<input
    type="file"
    accept="image/*"
    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
    className="mb-4"
    />

{/* Tombol aksi canvas */}
<div className="mb-4 flex gap-4">
  <button type="button" onClick={clearCanvas} className="text-sm text-blue-600 underline">
    Bersihkan Tanda Tangan
  </button>
  <button type="button" onClick={downloadSignature} className="text-sm text-green-600 underline">
    Unduh Tanda Tangan
  </button>
</div>

      <label className="block mb-4">
        <input type="checkbox" name="persetujuan" checked={formData.persetujuan} onChange={handleChange} required className="mr-2" />
        Saya menyatakan telah menerima penjelasan materi pelatihan *
      </label>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Kirim</button>
    </form>
  );
};

export default FormInput; 

function clearForm() {
  throw new Error('Function not implemented.');
}

