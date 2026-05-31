// DSA - Panel de Control & Lógica del CRM

// Global States
let products = [];
let leads = [];
let siteConfig = {};
let tempBullets = []; // Local builder array for product highlights
let editingProductId = null;

// Headers constructor for Auth APIs
function getAuthHeaders() {
  const pin = sessionStorage.getItem('dsa_admin_pin') || '';
  return {
    'Content-Type': 'application/json',
    'X-Admin-Password': pin
  };
}

// 1. Session & Login Check
document.addEventListener('DOMContentLoaded', () => {
  const savedPin = sessionStorage.getItem('dsa_admin_pin');
  if (savedPin) {
    attemptInitialLoad();
  } else {
    showLoginOverlay();
  }
});

function showLoginOverlay() {
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('login-error').style.display = 'none';
}

function hideLoginOverlay() {
  document.getElementById('login-overlay').style.display = 'none';
}

async function attemptInitialLoad() {
  try {
    // Attempt fetching Leads as it requires authentication
    const response = await fetch('/api/leads', {
      headers: getAuthHeaders()
    });

    if (response.status === 401) {
      // Token exists but invalid
      sessionStorage.removeItem('dsa_admin_pin');
      showLoginOverlay();
      document.getElementById('login-error').style.display = 'block';
      document.getElementById('login-error').innerText = 'Sesión expirada o PIN modificado.';
      return;
    }

    if (!response.ok) throw new Error('Auth fetch failed');
    
    hideLoginOverlay();
    
    // Load all admin modules
    await loadProducts();
    await loadConfig();
    await loadLeads();
  } catch (error) {
    console.error('Initial load failed:', error);
    showLoginOverlay();
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const inputPin = document.getElementById('admin-pin-input').value.trim();
  const errorBox = document.getElementById('login-error');

  if (!inputPin) return;

  sessionStorage.setItem('dsa_admin_pin', inputPin);
  
  try {
    const response = await fetch('/api/leads', {
      headers: getAuthHeaders()
    });

    if (response.status === 401) {
      sessionStorage.removeItem('dsa_admin_pin');
      errorBox.style.display = 'block';
      errorBox.innerText = 'El PIN ingresado es incorrecto.';
      return;
    }

    if (!response.ok) throw new Error('Unspecified server error');

    hideLoginOverlay();
    
    // Load modules
    await loadProducts();
    await loadConfig();
    await loadLeads();
  } catch (error) {
    sessionStorage.removeItem('dsa_admin_pin');
    errorBox.style.display = 'block';
    errorBox.innerText = 'Error al verificar PIN. Comprobá el servidor.';
  }
}

function logoutAdmin() {
  sessionStorage.removeItem('dsa_admin_pin');
  window.location.reload();
}

// 2. Tab Navigation logic
function switchTab(tabId, buttonElement) {
  // Hide all contents
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(c => c.classList.remove('active'));

  // Deactivate all tab buttons
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(b => b.classList.remove('active'));

  // Activate targets
  document.getElementById(tabId).classList.add('active');
  buttonElement.classList.add('active');
}

// 3. Products Management (CRUD)
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Error al obtener productos');
    products = await response.json();
    renderProductsTable();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('admin-products-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No hay productos cargados en el catálogo. ¡Crea uno nuevo!
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  products.forEach(p => {
    // Set formatted price
    const priceText = p.price > 0 ? `$${p.price.toLocaleString('es-AR')} ARS` : 'Consultar';
    // Status color
    let statusBadge = '';
    if (p.status.toLowerCase() === 'activo') {
      statusBadge = `<span class="type-badge trial"><i class="fas fa-check"></i> Activo</span>`;
    } else if (p.status.toLowerCase() === 'beta') {
      statusBadge = `<span class="type-badge contact"><i class="fas fa-flask"></i> Beta</span>`;
    } else {
      statusBadge = `<span class="type-badge" style="background:rgba(255,255,255,0.05); color:var(--text-muted);"><i class="fas fa-clock"></i> Desarrollo</span>`;
    }

    html += `
      <tr>
        <td><i class="fas ${p.image || 'fa-cubes'}" style="font-size:1.15rem; color:var(--brand-cyan);"></i></td>
        <td style="font-weight:700;">${p.name}</td>
        <td>${p.category}</td>
        <td>${priceText}</td>
        <td>${p.stock} u</td>
        <td>${statusBadge}</td>
        <td>
          <div class="action-btn-group">
            <button onclick="editProduct('${p.id}')" class="act-btn act-btn-edit" title="Editar"><i class="fas fa-pen"></i></button>
            <button onclick="deleteProduct('${p.id}')" class="act-btn act-btn-delete" title="Eliminar"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// Bullets Highlights Builder helpers
function renderBulletsPreview() {
  const container = document.getElementById('bullet-list-builder-preview');
  if (!container) return;

  if (tempBullets.length === 0) {
    container.innerHTML = `<span style="font-size: 0.6875rem; color: var(--text-muted-dark)">No hay características agregadas todavía.</span>`;
    return;
  }

  let html = '';
  tempBullets.forEach((bullet, index) => {
    html += `
      <div class="bullet-item">
        <span>${bullet}</span>
        <button type="button" onclick="removeBulletFromBuilder(${index})" style="color:#ef4444; font-size:0.625rem;"><i class="fas fa-trash-can"></i></button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function addBulletToBuilder() {
  const input = document.getElementById('prod-bullet-input');
  const val = input.value.trim();

  if (!val) return;

  tempBullets.push(val);
  input.value = '';
  renderBulletsPreview();
}

function removeBulletFromBuilder(index) {
  tempBullets.splice(index, 1);
  renderBulletsPreview();
}

// Open Form Modal
function openProductModal() {
  editingProductId = null;
  document.getElementById('prod-modal-title').innerText = 'Agregar Solución';
  document.getElementById('product-crud-form').reset();
  
  // Clean states
  document.getElementById('prod-id').value = '';
  tempBullets = [];
  renderBulletsPreview();
  
  document.getElementById('product-modal-feedback').style.display = 'none';
  document.getElementById('product-modal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
}

// Edit product load
function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  editingProductId = id;
  document.getElementById('prod-modal-title').innerText = 'Editar Solución';
  
  // Fill inputs
  document.getElementById('prod-id').value = product.id;
  document.getElementById('prod-name').value = product.name;
  document.getElementById('prod-category').value = product.category;
  document.getElementById('prod-price').value = product.price;
  document.getElementById('prod-stock').value = product.stock;
  document.getElementById('prod-image').value = product.image || 'fa-cubes';
  
  // Normalize status value capital case
  let statusVal = 'Activo';
  if (product.status.toLowerCase() === 'beta') statusVal = 'Beta';
  if (product.status.toLowerCase() === 'desarrollo') statusVal = 'Desarrollo';
  document.getElementById('prod-status').value = statusVal;

  document.getElementById('prod-desc').value = product.description;

  // Load bullets
  tempBullets = [...(product.bullets || [])];
  renderBulletsPreview();

  document.getElementById('product-modal-feedback').style.display = 'none';
  document.getElementById('product-modal').classList.add('open');
}

// Submit Product Form (Add & Edit)
async function submitProductCrud(event) {
  event.preventDefault();
  const feedback = document.getElementById('product-modal-feedback');
  const submitBtn = document.getElementById('prod-submit-btn');

  const id = document.getElementById('prod-id').value;
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value;
  const price = Number(document.getElementById('prod-price').value);
  const stock = Number(document.getElementById('prod-stock').value);
  const image = document.getElementById('prod-image').value;
  const status = document.getElementById('prod-status').value.toLowerCase(); // Save lowercase
  const description = document.getElementById('prod-desc').value.trim();

  const payload = {
    name,
    category,
    price,
    stock,
    image,
    status,
    description,
    bullets: tempBullets
  };

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';

  try {
    let url = '/api/products';
    let method = 'POST';

    if (editingProductId) {
      url = `/api/products/${editingProductId}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Server returned an error');

    // Reload products and close
    await loadProducts();
    closeProductModal();
  } catch (error) {
    feedback.className = 'form-feedback error';
    feedback.style.display = 'block';
    feedback.innerText = 'No se pudo guardar el producto. Comprobá los permisos y el servidor.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Guardar Solución';
  }
}

// Delete product operation
async function deleteProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  if (!confirm(`¿Estás seguro que deseas eliminar el producto "${product.name}"? Esta acción borrará el registro del catálogo.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Delete request failed');
    await loadProducts();
  } catch (error) {
    alert('Error al intentar eliminar el producto.');
  }
}

// 4. Configuration Settings Manager
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Error al obtener config');
    siteConfig = await response.json();
    
    // Fill fields
    document.getElementById('cfg-whatsapp').value = siteConfig.whatsapp || '';
    document.getElementById('cfg-email').value = siteConfig.email || '';
    document.getElementById('cfg-instagram').value = siteConfig.socials?.instagram || '';
    document.getElementById('cfg-linkedin').value = siteConfig.socials?.linkedin || '';
    document.getElementById('cfg-facebook').value = siteConfig.socials?.facebook || '';

    document.getElementById('cfg-promo').value = siteConfig.promoBanner || '';
    document.getElementById('cfg-hero-title').value = siteConfig.heroTitle || '';
    document.getElementById('cfg-hero-sub').value = siteConfig.heroSubtitle || '';

    // Clear password input
    document.getElementById('cfg-pin').value = '';
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

async function saveSiteConfig(event) {
  event.preventDefault();
  const feedback = document.getElementById('config-feedback');
  const submitBtn = document.getElementById('config-save-btn');

  const whatsapp = document.getElementById('cfg-whatsapp').value.trim();
  const email = document.getElementById('cfg-email').value.trim();
  const instagram = document.getElementById('cfg-instagram').value.trim();
  const linkedin = document.getElementById('cfg-linkedin').value.trim();
  const facebook = document.getElementById('cfg-facebook').value.trim();
  const promoBanner = document.getElementById('cfg-promo').value.trim();
  const heroTitle = document.getElementById('cfg-hero-title').value.trim();
  const heroSubtitle = document.getElementById('cfg-hero-sub').value.trim();
  const newPin = document.getElementById('cfg-pin').value.trim();

  const payload = {
    whatsapp,
    email,
    socials: { instagram, linkedin, facebook },
    promoBanner,
    heroTitle,
    heroSubtitle
  };

  if (newPin) {
    payload.adminPassword = newPin;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';

  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Post config failed');
    
    // Update config state
    siteConfig = await response.json();

    // If they changed the pin, update the session token immediately so they don't get 401 on next calls!
    if (newPin) {
      sessionStorage.setItem('dsa_admin_pin', newPin);
    }

    feedback.className = 'form-feedback success';
    feedback.style.display = 'block';
    feedback.innerText = '¡Configuraciones del sitio actualizadas correctamente!';
    
    // Clear password pin input
    document.getElementById('cfg-pin').value = '';
    
    // Smooth scroll back to top of card to see message
    document.querySelector('.admin-card').scrollIntoView({ behavior: 'smooth' });

    // Hide success message after 5 seconds
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 5000);
  } catch (error) {
    feedback.className = 'form-feedback error';
    feedback.style.display = 'block';
    feedback.innerText = 'Error al actualizar configuraciones del sitio.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios Web';
  }
}

// 5. CRM / Leads System Management
async function loadLeads() {
  try {
    const response = await fetch('/api/leads', {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener prospectos');
    leads = await response.json();
    renderLeadsTable();
  } catch (error) {
    console.error('Error loading CRM leads:', error);
  }
}

function renderLeadsTable() {
  const tbody = document.getElementById('crm-leads-table-body');
  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No se registran contactos ni prospectos en el CRM todavía.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  leads.forEach(l => {
    // Format Date
    const rawDate = new Date(l.date);
    const dateFormatted = rawDate.toLocaleDateString('es-AR') + ' ' + rawDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    
    // Lead Type Badge
    let typeBadge = '';
    if (l.type === 'trial_request') {
      typeBadge = `<span class="type-badge trial"><i class="fas fa-circle-play"></i> Prueba 14d</span>`;
    } else if (l.type === 'contact') {
      typeBadge = `<span class="type-badge contact"><i class="fas fa-envelope"></i> Consulta</span>`;
    } else {
      typeBadge = `<span class="type-badge click"><i class="fab fa-whatsapp"></i> Clic Compra</span>`;
    }

    // Name & Business Name formatted
    const clientDetails = l.businessName 
      ? `<strong>${l.name}</strong><br><span style="font-size:0.75rem; color:var(--brand-cyan); font-weight:500;">🏭 ${l.businessName}</span>`
      : `<strong>${l.name}</strong>`;

    // Contacts details
    const contactDetails = `📞 ${l.phone || 'S/N'}<br>✉ <a href="mailto:${l.email}" style="color:var(--text-muted);">${l.email || 'S/E'}</a>`;

    // Dropdown for dynamic CRM status color and action updates
    const lowerStatus = l.status.toLowerCase().replace(' ', '');
    
    html += `
      <tr>
        <td style="white-space:nowrap; color:var(--text-muted-dark);">${dateFormatted}</td>
        <td>${typeBadge}</td>
        <td>${clientDetails}</td>
        <td style="white-space:nowrap;">${contactDetails}</td>
        <td style="max-width:250px; line-height:1.4;">${l.message || ''}</td>
        <td>
          <select onchange="updateLeadStatus('${l.id}', this)" class="status-select ${lowerStatus}">
            <option value="Nuevo" ${l.status === 'Nuevo' ? 'selected' : ''}>Nuevo</option>
            <option value="En Contacto" ${l.status === 'En Contacto' ? 'selected' : ''}>En Contacto</option>
            <option value="Venta Cerrada" ${l.status === 'Venta Cerrada' ? 'selected' : ''}>Venta Cerrada</option>
            <option value="Descartado" ${l.status === 'Descartado' ? 'selected' : ''}>Descartado</option>
          </select>
        </td>
        <td>
          <button onclick="deleteLead('${l.id}')" class="act-btn act-btn-delete" title="Eliminar Lead"><i class="fas fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// Update lead status dropdown
async function updateLeadStatus(id, selectElement) {
  const newStatus = selectElement.value;
  
  // Set select visual styling in real time
  const lowerStatus = newStatus.toLowerCase().replace(' ', '');
  selectElement.className = `status-select ${lowerStatus}`;

  try {
    const response = await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('Status update failed');
    
    // Update local state
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index].status = newStatus;
    }
  } catch (error) {
    alert('No se pudo guardar el estado en el CRM del servidor.');
    // Revert
    loadLeads();
  }
}

// Delete Lead from CRM
async function deleteLead(id) {
  if (!confirm('¿Seguro que deseas eliminar este prospecto/lead del CRM? Se borrará permanentemente de tu historial.')) {
    return;
  }

  try {
    const response = await fetch(`/api/leads/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Delete lead failed');
    await loadLeads();
  } catch (error) {
    alert('Error al intentar eliminar el lead del servidor.');
  }
}
