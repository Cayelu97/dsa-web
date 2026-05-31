const fs = require('fs').promises;
const path = require('path');
let admin;
let db;
let useFirestore = false;

// Local JSON File Paths
const PRODUCTS_PATH = path.join(__dirname, 'data', 'products.json');
const CONFIG_PATH = path.join(__dirname, 'data', 'config.json');
const LEADS_PATH = path.join(__dirname, 'data', 'leads.json');

// Initialize Firebase Admin if Service Account exists in Environment
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    admin = require('firebase-admin');
    
    // Parse service account string
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      // Fallback if it is base64 encoded or double stringified
      serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('ascii'));
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    db = admin.firestore();
    useFirestore = true;
    console.log('🚀 Base de datos: Conectado a Firebase Firestore (Nube)');
    
    // Proactive database seeding
    seedFirestoreIfNeeded();
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin. Usando base de datos JSON local.', error);
    useFirestore = false;
  }
} else {
  console.log('💻 Base de datos: Usando archivos JSON locales (/data)');
}

// Helper to safely read local JSON
async function readJsonFile(filePath, defaultData = []) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeJsonFile(filePath, defaultData);
      return defaultData;
    }
    throw error;
  }
}

// Helper to safely write local JSON
async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Seeding logic to populate Firestore from local JSON files if database is empty
async function seedFirestoreIfNeeded() {
  try {
    // 1. Seed Config
    const configDoc = await db.collection('config').doc('main').get();
    if (!configDoc.exists) {
      console.log('🌱 Seeding: Cargando configuración inicial en Firestore...');
      const localConfig = await readJsonFile(CONFIG_PATH, {
        whatsapp: "5491100000000",
        email: "disenodesolucionesagiles@gmail.com",
        socials: { instagram: "", linkedin: "", facebook: "" },
        heroTitle: "Sistemas simples y potentes",
        heroSubtitle: "Diseño de Soluciones Ágiles",
        promoBanner: "Software Cloud Ultra-Accesible",
        adminPassword: "dsa123"
      });
      await db.collection('config').doc('main').set(localConfig);
    }

    // 2. Seed Products
    const productsSnap = await db.collection('products').limit(1).get();
    if (productsSnap.empty) {
      console.log('🌱 Seeding: Cargando productos iniciales en Firestore...');
      const localProducts = await readJsonFile(PRODUCTS_PATH, []);
      for (const prod of localProducts) {
        await db.collection('products').doc(prod.id).set(prod);
      }
    }
    console.log('🌱 Seeding completado o innecesario (datos ya existentes en Firestore).');
  } catch (error) {
    console.error('❌ Error al realizar seeding en Firestore:', error);
  }
}

// --- PRODUCTS SERVICES ---

async function getProducts() {
  if (useFirestore) {
    const snap = await db.collection('products').get();
    const list = [];
    snap.forEach(doc => {
      list.push(doc.data());
    });
    return list;
  } else {
    return await readJsonFile(PRODUCTS_PATH, []);
  }
}

async function saveProduct(product) {
  if (useFirestore) {
    await db.collection('products').doc(product.id).set(product);
    return product;
  } else {
    const list = await readJsonFile(PRODUCTS_PATH, []);
    list.push(product);
    await writeJsonFile(PRODUCTS_PATH, list);
    return product;
  }
}

async function updateProduct(id, fields) {
  if (useFirestore) {
    await db.collection('products').doc(id).update(fields);
    // Get updated document
    const doc = await db.collection('products').doc(id).get();
    return doc.data();
  } else {
    const list = await readJsonFile(PRODUCTS_PATH, []);
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...fields };
    await writeJsonFile(PRODUCTS_PATH, list);
    return list[index];
  }
}

async function deleteProduct(id) {
  if (useFirestore) {
    await db.collection('products').doc(id).delete();
    return true;
  } else {
    const list = await readJsonFile(PRODUCTS_PATH, []);
    const filtered = list.filter(p => p.id !== id);
    if (list.length === filtered.length) return false;
    await writeJsonFile(PRODUCTS_PATH, filtered);
    return true;
  }
}

// --- CONFIG SERVICES ---

async function getConfig() {
  if (useFirestore) {
    const doc = await db.collection('config').doc('main').get();
    if (doc.exists) {
      return doc.data();
    }
    // Fallback if not seeded
    return { adminPassword: 'dsa123' };
  } else {
    return await readJsonFile(CONFIG_PATH, { adminPassword: 'dsa123' });
  }
}

async function saveConfig(fields) {
  if (useFirestore) {
    await db.collection('config').doc('main').set(fields, { merge: true });
    const doc = await db.collection('config').doc('main').get();
    return doc.data();
  } else {
    const current = await readJsonFile(CONFIG_PATH, {});
    const updated = { ...current, ...fields, socials: { ...current.socials, ...fields.socials } };
    await writeJsonFile(CONFIG_PATH, updated);
    return updated;
  }
}

// --- LEADS SERVICES ---

async function getLeads() {
  if (useFirestore) {
    const snap = await db.collection('leads').get();
    const list = [];
    snap.forEach(doc => {
      list.push(doc.data());
    });
    return list;
  } else {
    return await readJsonFile(LEADS_PATH, []);
  }
}

async function saveLead(lead) {
  if (useFirestore) {
    await db.collection('leads').doc(lead.id).set(lead);
    return lead;
  } else {
    const list = await readJsonFile(LEADS_PATH, []);
    list.push(lead);
    await writeJsonFile(LEADS_PATH, list);
    return lead;
  }
}

async function updateLead(id, fields) {
  if (useFirestore) {
    await db.collection('leads').doc(id).update(fields);
    const doc = await db.collection('leads').doc(id).get();
    return doc.data();
  } else {
    const list = await readJsonFile(LEADS_PATH, []);
    const index = list.findIndex(l => l.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...fields };
    await writeJsonFile(LEADS_PATH, list);
    return list[index];
  }
}

async function deleteLead(id) {
  if (useFirestore) {
    await db.collection('leads').doc(id).delete();
    return true;
  } else {
    const list = await readJsonFile(LEADS_PATH, []);
    const filtered = list.filter(l => l.id !== id);
    if (list.length === filtered.length) return false;
    await writeJsonFile(LEADS_PATH, filtered);
    return true;
  }
}

module.exports = {
  getProducts,
  saveProduct,
  updateProduct,
  deleteProduct,
  getConfig,
  saveConfig,
  getLeads,
  saveLead,
  updateLead,
  deleteLead
};
