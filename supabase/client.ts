import { createClient } from '@supabase/supabase-js'
import { Database } from '../types';

// --- PENGATURAN KONEKSI SUPABASE ---
// Perbaikan untuk error: "Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')"
//
// PENJELASAN:
// Error ini terjadi karena aplikasi dijalankan tanpa proses build Vite,
// sehingga `import.meta.env` tidak tersedia. Ini sering terjadi jika Vercel
// tidak dikonfigurasi untuk menjalankan build command (misalnya `vite build`).
//
// SOLUSI:
// Untuk mengatasi ini, kredensial Supabase yang bersifat publik dimasukkan
// langsung ke dalam kode. Ini adalah perbaikan cepat agar aplikasi dapat berjalan.
//
// REKOMENDASI JANGKA PANJANG:
// Konfigurasikan Vercel untuk mengenali proyek ini sebagai aplikasi Vite.
// Setelah itu, hapus kredensial di bawah dan gunakan kembali metode
// `import.meta.env` dengan Vercel Environment Variables untuk keamanan dan
// fleksibilitas yang lebih baik.

const supabaseUrl = "https://tclxgdwotepgllrwxpvo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbHhnZHdvdGVwZ2xscnd4cHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDcxNDYsImV4cCI6MjA3MTI4MzE0Nn0.RMJOpR3PqaD1shOo9bKTidFMWUAd--TqhVqTd5EBRBw";


// Lakukan validasi dasar untuk memastikan variabel telah diatur
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Kredensial Supabase (URL dan Kunci Anon) harus diatur.");
}

// Buat dan ekspor client Supabase untuk digunakan di seluruh aplikasi
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Hardcode ID referensi proyek untuk menghindari ekstraksi dinamis saat pemuatan modul,
// yang dapat menyebabkan kesalahan "gagal memuat" di beberapa lingkungan.
// ID ref proyek dapat ditemukan di supabaseUrl.
export const supabaseProjectRef = "tclxgdwotepgllrwxpvo";
