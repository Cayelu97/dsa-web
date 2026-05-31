# DSA - Sitio Web de Soluciones Ágiles & CRM Local

Este proyecto es un sitio web completo, dinámico y responsivo para **DSA (Diseño de Soluciones Ágiles)**. Permite mostrar tu catálogo de sistemas en la nube, capturar clientes potenciales, simular operaciones comerciales en vivo e integrar un panel de control administrativo que funciona como la base de tu futuro CRM.

---

## 🚀 Características Principales

1. **Catálogo de Productos Dinámico**:
   - Los productos se cargan dinámicamente desde el backend.
   - Filtros dinámicos por categorías (Sistemas Cloud, Automatizaciones, Servicios).
   - Cada producto cuenta con un badge de estado (Activo, Beta, Desarrollo) y lista de características.

2. **Carrito de Compras Integrado a WhatsApp**:
   - Los visitantes pueden añadir múltiples sistemas o servicios al carrito.
   - Al finalizar, el sistema registra la consulta en el CRM y genera un mensaje estructurado para enviarte el pedido directamente a tu WhatsApp.

3. **Simulador de Kiosco Interactivo**:
   - Integrado en la página principal para que los clientes prueben en tiempo real cómo funciona un sistema de DSA.
   - Permite registrar ventas, añadir stock de productos y emite alertas visuales de stock bajo.

4. **Calculadora de Productividad**:
   - Calcula el ahorro mensual estimado al digitalizar el negocio basándose en horas de control, pérdidas y costo por hora laboral.

5. **Panel de Administración Autoadministrable (`/admin.html`)**:
   - **Gestor de Catálogo**: Crear, editar y eliminar productos con un formulario modal (incluyendo editor de características).
   - **Configurador Web**: Cambiar el teléfono de WhatsApp de destino, email de soporte, redes sociales (Instagram, LinkedIn, Facebook) y textos del Hero en tiempo real sin tocar código.
   - **CRM Local de Leads**: Registro en tiempo real de todos los interesados. Permite cambiar el estado comercial (*Nuevo*, *En Contacto*, *Venta Cerrada*, *Descartado*) y eliminar registros.
   - **Seguridad**: Protegido por un PIN de seguridad (configurable en el panel).

---

## 📂 Estructura del Proyecto

```text
webdsa/
├── data/
│   ├── products.json      # Base de datos local de productos
│   ├── config.json        # Configuraciones dinámicas de la web y PIN de seguridad
│   └── leads.json         # Base de datos de contactos y pedidos (CRM)
├── public/
│   ├── css/
│   │   └── styles.css     # Estilos premium (modo oscuro, glow, animaciones)
│   ├── js/
│   │   ├── app.js         # Lógica de usuario, carrito y simulador
│   │   └── admin.js       # Lógica del panel administrativo y CRM
│   ├── index.html         # Portal público de ventas
│   └── admin.html         # Panel de administración
├── server.js              # Servidor Express API
├── package.json           # Dependencias del proyecto (express, cors)
└── README.md              # Este archivo de documentación
```

---

## 💻 Ejecución Local

### 1. Requisitos
- Tener instalado [Node.js](https://nodejs.org/) (versión 16 o superior recomendada).

### 2. Instalación de Dependencias
Abre tu terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 3. Iniciar el Servidor
Ejecuta el siguiente comando para levantar el servidor web:
```bash
npm start
```
El servidor comenzará a correr en: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Acceso al Panel de Administración

Para gestionar los productos y ver tus leads en el CRM:
1. Ve a [http://localhost:3000/admin.html](http://localhost:3000/admin.html) (o haz clic en el icono de engranaje en la esquina superior derecha del sitio web).
2. Introduce el PIN de seguridad predeterminado:
   - **PIN por defecto**: `dsa123`
3. Puedes cambiar este PIN en cualquier momento desde la pestaña **Configuración del Sitio** dentro del mismo panel.

---

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js & Express.
- **Frontend**: HTML5 & Javascript Moderno (ES6+).
- **Estilos**: Vanilla CSS con Custom Properties para transiciones y animaciones premium en modo oscuro.
- **Iconografía**: Font Awesome 6.
- **Base de Datos**: Archivos JSON locales estructurados con operaciones asíncronas seguras (`fs.promises`).
