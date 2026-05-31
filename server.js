const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authorization middleware
async function checkAuth(req, res, next) {
  const adminPasswordHeader = req.headers['x-admin-password'];
  
  try {
    const config = await db.getConfig();
    const actualPassword = config.adminPassword || 'dsa123'; // Default fallback password

    if (req.method === 'GET' && req.path !== '/api/leads') {
      // Public GET endpoints don't require authorization
      return next();
    }

    // Allow lead creation (POST /api/leads) from public forms
    if (req.method === 'POST' && req.path === '/api/leads') {
      return next();
    }

    if (adminPasswordHeader === actualPassword) {
      return next();
    }

    return res.status(401).json({ error: 'No autorizado. PIN incorrecto.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error de autenticación del servidor' });
  }
}

// Apply auth to modify requests & CRM read requests
app.use(checkAuth);

// --- PRODUCTS API ---

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, category, stock, image, status, bullets } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    const newProduct = {
      id: 'prod_' + Date.now(),
      name,
      description: description || '',
      price: Number(price),
      category: category || 'Sistemas Cloud',
      stock: stock !== undefined ? Number(stock) : 0,
      image: image || 'fa-cubes',
      status: status || 'activo',
      bullets: Array.isArray(bullets) ? bullets : []
    };

    const saved = await db.saveProduct(newProduct);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock, image, status, bullets } = req.body;

    const fields = {};
    if (name !== undefined) fields.name = name;
    if (description !== undefined) fields.description = description;
    if (price !== undefined) fields.price = Number(price);
    if (category !== undefined) fields.category = category;
    if (stock !== undefined) fields.stock = Number(stock);
    if (image !== undefined) fields.image = image;
    if (status !== undefined) fields.status = status;
    if (bullets !== undefined) fields.bullets = Array.isArray(bullets) ? bullets : [];

    const updated = await db.updateProduct(id, fields);
    
    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteProduct(id);

    if (!success) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// --- CONFIG API ---

// Get configuration
app.get('/api/config', async (req, res) => {
  try {
    const config = await db.getConfig();
    // Don't leak password to public requests
    const publicConfig = { ...config };
    delete publicConfig.adminPassword;
    res.json(publicConfig);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Update configuration
app.post('/api/config', async (req, res) => {
  try {
    const { whatsapp, email, socials, heroTitle, heroSubtitle, promoBanner, adminPassword } = req.body;

    const fields = {};
    if (whatsapp !== undefined) fields.whatsapp = whatsapp;
    if (email !== undefined) fields.email = email;
    if (socials !== undefined) fields.socials = socials;
    if (heroTitle !== undefined) fields.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) fields.heroSubtitle = heroSubtitle;
    if (promoBanner !== undefined) fields.promoBanner = promoBanner;
    if (adminPassword !== undefined && adminPassword !== '') fields.adminPassword = adminPassword;

    const updatedConfig = await db.saveConfig(fields);
    
    // Return config without password
    const publicConfig = { ...updatedConfig };
    delete publicConfig.adminPassword;
    res.json(publicConfig);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// --- CRM / LEADS API ---

// Get all leads (requires admin password)
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await db.getLeads();
    // Sort leads by date descending (newest first)
    leads.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener leads' });
  }
});

// Create lead (public access for forms and checkout clicks)
app.post('/api/leads', async (req, res) => {
  try {
    const { type, name, businessName, phone, email, message } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: 'Tipo de lead y nombre son requeridos' });
    }

    const newLead = {
      id: 'lead_' + Date.now(),
      type, // 'trial_request', 'contact', 'whatsapp_click'
      name,
      businessName: businessName || '',
      phone: phone || '',
      email: email || '',
      message: message || '',
      date: new Date().toISOString(),
      status: 'Nuevo' // 'Nuevo', 'En Contacto', 'Venta Cerrada', 'Descartado'
    };

    const saved = await db.saveLead(newLead);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar lead' });
  }
});

// Update lead status
app.put('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Estado es requerido' });
    }

    const updated = await db.updateLead(id, { status });

    if (!updated) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar lead' });
  }
});

// Delete lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteLead(id);

    if (!success) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    res.json({ message: 'Lead eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar lead' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor de DSA corriendo en http://localhost:${PORT}`);
});
