// DSA - Lógica de Negocio y Frontend

// Global States
let products = [];
let siteConfig = {};
let cart = [];
let activeCategory = 'Todos';

// Simulator Local State (Independent from global DB for safety)
let simProducts = [];
let simCaja = 18450;
let simVentasCount = 12;

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  initHeaderScroll();
});

// 1. Core Init
async function initApp() {
  await fetchConfig();
  await fetchProducts();
  initCart();
  calculateSavings(); // Initial calculator values
}

// Header scroll effect
function initHeaderScroll() {
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  const trigger = document.getElementById('mobile-menu-trigger');
  const drawer = document.getElementById('mobile-drawer');
  if (trigger && drawer) {
    trigger.addEventListener('click', () => {
      drawer.classList.toggle('open');
      const icon = trigger.querySelector('i');
      if (drawer.classList.contains('open')) {
        icon.className = 'fas fa-times';
      } else {
        icon.className = 'fas fa-bars';
      }
    });
  }
}

// 2. Fetch Config & Render Dynamics
async function fetchConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Error fetching config');
    siteConfig = await response.ok ? await response.json() : {};
    
    // Apply dynamic texts
    if (siteConfig.heroTitle) document.getElementById('hero-main-title').innerHTML = siteConfig.heroTitle;
    if (siteConfig.heroSubtitle) document.getElementById('hero-sub-description').innerText = siteConfig.heroSubtitle;
    if (siteConfig.promoBanner) document.getElementById('hero-promo-banner').innerText = siteConfig.promoBanner;

    // Contact info
    if (siteConfig.email) {
      document.getElementById('config-email').innerText = siteConfig.email;
    }
    if (siteConfig.whatsapp) {
      // Format number for humans
      let formattedPhone = siteConfig.whatsapp;
      if (formattedPhone.startsWith('549')) {
        formattedPhone = '+54 9 ' + formattedPhone.substring(3);
      }
      document.getElementById('config-phone').innerText = formattedPhone + ' (Soporte Directo)';
    }

    // Apply WhatsApp URLs
    const waPhone = siteConfig.whatsapp || '5491100000000';
    
    const headerCta = document.getElementById('header-whatsapp-cta');
    if (headerCta) {
      headerCta.href = `https://wa.me/${waPhone}?text=Hola%20DSA,%20me%20gustar%C3%ADa%20hacer%20una%20consulta%20sobre%20sus%20sistemas.`;
    }
    const mobileCta = document.getElementById('mobile-whatsapp-cta');
    if (mobileCta) {
      mobileCta.href = `https://wa.me/${waPhone}?text=Hola%20DSA,%20me%20gustar%C3%ADa%20hacer%20una%20consulta%20sobre%20sus%20sistemas.`;
    }

    // Apply services link
    document.getElementById('service-wa-link-1').href = `https://wa.me/${waPhone}?text=Hola%20DSA,%20me%20interesa%20automatizar%20un%20proceso%20en%20mi%20negocio.`;
    document.getElementById('service-wa-link-2').href = `https://wa.me/${waPhone}?text=Hola%20DSA,%20quiero%20crear%20mi%20sitio%20web%20o%20tienda%20online.`;
    document.getElementById('service-wa-link-3').href = `https://wa.me/${waPhone}?text=Hola%20DSA,%20me%20interesa%20integrar%20un%20asistente%20con%20IA.`;

    // Apply calculator WhatsApp link
    document.getElementById('calculator-whatsapp-cta').href = `https://wa.me/${waPhone}?text=Hola%20DSA,%20hice%20el%20c%C3%A1lculo%20de%20ahorros%20en%20la%20calculadora%20y%20me%20gustar%C3%ADa%20ver%20c%C3%B3mo%20puedo%20digitalizar%20mi%20negocio.`;

    // Render Social Icons
    renderSocials();
  } catch (error) {
    console.error('Error binding config:', error);
  }
}

function renderSocials() {
  const container = document.getElementById('footer-social-icons');
  if (!container || !siteConfig.socials) return;

  const socials = siteConfig.socials;
  let html = '';
  
  if (socials.instagram) {
    html += `<a href="${socials.instagram}" target="_blank" class="social-icon-btn"><i class="fab fa-instagram"></i></a>`;
  }
  if (socials.linkedin) {
    html += `<a href="${socials.linkedin}" target="_blank" class="social-icon-btn"><i class="fab fa-linkedin-in"></i></a>`;
  }
  if (socials.facebook) {
    html += `<a href="${socials.facebook}" target="_blank" class="social-icon-btn"><i class="fab fa-facebook-f"></i></a>`;
  }

  container.innerHTML = html;
}

// 3. Fetch Products & Render Catalog
async function fetchProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Error fetching products');
    products = await response.json();
    
    renderCatalog();
    initSimulatorData();
  } catch (error) {
    console.error('Error rendering catalog:', error);
    document.getElementById('catalog-items-grid').innerHTML = `
      <div style="grid-column: span 3; text-align: center; color: #ef4444; padding: 4rem;">
        <i class="fas fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 1rem;"></i>
        <p>No pudimos cargar los productos en este momento. Por favor reintenta.</p>
      </div>
    `;
  }
}

function renderCatalog() {
  const grid = document.getElementById('catalog-items-grid');
  if (!grid) return;

  const filtered = activeCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 4rem;">
        <i class="fas fa-folder-open" style="font-size: 2rem; margin-bottom: 1rem; opacity:0.5;"></i>
        <p>No se encontraron productos en esta categoría.</p>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(p => {
    // Generate feature bullets html
    let bulletsHtml = '';
    if (p.bullets && p.bullets.length > 0) {
      bulletsHtml = p.bullets.map(b => `
        <li>
          <span class="prod-features-icon"><i class="fas fa-check"></i></span>
          <span>${b}</span>
        </li>
      `).join('');
    }

    // Render price correctly
    const formattedPrice = p.price > 0 
      ? `$${p.price.toLocaleString('es-AR')} ARS / mes` 
      : 'Consultar';

    // Status tag class
    const statusClass = p.status.toLowerCase();

    html += `
      <div class="prod-card" data-category="${p.category}">
        <span class="prod-status-tag ${statusClass}">${p.status}</span>
        <div>
          <div class="prod-icon-box">
            <i class="fas ${p.image || 'fa-cubes'}"></i>
          </div>
          <h4 class="prod-title">${p.name}</h4>
          <p class="prod-desc">${p.description}</p>
          
          <ul class="prod-features">
            ${bulletsHtml}
          </ul>
        </div>
        
        <div class="prod-footer">
          <div class="prod-price-box">
            <span class="prod-price-label">Suscripción</span>
            <span class="prod-price">${formattedPrice}</span>
          </div>
          ${p.status.toLowerCase() !== 'desarrollo' ? `
            <button onclick="addToCart('${p.id}')" class="prod-cart-btn" title="Agregar al pedido">
              <i class="fas fa-cart-plus"></i>
            </button>
          ` : `
            <button onclick="openTrialModal('${p.name}')" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.6875rem;">
              Unirse Beta
            </button>
          `}
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

function filterCatalog(category) {
  activeCategory = category;
  
  // Update buttons state
  const buttons = document.querySelectorAll('#catalog-filters-container .filter-btn');
  buttons.forEach(btn => {
    if (btn.innerText === category || (category === 'Todos' && btn.innerText === 'Todos')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderCatalog();
}

// 4. Cart Logic
function initCart() {
  // Load cart from localStorage
  const savedCart = localStorage.getItem('dsa_cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }
  updateCartUI();
}

function toggleCart() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  drawer.classList.toggle('open');
  backdrop.classList.toggle('open');
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  
  // Highlight floating button
  const fbtn = document.getElementById('floating-cart-btn');
  fbtn.style.transform = 'scale(1.2)';
  setTimeout(() => {
    fbtn.style.transform = '';
  }, 300);

  // Automatically open the cart drawer so they see it
  const drawer = document.getElementById('cart-drawer');
  if (!drawer.classList.contains('open')) {
    toggleCart();
  }
}

function updateCartQty(productId, delta) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(item => item.id !== productId);
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('dsa_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const container = document.getElementById('cart-items-container');
  const badge = document.getElementById('cart-count');
  const totalVal = document.getElementById('cart-total-val');
  
  if (!container) return;

  // Qty badge count
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.innerText = totalItems;
  
  // Float visibility
  const floatBtn = document.getElementById('floating-cart-btn');
  if (totalItems > 0) {
    floatBtn.style.display = 'flex';
  } else {
    floatBtn.style.display = 'none';
  }

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <i class="fas fa-cart-arrow-down cart-empty-icon"></i>
        <p>Tu carrito está vacío</p>
        <button class="btn btn-secondary" onclick="toggleCart()" style="padding: 0.5rem 1rem; font-size: 0.75rem;">Ver Catálogo</button>
      </div>
    `;
    totalVal.innerText = '$0 ARS / mes';
    return;
  }

  let html = '';
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">$${item.price.toLocaleString('es-AR')} ARS / mes</span>
          
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)"><i class="fas fa-minus"></i></button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <button onclick="removeFromCart('${item.id}')" class="cart-item-remove" title="Quitar">
          <i class="fas fa-trash-can"></i>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
  totalVal.innerText = `$${total.toLocaleString('es-AR')} ARS / mes`;
}

// Checkout WhatsApp with CRM lead sync
async function checkoutWhatsApp() {
  if (cart.length === 0) return;

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Format message
  let text = 'Hola DSA! Me interesa adquirir las siguientes soluciones:\n\n';
  cart.forEach(item => {
    text += `- ${item.name} (Cantidad: ${item.qty}) - $${item.price.toLocaleString('es-AR')} c/u\n`;
  });
  text += `\n*Suscripción Estimada Total: $${total.toLocaleString('es-AR')} ARS / mes.*\n`;
  text += '\nPor favor, contáctenme para coordinar la activación de mi entorno.';

  const encodedText = encodeURIComponent(text);
  const waPhone = siteConfig.whatsapp || '5491100000000';
  const url = `https://wa.me/${waPhone}?text=${encodedText}`;

  // Sincronizar pedido con el CRM antes de redirigir
  const cartSummaryStr = cart.map(i => `${i.name} (${i.qty}u)`).join(', ');
  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'whatsapp_click',
        name: 'Cliente Catálogo Web',
        businessName: 'Consulta desde Tienda',
        phone: '',
        email: '',
        message: `Pedido por WhatsApp de: ${cartSummaryStr}. Suscripción Total: $${total.toLocaleString('es-AR')} ARS`
      })
    });
  } catch (error) {
    console.error('Error logging lead to CRM:', error);
  }

  // Clear cart and redirect
  cart = [];
  saveCart();
  updateCartUI();
  toggleCart();

  window.open(url, '_blank');
}

// 5. CRM Forms Submission
async function submitContactForm(event) {
  event.preventDefault();
  
  const feedback = document.getElementById('contact-feedback');
  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  
  const submitBtn = document.getElementById('contact-submit-btn');

  // Simple validation
  if (!name || !phone || !email || !message) {
    feedback.className = 'form-feedback error';
    feedback.innerText = 'Por favor, completa todos los campos del formulario.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...';

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'contact',
        name,
        phone,
        email,
        message
      })
    });

    if (!response.ok) throw new Error('Error al registrar prospecto');

    feedback.className = 'form-feedback success';
    feedback.innerText = '¡Tu mensaje ha sido enviado con éxito! Nos contactaremos a la brevedad.';
    
    // Clear form
    document.getElementById('crm-contact-form').reset();
  } catch (error) {
    feedback.className = 'form-feedback error';
    feedback.innerText = 'Hubo un inconveniente al enviar tu mensaje. Intentá de nuevo.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensaje';
  }
}

// 6. Trial Modal Logic
let requestedProductTrial = 'DSA Kiosco Inteligente';

function openTrialModal(productName) {
  requestedProductTrial = productName || 'DSA Kiosco Inteligente';
  document.getElementById('trial-modal-title').innerText = `Iniciar Prueba: ${requestedProductTrial}`;
  
  // Reset modal views
  document.getElementById('modal-form-view').style.display = 'block';
  document.getElementById('modal-processing-view').style.display = 'none';
  document.getElementById('modal-success-view').style.display = 'none';
  document.getElementById('modal-error-feedback').style.display = 'none';
  
  document.getElementById('trial-modal').classList.add('open');
}

function closeTrialModal() {
  document.getElementById('trial-modal').classList.remove('open');
}

async function submitTrialForm(event) {
  event.preventDefault();

  const name = document.getElementById('trial-name').value.trim();
  const business = document.getElementById('trial-business').value.trim();
  const phone = document.getElementById('trial-phone').value.trim();
  const email = document.getElementById('trial-email').value.trim();
  const errorBox = document.getElementById('modal-error-feedback');

  if (!name || !business || !phone || !email) {
    errorBox.style.display = 'block';
    errorBox.innerText = 'Completa todos los campos para continuar.';
    return;
  }

  // Switch to Processing View
  document.getElementById('modal-form-view').style.display = 'none';
  document.getElementById('modal-processing-view').style.display = 'flex';

  // Run console micro-animations
  const consoleL1 = document.getElementById('console-l1');
  const consoleL2 = document.getElementById('console-l2');
  const consoleL3 = document.getElementById('console-l3');

  consoleL1.innerText = `> Conectando con servidor seguro de pruebas...`;
  
  setTimeout(() => {
    consoleL1.className = 'console-line muted';
    consoleL2.className = 'console-line';
    consoleL2.innerText = `> Generando base de datos privada para "${business}"...`;
  }, 1000);

  setTimeout(() => {
    consoleL2.className = 'console-line muted';
    consoleL3.className = 'console-line';
    consoleL3.innerText = `> Provisionando entorno de soporte para ${name} en WhatsApp...`;
  }, 2200);

  // Send request to server CRM database
  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'trial_request',
        name,
        businessName: business,
        phone,
        email,
        message: `Solicitó prueba gratis de 14 días para: ${requestedProductTrial}`
      })
    });

    if (!response.ok) throw new Error('CRM registration failed');

    // WhatsApp final click redirect format
    setTimeout(() => {
      const waPhone = siteConfig.whatsapp || '5491100000000';
      const successMsg = `Hola DSA, acabo de registrar la solicitud de prueba para mi negocio: ${business}. Mi nombre es ${name} y me gustaría recibir los datos de acceso al sistema ${requestedProductTrial}.`;
      const encodedMsg = encodeURIComponent(successMsg);

      // Render success screen
      document.getElementById('modal-processing-view').style.display = 'none';
      document.getElementById('modal-success-view').style.display = 'flex';
      document.getElementById('success-biz-name').innerText = business;
      document.getElementById('modal-whatsapp-success-btn').href = `https://wa.me/${waPhone}?text=${encodedMsg}`;
    }, 3500);

  } catch (error) {
    // Show form with error again
    setTimeout(() => {
      document.getElementById('modal-processing-view').style.display = 'none';
      document.getElementById('modal-form-view').style.display = 'block';
      errorBox.style.display = 'block';
      errorBox.innerText = 'Hubo un error del servidor. Por favor, reintenta.';
    }, 1500);
  }
}

// 7. Productivity Savings Calculator Logic
function calculateSavings() {
  const hoursInput = document.getElementById('calc-hours');
  const lossInput = document.getElementById('calc-loss');
  const rateInput = document.getElementById('calc-rate');

  const hoursVal = document.getElementById('calc-hours-val');
  const lossVal = document.getElementById('calc-loss-val');
  const rateVal = document.getElementById('calc-rate-val');
  const totalVal = document.getElementById('calc-total-savings');

  if (!hoursInput || !lossInput || !rateInput) return;

  const hours = Number(hoursInput.value);
  const loss = Number(lossInput.value);
  const rate = Number(rateInput.value);

  // Update slider labels
  hoursVal.innerText = `${hours} horas`;
  lossVal.innerText = `$${loss.toLocaleString('es-AR')} ARS`;
  rateVal.innerText = `$${rate.toLocaleString('es-AR')} ARS`;

  // Formula: (hours_lost * rate * 4 weeks) + estimated_stock_losses
  // We assume DSA saves 85% of time and 90% of losses.
  const timeCostMonthly = hours * rate * 4;
  const totalLossCost = timeCostMonthly + loss;
  const savedTotal = Math.round(totalLossCost * 0.85);

  totalVal.innerText = `$${savedTotal.toLocaleString('es-AR')} / mes`;
}

// 8. Interactive Simulator logic
function initSimulatorData() {
  // We seed the local simulator database with products available
  // To avoid modifying the actual website DB during visitor clicks, we clone it
  simProducts = [
    { name: '🥤 Gaseosa Cola 500ml', price: 450, stock: 42 },
    { name: '🍫 Alfajor Triple', price: 300, stock: 8 },
    { name: '🍞 Pan de Molde', price: 1200, stock: 1 }
  ];
  
  simCaja = 18450;
  simVentasCount = 12;
  
  updateSimulatorUI();
  renderSimulatorQuickSells();
}

function updateSimulatorUI() {
  // Update Caja
  document.getElementById('sim-caja').innerText = `$${simCaja.toLocaleString('es-AR')} ARS`;
  // Update Ventas count
  document.getElementById('sim-ventas-count').innerText = simVentasCount;
  
  // Count low stock items (<= 3)
  const lowStockCount = simProducts.filter(p => p.stock <= 3).length;
  const lowStockElement = document.getElementById('sim-low-stock-count');
  lowStockElement.innerText = `${lowStockCount} ${lowStockCount === 1 ? 'ítem' : 'ítems'}`;
  
  if (lowStockCount > 0) {
    lowStockElement.className = 'sim-kpi-value red';
  } else {
    lowStockElement.className = 'sim-kpi-value';
  }

  // Render stock table
  const tbody = document.getElementById('sim-table-body');
  if (!tbody) return;

  let html = '';
  simProducts.forEach(p => {
    let stockClass = 'green';
    if (p.stock === 0) stockClass = 'red';
    else if (p.stock <= 3) stockClass = 'yellow';

    html += `
      <tr>
        <td>${p.name}</td>
        <td class="sim-table-price">$${p.price}</td>
        <td class="sim-table-stock ${stockClass}">${p.stock} u</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function renderSimulatorQuickSells() {
  const container = document.getElementById('sim-quick-sell-list');
  if (!container) return;

  // We display the first 3 items as quick sells
  let html = '';
  simProducts.slice(0, 3).forEach(p => {
    html += `
      <button onclick="simulateSale('${p.name}', ${p.price})" class="sim-sale-btn">
        <span>${p.name}</span>
        <span class="sim-sale-price">+$${p.price}</span>
      </button>
    `;
  });
  container.innerHTML = html;
}

function simulateSale(name, price) {
  const product = simProducts.find(p => p.name === name);
  const consoleLog = document.getElementById('sim-console-log');
  
  if (product && product.stock <= 0) {
    consoleLog.innerText = `⚠ Error: Sin stock de "${name}"! Carga más unidades primero.`;
    consoleLog.style.color = '#f87171';
    return;
  }

  if (product) {
    product.stock -= 1;
  }

  simCaja += price;
  simVentasCount += 1;

  updateSimulatorUI();
  
  consoleLog.innerText = `✔ Venta registrada: ${name} (+$${price}). Caja actualizada.`;
  consoleLog.style.color = 'var(--brand-green)';
}

function simAddProduct() {
  const nameInput = document.getElementById('sim-add-name');
  const priceInput = document.getElementById('sim-add-price');
  const stockInput = document.getElementById('sim-add-stock');
  const consoleLog = document.getElementById('sim-console-log');

  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const stock = Number(stockInput.value);

  if (!name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
    consoleLog.innerText = `⚠ Completa nombre, precio y stock válidos.`;
    consoleLog.style.color = '#f87171';
    return;
  }

  // Check if product exists in simulation
  const existing = simProducts.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.stock += stock;
    existing.price = price; // Update price
    consoleLog.innerText = `✔ Modificado "${name}": sumados ${stock} u. al stock.`;
  } else {
    // Insert new
    simProducts.push({ name, price, stock });
    consoleLog.innerText = `✔ Cargado al inventario local: "${name}" (${stock} u.)`;
  }
  
  consoleLog.style.color = 'var(--brand-cyan)';

  // Reset inputs
  nameInput.value = '';
  priceInput.value = '';
  stockInput.value = '';

  updateSimulatorUI();
  renderSimulatorQuickSells();
}

function resetSimulator() {
  initSimulatorData();
  const consoleLog = document.getElementById('sim-console-log');
  consoleLog.innerText = `✔ Simulador reiniciado a valores iniciales.`;
  consoleLog.style.color = 'var(--text-muted-dark)';
}
