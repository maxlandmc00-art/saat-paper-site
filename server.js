const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'veri.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Veri dosyasını kontrol et ve oluştur
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
    console.log('✅ veri.json dosyası mevcut');
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    console.log('✅ veri.json dosyası oluşturuldu');
  }
}

// Verileri oku
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Veri okuma hatası:', error);
    return [];
  }
}

// Verileri yaz
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('✅ Veriler kaydedildi');
    return true;
  } catch (error) {
    console.error('❌ Veri yazma hatası:', error);
    return false;
  }
}

// API Endpoints

// Tüm kayıtları getir
app.get('/api/records', async (req, res) => {
  try {
    const records = await readData();
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Yeni kayıt ekle
app.post('/api/records', async (req, res) => {
  try {
    const records = await readData();
    const newRecord = {
      ...req.body,
      id: req.body.id || `record_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    records.push(newRecord);
    const success = await writeData(records);
    
    if (success) {
      res.json({ success: true, data: newRecord });
    } else {
      res.status(500).json({ success: false, error: 'Kayıt eklenemedi' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Kayıt güncelle
app.put('/api/records/:id', async (req, res) => {
  try {
    const records = await readData();
    const index = records.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Kayıt bulunamadı' });
    }
    
    records[index] = {
      ...records[index],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };
    
    const success = await writeData(records);
    
    if (success) {
      res.json({ success: true, data: records[index] });
    } else {
      res.status(500).json({ success: false, error: 'Kayıt güncellenemedi' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Kayıt sil
app.delete('/api/records/:id', async (req, res) => {
  try {
    const records = await readData();
    const filteredRecords = records.filter(r => r.id !== req.params.id);
    
    if (records.length === filteredRecords.length) {
      return res.status(404).json({ success: false, error: 'Kayıt bulunamadı' });
    }
    
    const success = await writeData(filteredRecords);
    
    if (success) {
      res.json({ success: true, message: 'Kayıt silindi' });
    } else {
      res.status(500).json({ success: false, error: 'Kayıt silinemedi' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tüm verileri sil (reset)
app.delete('/api/records', async (req, res) => {
  try {
    const success = await writeData([]);
    if (success) {
      res.json({ success: true, message: 'Tüm veriler silindi' });
    } else {
      res.status(500).json({ success: false, error: 'Veriler silinemedi' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server'ı başlat
async function startServer() {
  await initDataFile();
  app.listen(PORT, () => {
    console.log('🚀 Server başlatıldı!');
    console.log(`📡 http://localhost:${PORT}`);
    console.log(`📁 Veri dosyası: ${DATA_FILE}`);
    console.log('\n📊 API Endpoints:');
    console.log(`   GET    /api/records       - Tüm kayıtları getir`);
    console.log(`   POST   /api/records       - Yeni kayıt ekle`);
    console.log(`   PUT    /api/records/:id   - Kayıt güncelle`);
    console.log(`   DELETE /api/records/:id   - Kayıt sil`);
    console.log(`   DELETE /api/records       - Tüm verileri sil`);
  });
}

startServer();
