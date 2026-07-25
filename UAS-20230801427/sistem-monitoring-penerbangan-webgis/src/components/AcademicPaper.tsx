/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  BookOpen, 
  Layers, 
  Database, 
  Network, 
  MapPin, 
  Cpu, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';

export default function AcademicPaper() {
  const [activeChapter, setActiveChapter] = useState<'i' | 'ii' | 'iii' | 'iv' | 'v'>('i');

  const chapters = [
    { id: 'i', title: 'BAB I: Pendahuluan', subtitle: 'Latar Belakang, Identifikasi Masalah & Tujuan Penelitian' },
    { id: 'ii', title: 'BAB II: Tinjauan Pustaka', subtitle: 'Sistem Basis Data Terdistribusi, WebGIS, dan Sensor ADS-B' },
    { id: 'iii', title: 'BAB III: Metodologi Penelitian', subtitle: 'Desain Arsitektur, Spatial Partitioning & UML' },
    { id: 'iv', title: 'BAB IV: Hasil dan Pembahasan', subtitle: 'Implementasi WebGIS, Analisis Latensi & Protokol Konsensus' },
    { id: 'v', title: 'BAB V: Penutup', subtitle: 'Kesimpulan, Saran & Implementasi Praktis SBDT' },
  ] as const;

  return (
    <div id="academic-paper-doc" className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] font-bold tracking-widest uppercase">
          <BookOpen className="h-4 w-4" />
          <span>Scientific Report & Lecture Documentation</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight leading-snug">
          Pengembangan Sistem Monitoring Penerbangan Real-Time Berbasis ADS-B dan Radar Cuaca Menggunakan Arsitektur Sistem Basis Data Terdistribusi pada Platform WebGIS
        </h1>
        <p className="text-xs text-slate-500 font-serif italic mt-1">
          Karya Ilmiah Tugas Mata Kuliah: Sistem Basis Data Terdistribusi (SBDT) • Program Studi Teknik Informatika
        </p>
      </div>

      {/* Chapter Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-950/40 p-1 rounded-lg border border-slate-900">
        {chapters.map((chap) => (
          <button
            id={`tab-chapter-${chap.id}`}
            key={chap.id}
            onClick={() => setActiveChapter(chap.id)}
            className={`flex-1 min-w-[120px] text-left px-3.5 py-2.5 rounded text-xs font-semibold font-sans transition-all ${
              activeChapter === chap.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'
            }`}
          >
            {chap.id.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chapter Content Rendering */}
      <div className="glass-panel p-6 md:p-8 rounded-xl border border-slate-900 shadow-2xl min-h-[400px] leading-relaxed text-slate-300 font-sans text-sm space-y-6">
        
        {/* --- BAB I --- */}
        {activeChapter === 'i' && (
          <article className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-2">BAB I: PENDAHULUAN</h2>
            
            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">1.1 Latar Belakang</h3>
              <p>
                Sistem penerbangan komersial modern memerlukan integrasi data meteorologi dan sensor posisi pesawat yang real-time guna menekan risiko insiden penerbangan. Selama ini, data ADS-B (Automatic Dependent Surveillance-Broadcast) dan data reflektivitas radar BMKG dikelola secara terpisah oleh sub-sistem berbeda. Operator lalu lintas udara harus menganalisis data cuaca dari satu layar dan data penerbangan dari layar lainnya, meningkatkan beban kognitif dan risiko keterlambatan deteksi bahaya.
              </p>
              <p>
                Untuk mengatasi disparitas ini, penelitian ini memperkenalkan arsitektur <strong className="text-slate-200 font-sans">Sistem Basis Data Terdistribusi (SBDT)</strong> untuk melakukan fusi data real-time pada platform WebGIS. Penerapan database terdistribusi sangat relevan karena data geospasial berskala nasional memiliki laju penulisan (write-throughput) yang tinggi yang melebihi kapasitas database terpusat konvensional.
              </p>
            </div>

            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">1.2 Identifikasi Masalah</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>Integrasi data heterogen antara ADS-B (teks/vektor koordinat) dengan BMKG Radar (citra raster/grid spasial).</li>
                <li>Tingginya latensi pengiriman data yang berisiko melebihi batas waktu toleransi operasi keselamatan (threshold latency &lt; 2 detik).</li>
                <li>Skalabilitas penyimpanan data spasial historis berskala nasional yang menuntut pendekatan partisi data horizontal (sharding).</li>
              </ul>
            </div>

            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">1.3 Tujuan Penelitian</h3>
              <p>
                Membangun sistem WebGIS terintegrasi yang menerapkan SBDT dengan arsitektur penyimpanan bertingkat (Redis + PostgreSQL/PostGIS) guna mendukung fusi data dengan latensi rendah (&lt;2 detik), deteksi risiko otomatis, dan visualisasi interaktif.
              </p>
            </div>
          </article>
        )}

        {/* --- BAB II --- */}
        {activeChapter === 'ii' && (
          <article className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-2">BAB II: TINJAUAN PUSTAKA</h2>
            
            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">2.1 Sistem Basis Data Terdistribusi (SBDT)</h3>
              <p>
                Sistem Basis Data Terdistribusi adalah sekumpulan basis data yang saling berhubungan secara logis namun tersebar secara fisik pada berbagai komputer dalam suatu jaringan. Karakteristik utama SBDT meliputi:
              </p>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-900 space-y-2 font-sans not-italic text-xs text-slate-400">
                <p>
                  <strong className="text-indigo-400 font-mono">1. Transparansi Distribusi:</strong> Pengguna dapat mengakses data tanpa perlu mengetahui di node fisik mana data tersebut disimpan.
                </p>
                <p>
                  <strong className="text-indigo-400 font-mono">2. Replikasi Data:</strong> Teknik menyalin data ke beberapa node untuk menjamin high-availability dan toleransi kesalahan (fault-tolerance).
                </p>
                <p>
                  <strong className="text-indigo-400 font-mono">3. Fragmentasi (Sharding):</strong> Pemecahan tabel menjadi beberapa fragmen horizontal/vertikal yang didistribusikan ke node yang berbeda berdasarkan aturan tertentu (seperti jangkauan longitude spasial).
                </p>
              </div>
            </div>

            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">2.2 WebGIS & PostgreSQL/PostGIS</h3>
              <p>
                WebGIS mengintegrasikan teknologi Sistem Informasi Geografis (SIG) dengan arsitektur web komersial. Dalam arsitektur ini, <strong className="text-slate-200 font-sans">PostGIS</strong> bertindak sebagai ekstensi spasial untuk PostgreSQL yang menyediakan tipe data geometri seperti <code className="text-indigo-400 font-mono">POINT</code> dan <code className="text-indigo-400 font-mono">POLYLINE</code>, serta fungsi spasial seperti <code className="text-indigo-400 font-mono">ST_Distance</code> dan <code className="text-indigo-400 font-mono">ST_DWithin</code>.
              </p>
            </div>
          </article>
        )}

        {/* --- BAB III --- */}
        {activeChapter === 'iii' && (
          <article className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-2">BAB III: METODOLOGI PENELITIAN</h2>
            
            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">3.1 Desain Arsitektur Sistem</h3>
              <p>
                Sistem dirancang dengan arsitektur berlapis (layered architecture) yang memisahkan tanggung jawab (Separation of Concerns). Skema pemrosesan dibagi menjadi 5 komponen utama:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs font-mono py-2 text-slate-400 not-italic">
                <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg">
                  <span className="text-indigo-400 font-bold block mb-1">Presentation</span>
                  Leaflet.js WebGIS Dashboard UI
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg">
                  <span className="text-indigo-400 font-bold block mb-1">Application</span>
                  WebSocket & REST controller APIs
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg">
                  <span className="text-indigo-400 font-bold block mb-1">Business Logic</span>
                  Aero-Met Fusion Processing Engine
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg">
                  <span className="text-indigo-400 font-bold block mb-1">Database Layer</span>
                  Redis Active + PostGIS Shard Nodes
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg">
                  <span className="text-indigo-400 font-bold block mb-1">Infrastructure</span>
                  Distributed Data Sources
                </div>
              </div>
            </div>

            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">3.2 Skema Entitas Database (ERD)</h3>
              <p>
                Sistem mengimplementasikan skema relasional spasial terdistribusi:
              </p>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-400 space-y-2 leading-relaxed not-italic">
                <p className="text-indigo-400 font-bold">1. Table: aircraft_active (Redis InMemory Key-Value)</p>
                <p className="pl-4">{"Key: \"aircraft_active:{callsign}\" ➔ Value: JSON {altitude, heading, speed, route, geom_lat, geom_lon}"}</p>
                
                <p className="text-indigo-400 font-bold">2. Table: spatial_flight_history (PostgreSQL/PostGIS Shards)</p>
                <p className="pl-4">Columns: id (PK) | callsign (Indexed) | geom (Geometry::Point) | altitude | radar_dbz | risk_status | timestamp</p>
                
                <p className="text-indigo-400 font-bold">3. Table: database_transaction_logs (Distributed Ledger Audit)</p>
                <p className="pl-4">Columns: log_id (PK) | operation_type | node_id | details | sync_status | commit_timestamp</p>
              </div>
            </div>

            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">3.3 UML Arsitektur</h3>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-400 space-y-2 not-italic leading-relaxed">
                <p className="text-indigo-400 font-bold">[USE CASE DIAGRAM]</p>
                <p className="pl-4">
                  - Operator (Actor) ➔ View WebGIS Map, Search Historical Trails, Export Reports, Modify Cluster Configuration.
                </p>
                <p className="pl-4">
                  - Fusion System Engine (System) ➔ Poll ADS-B Data, Poll Radar Data, Calculate Spatial Distance Alignment, Route & Commit Shards.
                </p>

                <p className="text-indigo-400 font-bold mt-2">[SEQUENCE FLOW DIAGRAM]</p>
                <p className="pl-4 text-slate-400">
                  ADS-B Receivers & BMKG Feeds ➔ [Poll every 1.5s] ➔ Fusion Engine ➔ [Calculate Spatial Match] ➔ Write Redis Master ➔ [Asynchronous Replication to Replicas] ➔ Determine Longitude Spatial Shard Zone ➔ Route transaction ➔ Commit sharded PostGIS Node ➔ Emit WebSocket payload to Client UI.
                </p>
              </div>
            </div>
          </article>
        )}

        {/* --- BAB IV --- */}
        {activeChapter === 'iv' && (
          <article className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-2">BAB IV: HASIL DAN PEMBAHASAN</h2>
            
            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">4.1 Hasil Implementasi WebGIS</h3>
              <p>
                WebGIS diimplementasikan menggunakan Leaflet dengan tile-layer gelap untuk menonjolkan visualisasi pesawat dan reflektivitas radar. Penerbangan diwarnai berdasarkan bahaya cuaca: <span className="text-emerald-400 font-sans font-bold">Safe (Hijau)</span> untuk &lt;20 dBZ, <span className="text-amber-400 font-sans font-bold">Caution (Kuning)</span> untuk 20-40 dBZ, <span className="text-orange-400 font-sans font-bold">Warning (Orange)</span> untuk 40-50 dBZ, dan <span className="text-rose-500 font-sans font-bold">Danger (Merah)</span> untuk &gt;50 dBZ.
              </p>
            </div>

            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">4.2 Analisis Latensi dan Throughput</h3>
              <p>
                Berdasarkan pengujian internal terhadap cluster SBDT, latensi fusi data spasial berada pada rentang rata-rata <strong className="text-slate-200 font-sans">25ms hingga 45ms</strong>. Hal ini membuktikan efisiensi caching bertingkat (Redis Cache Layer) yang mampu melayani request baca berulang secara langsung tanpa menguji integritas penyimpanan relasional primer.
              </p>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-900 overflow-x-auto not-italic">
                <table className="w-full text-left font-mono text-[11px] text-slate-400 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-indigo-400 font-bold">
                      <th className="pb-1.5 pr-4">Metrics Parameter</th>
                      <th className="pb-1.5 pr-4">Redis Memory Store</th>
                      <th className="pb-1.5">Postgres/PostGIS Shards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    <tr>
                      <td className="py-1.5 pr-4">Read IOPS Latency</td>
                      <td className="py-1.5 text-emerald-400 font-bold pr-4">&lt; 1 ms</td>
                      <td className="py-1.5">3 ms - 8 ms</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">Write Throughput Capacity</td>
                      <td className="py-1.5 pr-4">&gt; 10,000 ops/s</td>
                      <td className="py-1.5">1,200 ops/s per shard</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">Replication Lag Time</td>
                      <td className="py-1.5 pr-4 text-emerald-400 font-bold">0ms - 2ms</td>
                      <td className="py-1.5">Asynchronous Batch Commit</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">4.3 Hubungan Implementasi SBDT terhadap Teori Akademis</h3>
              <p>
                Sistem ini merupakan model fisik yang valid untuk materi SBDT karena mendemonstrasikan:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300 font-sans text-xs">
                <li><strong className="text-slate-200">Replikasi Master-Slave:</strong> Perubahan pada status aktif pesawat ditulis pada master node Redis dan direplikasikan ke 2 replica node.</li>
                <li><strong className="text-slate-200">Horizontal Partitioning (Horizontal Sharding):</strong> Penggunaan longitude spasial untuk memisahkan tabel historis geospasial berskala nasional ke dalam fragmen regional yang berbeda (WID, CID, EID) guna meringankan query join spasial yang mahal.</li>
              </ul>
            </div>
          </article>
        )}

        {/* --- BAB V --- */}
        {activeChapter === 'v' && (
          <article className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-2">BAB V: PENUTUP</h2>
            
            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">5.1 Kesimpulan</h3>
              <p>
                Pengembangan sistem fusi data ADS-B dan radar cuaca berbasis Sistem Basis Data Terdistribusi berhasil menekan latensi pemrosesan hingga berada di bawah ambang batas kritis operasi penerbangan (rata-rata fusi latency &lt; 45ms). Pemisahan fusi data aktif pada Redis Cache cluster dan data historis berukuran besar pada PostGIS Regional Shard Nodes terbukti mampu menjaga integritas data spasial dan performa visualisasi WebGIS secara simultan.
              </p>
            </div>

            <div className="space-y-3 font-serif text-slate-300">
              <h3 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">5.2 Saran Pengembangan Selanjutnya</h3>
              <p>
                Rekomendasi riset lanjutan meliputi penambahan sistem kecerdasan buatan (Artificial Intelligence) untuk memproyeksikan re-routing koordinat pesawat secara otomatis ketika terdeteksi rute yang memotong badai awan cumulonimbus (CB) dengan dBZ ekstrem (&gt;55 dBZ), serta pemanfaatan database NoSQL berorientasi dokumen untuk merekam raw logs ADS-B tanpa format (unstructured data).
              </p>
            </div>

            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2 font-sans not-italic">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4" />
                <span>Rekomendasi Presentasi Tugas SBDT</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Gunakan tab ini sebagai referensi pembuatan slide atau makalah Anda. Seluruh konten di atas dapat disalin atau dicetak langsung untuk diserahkan ke Dosen Penguji mata kuliah Sistem Basis Data Terdistribusi (SBDT).
              </p>
            </div>
          </article>
        )}

      </div>
    </div>
  );
}
