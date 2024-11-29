import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

dotenv.config();

if (!process.env.API_KEY) {
  console.error("Error: API_KEY is not defined. Please check your .env file.");
  process.exit(1);
}

// Declare the API key, model, and WhatsApp client
const generativeAI = new GoogleGenerativeAI(process.env.API_KEY);
const aiModel = generativeAI.getGenerativeModel({ model: 'gemini-pro' });
const whatsappClient = new Client({
  puppeteer: {
    executablePath: '/usr/bin/google-chrome',
  },
});

// Initialize AI Bot Info with context and response rules
const initializeBotInfo = () => ({
  roleDescription: `
    Nama: Mulyono - Universitas Gajah Mada Customer Service AI Assistant
    Deskripsi Tugas: Memberikan informasi akurat terkait Universitas Gajah Mada
    Bahasa Komunikasi: Bahasa Indonesia (Formal dan Ramah)
    Sebutan untuk User: "Kak" atau "Kakak"
  `,
  botKnowledgeBase: {
    akademik: [
      "Detail Program Studi",
      "Kalender Akademik",
      "Kurikulum dan Silabus",
      "Jumlah SKS yang Dibutuhkan",
      "Jadwal Kelas",
      "Mata Kuliah Wajib dan Pilihan",
      "Konsultasi Akademik",
      "Dosen Pembimbing Akademik",
      "Syarat Kelulusan",
    ],
    penerimaan: [
      "Penmaba",
      "Proses Seleksi",
      "Dokumen yang Diperlukan",
      "Jalur Masuk (SNBP, SNBT, Mandiri)",
      "Biaya Pendaftaran",
      "Tanggal Penting Penerimaan",
      "Beasiswa untuk Calon Mahasiswa",
      "Proses Registrasi Setelah Lolos",
      "Frequently Asked Questions (FAQ) Penerimaan",
    ],
    kampus: [
      "Lokasi",
      "Fasilitas Kampus",
      "Peta Kampus dan Aksesibilitas",
      "Kantin dan Area Makan",
      "Pusat Kegiatan Mahasiswa",
      "Perpustakaan",
      "Laboratorium",
      "Pusat Olahraga dan Kesehatan",
      "Asrama Mahasiswa",
      "Tempat Parkir",
    ],
    keuangan: [
      "Biaya Kuliah",
      "Beasiswa",
      "Metode Pembayaran",
      "Cara Pembayaran",
      "Keringanan Biaya Kuliah",
      "Kontak Bagian Keuangan",
      "Bantuan Keuangan untuk Mahasiswa",
      "Syarat Mendapatkan Beasiswa",
      "Jadwal Pembayaran Biaya Kuliah",
    ],
    kehidupanKampus: [
      "Unit Kegiatan Mahasiswa (UKM)",
      "Komunitas Mahasiswa",
      "Acara Kampus",
      "Pengalaman Hidup di Yogyakarta",
      "Makanan dan Budaya Lokal",
      "Dukungan Mahasiswa Internasional",
      "Tempat Wisata Sekitar Kampus",
      "Transportasi Lokal",
    ],
    administrasi: [
      "Proses Pengajuan Surat Keterangan",
      "Pembuatan KTM (Kartu Tanda Mahasiswa)",
      "Pengajuan Cuti Akademik",
      "Pindah Program Studi",
      "Pembatalan atau Penangguhan Studi",
      "Pendaftaran Ulang",
      "Verifikasi Dokumen Akademik",
    ],
    layanan: [
      "Layanan Konseling Mahasiswa",
      "Layanan Kesehatan",
      "Pusat Karier",
      "Bimbingan dan Konseling Karier",
      "Layanan IT dan Email Kampus",
      "Akses WiFi Kampus",
      "Pusat Bantuan Mahasiswa",
    ],
  },
  responseGuidelines: `
    1. Tidak menggunakan emoticon
    2. Menggunakan Bahasa Indonesia yang formal dan ramah
    3. Batas respons adalah 1 hingga 2 paragraf
    4. Sebut pengguna dengan "Kak" atau "Kakak"
    5. Jika informasi tidak ada, arahkan ke humas@ugm.ac.id
  `,
});

// Generate a response prompt for the AI model based on the user's question
const generateReply = (userQuestion) => {
  const botInfo = initializeBotInfo();
  return `
    ${botInfo.roleDescription}

    ${botInfo.responseGuidelines}

    ${JSON.stringify(botInfo.botKnowledgeBase, null, 2)}

    Pertanyaan User: ${userQuestion}

    Tolong berikan jawaban sesuai dengan instruksi di atas.
  `;
};

// Display QR code for WhatsApp login
whatsappClient.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

// Ready event for WhatsApp client
whatsappClient.on('ready', () => {
  console.log('WhatsApp Bot is ready to serve!');
});

// Handle incoming WhatsApp messages
whatsappClient.on('message', async (message) => {
  console.log('Received a message:', message.body);  // Log for debugging purposes

  if (message.body.startsWith('!gipy')) {
    console.log('Message starts with !gipy, proceeding with processing...');

    const userQuery = message.body.slice(4).trim();
    console.log('Extracted user question:', userQuery);

    try {
      const chatSession = aiModel.startChat({
        history: [],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      console.log('Sending request to Google Generative AI...');

      const chatResult = await chatSession.sendMessage(generateReply(userQuery));
      const aiResponse = chatResult.response.text();

      console.log('Generated AI response:', aiResponse);

      message.reply(aiResponse);
    } catch (error) {
      console.error('Error while processing the message:', error);
      message.reply('Maaf Kak, terjadi kendala teknis. Silakan coba lagi nanti.');
    }
  } else {
    console.log('Received a message that does not start with !gipy');
  }
});

// Initialize the WhatsApp client
whatsappClient.initialize();
