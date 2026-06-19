/**
 * Tam veritabanı sıfırlama + seed scripti
 * Çalıştır: node seed-all.mjs
 *
 * Yapılanlar:
 *  1. urunler, markalar, kategoriler, bayi_fiyatlari temizle
 *  2. Admin dışı kullanıcıları sil
 *  3. Tüm Optimum (Classic, Overdose, New) ürünlerini ekle
 *  4. Iron Pharma ve Swiss Pharma için placeholder marka oluştur
 */

import fs from 'fs';
import { neon } from '@neondatabase/serverless';

// .env.local dosyasından DATABASE_URL oku
const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrl = envFile.split('\n').find(l => l.startsWith('DATABASE_URL='))?.replace('DATABASE_URL=', '').replace(/^"(.*)"$/, '$1').trim();
if (!dbUrl) { console.error('DATABASE_URL bulunamadı!'); process.exit(1); }

const sql = neon(dbUrl);

// ─── Veri ───────────────────────────────────────────────────────────────────

const MARKALAR = [
  { id: 'MRK-OPC', ad: 'Optimum Classic' },
  { id: 'MRK-OPO', ad: 'Optimum Overdose' },
  { id: 'MRK-OPN', ad: 'Optimum New' },
  { id: 'MRK-IRN', ad: 'Iron Pharma' },
  { id: 'MRK-SWS', ad: 'Swiss Pharma' },
];

const KATEGORILER = [
  // Optimum Classic
  { id: 'KAT-OPC-MON', ad: 'Enjektabl Mono', markaId: 'MRK-OPC' },
  { id: 'KAT-OPC-MIX', ad: 'Enjektabl Mix',  markaId: 'MRK-OPC' },
  { id: 'KAT-OPC-ORL', ad: 'Oral Tablet',     markaId: 'MRK-OPC' },
  // Optimum Overdose
  { id: 'KAT-OPO-MON', ad: 'Enjektabl Mono', markaId: 'MRK-OPO' },
  { id: 'KAT-OPO-MIX', ad: 'Enjektabl Mix',  markaId: 'MRK-OPO' },
  { id: 'KAT-OPO-ORL', ad: 'Oral Tablet',     markaId: 'MRK-OPO' },
  // Optimum New
  { id: 'KAT-OPN-MON', ad: 'Enjektabl Mono', markaId: 'MRK-OPN' },
  { id: 'KAT-OPN-MIX', ad: 'Enjektabl Mix',  markaId: 'MRK-OPN' },
  { id: 'KAT-OPN-ORL', ad: 'Oral Tablet',     markaId: 'MRK-OPN' },
  // Iron Pharma
  { id: 'KAT-IRN-MON', ad: 'Enjektabl Mono', markaId: 'MRK-IRN' },
  { id: 'KAT-IRN-MIX', ad: 'Enjektabl Mix',  markaId: 'MRK-IRN' },
  { id: 'KAT-IRN-ORL', ad: 'Oral Tablet',     markaId: 'MRK-IRN' },
  // Swiss Pharma
  { id: 'KAT-SWS-MON', ad: 'Enjektabl Mono', markaId: 'MRK-SWS' },
  { id: 'KAT-SWS-MIX', ad: 'Enjektabl Mix',  markaId: 'MRK-SWS' },
  { id: 'KAT-SWS-ORL', ad: 'Oral Tablet',     markaId: 'MRK-SWS' },
];

// Kısaltmalar
const OPC_MON = { markaId:'MRK-OPC', marka:'Optimum Classic', katId:'KAT-OPC-MON', kategori:'Enjektabl Mono' };
const OPC_MIX = { markaId:'MRK-OPC', marka:'Optimum Classic', katId:'KAT-OPC-MIX', kategori:'Enjektabl Mix' };
const OPC_ORL = { markaId:'MRK-OPC', marka:'Optimum Classic', katId:'KAT-OPC-ORL', kategori:'Oral Tablet' };
const OPO_MON = { markaId:'MRK-OPO', marka:'Optimum Overdose', katId:'KAT-OPO-MON', kategori:'Enjektabl Mono' };
const OPO_MIX = { markaId:'MRK-OPO', marka:'Optimum Overdose', katId:'KAT-OPO-MIX', kategori:'Enjektabl Mix' };
const OPO_ORL = { markaId:'MRK-OPO', marka:'Optimum Overdose', katId:'KAT-OPO-ORL', kategori:'Oral Tablet' };
const OPN_MON = { markaId:'MRK-OPN', marka:'Optimum New', katId:'KAT-OPN-MON', kategori:'Enjektabl Mono' };
const OPN_MIX = { markaId:'MRK-OPN', marka:'Optimum New', katId:'KAT-OPN-MIX', kategori:'Enjektabl Mix' };
const OPN_ORL = { markaId:'MRK-OPN', marka:'Optimum New', katId:'KAT-OPN-ORL', kategori:'Oral Tablet' };

let _idCounter = 1;
function uid(prefix) { return `${prefix}-${String(_idCounter++).padStart(4,'0')}`; }
function u(ad, icerik, ambalaj, ctx) {
  return { id: uid('URN'), ad, aktifMadde: icerik, ambalaj: ambalaj || null, para: 'EUR', ...ctx };
}

const URUNLER = [

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMUM CLASSIC — ENJEKTABL MONO (10 ml Glass Vial)
  // ═══════════════════════════════════════════════════════════════════════════
  u('TEST 50',      'Trestolone Acetate 50 mg/ml',               '50 mg x 10 ml Glass Vial',  OPC_MON),
  u('MENT 50',      'Testosterone 50 mg/ml',                      '50 mg x 10 ml Glass Vial',  OPC_MON),
  u('TEST 100',     'Testosterone Propionate 100 mg/ml',          '100 mg x 10 ml Glass Vial', OPC_MON),
  u('TEST 200',     'Testosterone Cypionate 200 mg/ml',           '200 mg x 10 ml Glass Vial', OPC_MON),
  u('TEST 250',     'Testosterone Enanthate 250 mg/ml',           '250 mg x 10 ml Glass Vial', OPC_MON),
  u('TEST 400',     'Testosterone Enanthate 100mg + Cypionate 100mg + Isocaproate 100mg + Decanoate 100mg', '400 mg x 10 ml Glass Vial', OPC_MON),
  u('SUSTA 250',    'Test Propionate 30mg + Phenylpropionate 60mg + Isocaproate 60mg + Decanoate 100mg',   '250 mg x 10 ml Glass Vial', OPC_MON),
  u('TREN 75',      'Trenbolone Acetate 75 mg/ml',                '75 mg x 10 ml Glass Vial',  OPC_MON),
  u('TREN 100',     'Trenbolone Hexahydrobenzylcarbonate 100 mg/ml (Parabolan)', '100 mg x 10 ml Glass Vial', OPC_MON),
  u('TREN 150',     'Trenbolone Acetate 50mg + HBZ 50mg + Enanthate 50mg',      '150 mg x 10 ml Glass Vial', OPC_MON),
  u('TREN 200',     'Trenbolone Enanthate 200 mg/ml',             '200 mg x 10 ml Glass Vial', OPC_MON),
  u('DECA 100',     'Nandrolone Phenylpropionate 100 mg/ml (Durabolin)',         '100 mg x 10 ml Glass Vial', OPC_MON),
  u('DECA 200',     'Nandrolone Decanoate 200 mg/ml (Deca-Durabolin)',           '200 mg x 10 ml Glass Vial', OPC_MON),
  u('DECA 400',     'Nandrolone Decanoate 100mg + Cypionate 100mg + Isocaproate 100mg + Undecanoate 100mg', '400 mg x 10 ml Glass Vial', OPC_MON),
  u('EQUI 200',     'Boldenone Undecylenate 200 mg/ml (Equipoise)',              '200 mg x 10 ml Glass Vial', OPC_MON),
  u('EQUI 400',     'Boldenone Undecylenate 100mg + Cypionate 100mg + Isocaproate 100mg + Decanoate 100mg', '400 mg x 10 ml Glass Vial', OPC_MON),
  u('MASTE 100',    'Drostanolone Propionate 100 mg/ml',          '100 mg x 10 ml Glass Vial', OPC_MON),
  u('MASTE 200',    'Drostanolone Enanthate 200 mg/ml',           '200 mg x 10 ml Glass Vial', OPC_MON),
  u('1-TEST 75',    'Dihydroboldenone Cypionate 75 mg/ml (1-Testosterone)',      '75 mg x 10 ml Glass Vial',  OPC_MON),
  u('PRIMO 75',     'Methenolone Acetate 75 mg/ml',               '75 mg x 10 ml Glass Vial',  OPC_MON),
  u('PRIMO 100',    'Methenolone Enanthate 100 mg/ml',            '100 mg x 10 ml Glass Vial', OPC_MON),
  u('STANO 50',     'Stanozolol 50 mg/ml (Aqueous Suspension)',   '50 mg x 10 ml Glass Vial',  OPC_MON),
  u('STANO 100',    'Stanozolol Cypionate 100 mg/ml (Oil-based)', '100 mg x 10 ml Glass Vial', OPC_MON),
  u('PREGNYL 5000', 'Human Chorionic Gonadotropin (HCG) 5000 IU','5000 IU Ampoule + Bacteriostatic Water', OPC_MON),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMUM CLASSIC — ENJEKTABL MIX (10 ml Glass Vial)
  // ═══════════════════════════════════════════════════════════════════════════
  u('DECATEST 350',  'Nandrolone Decanoate 150mg + Testosterone Enanthate 200mg',                         '350 mg x 10 ml Glass Vial', OPC_MIX),
  u('EQUITEST 350',  'Boldenone Undecylenate 150mg + Testosterone Enanthate 200mg',                       '350 mg x 10 ml Glass Vial', OPC_MIX),
  u('ULTRA 150',     'Trenbolone Acetate 50mg + Drostanolone Propionate 50mg + Testosterone Propionate 50mg', '150 mg x 10 ml Glass Vial', OPC_MIX),
  u('ULTRA 175',     'Trenbolone Acetate 75mg + Testosterone Propionate 75mg + Stanozolol Cypionate 25mg', '175 mg x 10 ml Glass Vial', OPC_MIX),
  u('ULTRA 200',     'Trenbolone HBZ 100mg + Testosterone Phenylpropionate 100mg',                        '200 mg x 10 ml Glass Vial', OPC_MIX),
  u('ULTRA 225',     'Trenbolone Acetate 75mg + Methenolone Acetate 75mg + Testosterone Acetate 75mg',    '225 mg x 10 ml Glass Vial', OPC_MIX),
  u('ULTRA 250',     'Trenbolone Enanthate 125mg + Drostanolone Enanthate 125mg',                         '250 mg x 10 ml Glass Vial', OPC_MIX),
  u('ULTRA 275',     'Boldenone Undecylenate 100mg + Testosterone Enanthate 100mg + Stanozolol Cypionate 75mg', '275 mg x 10 ml Glass Vial', OPC_MIX),
  u('ULTRA 300',     'Trenbolone Enanthate 100mg + Boldenone Undecylenate 100mg + Testosterone Enanthate 100mg', '300 mg x 10 ml Glass Vial', OPC_MIX),
  u('ULTRA 350',     'Boldenone Undecylenate 150mg + Trenbolone Enanthate 100mg + Stanozolol Cypionate 100mg',   '350 mg x 10 ml Glass Vial', OPC_MIX),
  u('MEGA 200',      'Trenbolone Enanthate 100mg + Stanozolol Cypionate 100mg',                           '200 mg x 10 ml Glass Vial', OPC_MIX),
  u('MEGA 225',      'Drostanolone Enanthate 125mg + Stanozolol Cypionate 100mg',                         '225 mg x 10 ml Glass Vial', OPC_MIX),
  u('MEGA 250',      'Trenbolone Acetate 60mg + Testosterone Propionate 80mg + Boldenone Undecylenate 110mg',   '250 mg x 10 ml Glass Vial', OPC_MIX),
  u('MEGA 275',      'Trenbolone Enanthate 100mg + Drostanolone Enanthate 100mg + Stanozolol Cypionate 75mg',   '275 mg x 10 ml Glass Vial', OPC_MIX),
  u('MEGA 300',      'Trenbolone Enanthate 100mg + Drostanolone Enanthate 100mg + Testosterone Enanthate 100mg','300 mg x 10 ml Glass Vial', OPC_MIX),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMUM CLASSIC — ORAL TABLET
  // ═══════════════════════════════════════════════════════════════════════════
  u('CLEN-X',         'Clenbuterol HCl 20 mcg',                    '50 Tablets per box',   OPC_ORL),
  u('OXANDROL',       'Oxandrolone 10 mg',                          '100 Tablets per pouch',OPC_ORL),
  u('STANO 10',       'Stanozolol 10 mg',                           '100 Tablets per pouch',OPC_ORL),
  u('TURINA 10',      '4-Chlorodehydromethyltestosterone 10 mg (Turinabol)', '100 Tablets per box', OPC_ORL),
  u('ANADROL 50',     'Oxymetholone 50 mg',                         '50 Tablets per pouch', OPC_ORL),
  u('DIANABOL',       'Methandrostenolone 10 mg',                   '100 Tablets per pouch',OPC_ORL),
  u('ARIMIDEX',       'Anastrozole 1 mg',                           '50 Tablets per pouch', OPC_ORL),
  u('LETRO',          'Letrozole 1 mg (Femara)',                     '50 Tablets per pouch', OPC_ORL),
  u('CLENBUTEROL 20', 'Clenbuterol HCl 20 mcg',                    '100 Tablets per box',  OPC_ORL),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMUM OVERDOSE — ENJEKTABL MONO (10 ml Glass Vial)
  // ═══════════════════════════════════════════════════════════════════════════
  u('TESTABOL 100',   'Testosterone Propionate 100 mg/ml',  '100 mg x 10 ml Glass Vial', OPO_MON),
  u('TESTABOL 200',   'Testosterone Cypionate 200 mg/ml',   '200 mg x 10 ml Glass Vial', OPO_MON),
  u('TESTABOL 250',   'Testosterone Enanthate 250 mg/ml',   '250 mg x 10 ml Glass Vial', OPO_MON),
  u('TESTABOL 400',   'Testosterone Acetate 60mg + Enanthate 142mg + Decanoate 198mg', '400 mg x 10 ml Glass Vial', OPO_MON),
  u('TRENABOL 100',   'Trenbolone Acetate 100 mg/ml',       '100 mg x 10 ml Glass Vial', OPO_MON),
  u('TRENABOL 125',   'Trenbolone Hexahydrobenzylcarbonate 125 mg/ml', '125 mg x 10 ml Glass Vial', OPO_MON),
  u('TRENABOL 200',   'Trenbolone Enanthate 200 mg/ml',     '200 mg x 10 ml Glass Vial', OPO_MON),
  u('DECABOL 200',    'Nandrolone Decanoate 200 mg/ml',     '200 mg x 10 ml Glass Vial', OPO_MON),
  u('BOLDEBOL 200',   'Boldenone Undecylenate 200 mg/ml',   '200 mg x 10 ml Glass Vial', OPO_MON),
  u('MASTEBOL 100',   'Drostanolone Propionate 100 mg/ml',  '100 mg x 10 ml Glass Vial', OPO_MON),
  u('PRIMOBOL 100',   'Methenolone Enanthate 100 mg/ml',    '100 mg x 10 ml Glass Vial', OPO_MON),
  u('SUSTABOL 300',   'Testosterone Propionate 63mg + Cypionate 100mg + Isocaproate 137mg', '300 mg x 10 ml Glass Vial', OPO_MON),
  u('STANOBOL 50',    'Stanozolol 50 mg/ml',                '50 mg x 10 ml Glass Vial',  OPO_MON),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMUM OVERDOSE — ENJEKTABL MIX (10 ml Glass Vial)
  // ═══════════════════════════════════════════════════════════════════════════
  u('ULTRABOL 150',   'Trenbolone Acetate 50mg + Testosterone Propionate 50mg + Drostanolone Propionate 50mg', '150 mg x 10 ml Glass Vial', OPO_MIX),
  u('ULTRABOL 350',   'Testosterone Enanthate 125mg + Nandrolone Decanoate 125mg + Trenbolone Enanthate 100mg','350 mg x 10 ml Glass Vial', OPO_MIX),
  u('ULTRABOL 400',   'Testosterone Enanthate 150mg + Boldenone Undecylenate 125mg + Nandrolone Decanoate 125mg','400 mg x 10 ml Glass Vial', OPO_MIX),
  u('MEGABOL 300',    'Trenbolone Enanthate 100mg + Testosterone Enanthate 100mg + Nandrolone Decanoate 100mg','300 mg x 10 ml Glass Vial', OPO_MIX),
  u('MEGABOL 350',    'Testosterone Enanthate 150mg + Trenbolone Enanthate 100mg + Drostanolone Enanthate 100mg','350 mg x 10 ml Glass Vial', OPO_MIX),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMUM OVERDOSE — ORAL TABLET
  // ═══════════════════════════════════════════════════════════════════════════
  u('HALOTESTIN 10',   'Fluoxymesterone 10 mg',               '100 Tablets per box', OPO_ORL),
  u('ARIMIDEX 1 MG',  'Anastrozole 1 mg',                    '100 Tablets per box', OPO_ORL),
  u('METRIBOLONE 1 MG','Methyl Trenbolone (Metribolone) 1 mg','100 Tablets per box', OPO_ORL),
  u('SUPERDROL 10',    'Methyldrostanolone 10 mg',            '100 Tablets per box', OPO_ORL),
  u('ANAVAR 10',       'Oxandrolone 10 mg',                   '100 Tablets per box', OPO_ORL),
  u('ANAPOLON 25',     'Oxymetholone 25 mg',                  '100 Tablets per box', OPO_ORL),
  u('DIANABOL 10',     'Methandrostenolone 10 mg',            '100 Tablets per box', OPO_ORL),
  u('TURINA 10',       '4-Chlorodehydromethyltestosterone 10 mg', '100 Tablets per box', OPO_ORL),
  u('STANO 10',        'Stanozolol 10 mg',                    '100 Tablets per box', OPO_ORL),
  u('NOLVADEX 10',     'Tamoxifen Citrate 10 mg',             '100 Tablets per box', OPO_ORL),
  u('PROVIRON 25',     'Mesterolone 25 mg',                   '100 Tablets per box', OPO_ORL),
  u('CLENBUTEROL 50',  'Clenbuterol HCL 50 mcg',             '100 Tablets per box', OPO_ORL),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMUM NEW — ENJEKTABL MONO (10 Ampules)
  // ═══════════════════════════════════════════════════════════════════════════
  u('TESTABOL 100',   'Testosterone Propionate 100 mg/ml',  '100 mg x 10 Ampules', OPN_MON),
  u('TESTABOL 200',   'Testosterone Cypionate 200 mg/ml',   '200 mg x 10 Ampules', OPN_MON),
  u('TESTABOL 250',   'Testosterone Enanthate 250 mg/ml',   '250 mg x 10 Ampules', OPN_MON),
  u('TESTABOL 400',   'Testosterone Acetate 60mg + Enanthate 142mg + Decanoate 198mg', '400 mg x 10 Ampules', OPN_MON),
  u('TRENABOL 100',   'Trenbolone Acetate 100 mg',          '100 mg x 10 Ampules', OPN_MON),
  u('TRENABOL 125',   'Trenbolone Hexahydrobenzylcarbonate 125 mg', '125 mg x 10 Ampules', OPN_MON),
  u('TRENABOL 200',   'Trenbolone Enanthate 200 mg',        '200 mg x 10 Ampules', OPN_MON),
  u('DECABOL 200',    'Nandrolone Decanoate 200 mg',        '200 mg x 10 Ampules', OPN_MON),
  u('BOLDEBOL 200',   'Boldenone Undecylenate 200 mg',      '200 mg x 10 Ampules', OPN_MON),
  u('MASTEBOL 100',   'Drostanolone Propionate 100 mg',     '100 mg x 10 Ampules', OPN_MON),
  u('PRIMOBOL 100',   'Methenolone Enanthate 100 mg',       '100 mg x 10 Ampules', OPN_MON),
  u('SUSTABOL 300',   'Testosterone Propionate 63mg + Cypionate 100mg + Isocaproate 137mg', '300 mg x 10 Ampules', OPN_MON),
  u('STANABOL',       'Stanozolol Suspension 50 mg',        '50 mg x 10 Ampules',  OPN_MON),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMUM NEW — ENJEKTABL MIX (10 Ampules)
  // ═══════════════════════════════════════════════════════════════════════════
  u('ULTRABOL 150',   'Trenbolone Acetate 50mg + Testosterone Propionate 50mg + Drostanolone Propionate 50mg', '150 mg x 10 Ampules', OPN_MIX),
  u('ULTRABOL 400',   'Trenbolone Enanthate 100mg + Testosterone Enanthate 150mg + Boldenone Undecylenate 150mg', '400 mg x 10 Ampules', OPN_MIX),
  u('MEGABOL 350',    'Trenbolone Enanthate 100mg + Drostanolone Enanthate 100mg + Testosterone Enanthate 150mg', '350 mg x 10 Ampules', OPN_MIX),
  u('MEGABOL 400',    'Nandrolone Decanoate 125mg + Boldenone Undecylenate 125mg + Testosterone Enanthate 150mg', '400 mg x 10 Ampules', OPN_MIX),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMUM NEW — ORAL TABLET / KAPSÜL
  // ═══════════════════════════════════════════════════════════════════════════

  // HRT Oral
  u('ANAVAR',          'Oxandrolone 10 mg',                    '100 Tablets',  OPN_ORL),
  u('ANAPOLON 25',     'Oxymetholone 25 mg',                   '100 Tablets',  OPN_ORL),
  u('DIANABOL 10',     'Methandrostenolone 10 mg',             '100 Tablets',  OPN_ORL),
  u('TURINA',          '4-Chlorodehydromethyltestosterone 10 mg','100 Tablets', OPN_ORL),
  u('STANO 10',        'Stanozolol 10 mg',                     '100 Tablets',  OPN_ORL),
  u('NOLVADEX 10',     'Tamoxifen Citrate 10 mg',              '100 Tablets',  OPN_ORL),
  u('PROVIRON 25',     'Mesterolone 25 mg',                    '60 Tablets',   OPN_ORL),

  // Benign Prostatic Hyperplasia
  u('DOXAN',           'Doxalp Mesylate 2 mg',    '3 strips x 10 tablets', OPN_ORL),
  u('DUTARIDE',        'Dutalp 0.5 mg',            '3 strips x 10 tablets', OPN_ORL),
  u('FINARIDE',        'Finalp 5 mg',              '3 strips x 10 tablets', OPN_ORL),
  u('OPTIMUM-O',       'Alpha-O HCL 10 mg',        '3 strips x 10 tablets', OPN_ORL),
  u('TAMOXIN',         'Tamalp HCL 400 mcg',       '3 strips x 10 capsules',OPN_ORL),
  u('TERAMIN',         'Teralp HCL 2 mg',          '3 strips x 10 tablets', OPN_ORL),

  // Men's Health
  u('DAPOXETIN',       'Dapoxetine 60 mg',          '10 x 10 Tablets per box', OPN_ORL),
  u('SILDENAFIL',      'Sildenafil Citrate 100 mg', '10 x 10 Tablets per box', OPN_ORL),
  u('TADALAFIL',       'Tadalafil 20 mg',           '10 x 10 Tablets per box', OPN_ORL),
  u('VERDANAFIL',      'Vardenafil HCL 20 mg',      '10 x 10 Tablets per box', OPN_ORL),

  // Oncology
  u('ANASTROLE',       'Anastrozole 1 mg',          '30 tablets',           OPN_ORL),
  u('AROMESTANE',      'Exemestane 25 mg',          '3 strips x 10 tablets',OPN_ORL),
  u('TAMOREN',         'Tamoxifen Citrate 20 mg',   '50 tablets',           OPN_ORL),

  // Psychotropics
  u('MODAFINIL',       'Modafinil 200 mg',          '3 strips x 10 tablets',OPN_ORL),
  u('ZOPICLONE',       'Zopiclone 7.5 mg',          '3 strips x 10 tablets',OPN_ORL),

  // Thyroid
  u('THYROID',         'Liothyronine Sodium 25 mcg','30 tablets of 25 mcg', OPN_ORL),

  // Asthmatics
  u('CLENBUTEROL',     'Clenbuterol HCL 50 mcg',   '5 strips x 20 tablets',OPN_ORL),

  // SARM
  u('LGD-4033 LIGANDROX', 'LGD-4033 (Ligandrol) 10 mg',   '60 capsules per bottle', OPN_ORL),
  u('MK-2866 OSTAROX',    'MK-2866 (Ostarine) 25 mg',      '60 capsules per bottle', OPN_ORL),
  u('RAD-140 TESTOLOX',   'RAD-140 (Testolone) 10 mg',     '60 capsules per bottle', OPN_ORL),
  u('MK-677 IBUTAMOX',    'MK-677 (Ibutamoren) 15 mg',     '60 capsules per bottle', OPN_ORL),
  u('GW-501516 CARDINOX', 'GW-501516 (Cardarine) 10 mg',   '60 capsules per bottle', OPN_ORL),
  u('YK-11 MYOSTINOX',    'YK-11 5 mg',                    '60 capsules per bottle', OPN_ORL),
  u('SR9011 STENABOX',    'SR9011 20 mg',                   '60 capsules per bottle', OPN_ORL),
  u('BULKESTERON',        'LGD-4033 10 mg + MK-677 15 mg', '60 capsules per bottle', OPN_ORL),
  u('VOLUMIZER',          'RAD-140 10 mg + YK-11 5 mg',    '60 capsules per bottle', OPN_ORL),
  u('HYDOXYN',            'SR9009 20 mg + RAD-140 10 mg',  '60 capsules per bottle', OPN_ORL),
  u('PCT LH FSH TEST',    'Natural LH/FSH/Testosterone support complex', '60 capsules per bottle', OPN_ORL),
  u('THERMO FAT BURNER',  'Thermogenic complex blend',      '60 capsules per bottle', OPN_ORL),

  // Vitamins & Supplements
  u('GINSENG PLUS',    'Panax Ginseng C.A. Meyer 200/400 mg', 'See product label', OPN_ORL),
  u('IODINE',          'IOD',                                  'See product label', OPN_ORL),
  u('MAGNEZINC',       'Zinc 10mg + Magnesium 375mg + Vitamin B6 1.8mg', 'See product label', OPN_ORL),
  u('OP-ZINC',         'Zinc 10 mg',                           'See product label', OPN_ORL),
  u('OPTIVITAL',       '12 essential vitamins and minerals',   'See product label', OPN_ORL),
  u('VITAMIN C',       'Vitamin C (as ascorbic acid) 1000 mg', 'See product label', OPN_ORL),
  u('VITAMIN D3',      'Vitamin D3 (as cholecalciferol) 2500 IU', 'See product label', OPN_ORL),
  u('WAKE UP',         'Caffeine + L-Theanine',                'See product label', OPN_ORL),
];

// ─── Sıfırlama + Seed ────────────────────────────────────────────────────────

async function run() {
  console.log('🗑️  Veritabanı sıfırlanıyor...');
  await sql`DELETE FROM bayi_fiyatlari`;
  await sql`DELETE FROM urunler`;
  await sql`DELETE FROM kategoriler`;
  await sql`DELETE FROM markalar`;
  await sql`DELETE FROM kullanicilar WHERE rol != 'Admin'`;
  await sql`DELETE FROM adresler`;
  await sql`DELETE FROM siparisler`;
  console.log('   Temizlendi.');

  console.log(`\n📦 ${MARKALAR.length} marka ekleniyor...`);
  for (const m of MARKALAR) {
    await sql`INSERT INTO markalar (id, ad, aktif) VALUES (${m.id}, ${m.ad}, TRUE)`;
  }

  console.log(`📂 ${KATEGORILER.length} kategori ekleniyor...`);
  for (const k of KATEGORILER) {
    await sql`INSERT INTO kategoriler (id, ad, marka_id, aktif) VALUES (${k.id}, ${k.ad}, ${k.markaId}, TRUE)`;
  }

  console.log(`💊 ${URUNLER.length} ürün ekleniyor...`);
  let i = 0;
  for (const u of URUNLER) {
    await sql`INSERT INTO urunler
      (id, ad, marka_id, marka, kat_id, kategori, aktif_madde, birim, ambalaj, fiyat_bayi, fiyat_musteri, para, aktif)
      VALUES (
        ${u.id}, ${u.ad}, ${u.markaId}, ${u.marka}, ${u.katId}, ${u.kategori},
        ${u.aktifMadde||null}, ${u.birim||null}, ${u.ambalaj||null},
        NULL, NULL, ${u.para||'EUR'}, TRUE
      )`;
    i++;
    if (i % 20 === 0) console.log(`   ${i}/${URUNLER.length} eklendi...`);
  }

  console.log(`\n✅ Tamamlandı!`);
  console.log(`   Markalar: ${MARKALAR.length}`);
  console.log(`   Kategoriler: ${KATEGORILER.length}`);
  console.log(`   Ürünler: ${URUNLER.length}`);
  console.log(`\n⚠️  Iron Pharma ve Swiss Pharma ürünleri henüz eklenmedi.`);
  console.log(`   Siteden çekilip ayrıca eklenecek.`);
}

run().catch(e => { console.error('HATA:', e.message); process.exit(1); });
