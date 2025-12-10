# 🍔 Frontend - Sistema de Gestión de Restaurante

Single Page Application (SPA) moderna desarrollada en **Angular 17+**, diseñada para ofrecer una experiencia fluida e interactiva para clientes y personal del restaurante. Utiliza componentes **Standalone**, inyección de dependencias funcional y **WebSockets** para actualizaciones en tiempo real.

## 🚀 Características Principales

* **Arquitectura Moderna:** Uso de **Standalone Components** (sin NgModules) y la nueva sintaxis de Control Flow (`@if`, `@for`).
* **Roles de Usuario Dinámicos:**
    * **Cliente:** Menú interactivo, carrito de compras y seguimiento de pedidos en tiempo real.
    * **Admin/Staff:** Tableros de control para gestión de órdenes, menú y personal.
* **Tiempo Real (WebSockets):** Conexión directa con el backend para recibir notificaciones instantáneas (ej. "Orden Lista" o "Nueva Comanda").
* **UI/UX Responsiva:** Diseño adaptable utilizando **Angular Material** y **Bootstrap**.
* **Gestión de Estado:** Manejo reactivo de datos con **RxJS** y Signals.
* **Seguridad:** Interceptores HTTP para manejo de JWT y Guards para protección de rutas.

## 🛠️ Tecnologías

* **Framework:** Angular 17+
* **Lenguaje:** TypeScript
* **Estilos & UI:**
    * Angular Material (Componentes visuales)
    * Bootstrap 5 (Sistema de grillas y utilidades)
    * SCSS (Sass)
* **Comunicación:**
    * RxJS (Programación reactiva)
    * Socket.io-client / Websockets nativos
* **Notificaciones:** SweetAlert2
* **Iconos:** Material Icons

## 📋 Requisitos Previos

Asegúrate de tener instalado:
* **Node.js** (v18.13.0 o superior recomendado)
* **NPM** (Gestor de paquetes)
* **Angular CLI:** `npm install -g @angular/cli`


### 2\. Acceder

La aplicación estará disponible en: `http://localhost:4200` 

-----

## ⚙️ Instalación Manual

### 1\. Clonar el repositorio

```bash
git clone https://github.com/IngOscar19/Proyecto-FrontEnd-CommandAS.git
```

### 2\. Instalar dependencias

```bash
npm install
```

### 3\. Configurar entorno

Verifica el archivo `src/environments/environment.ts` (o `provider.service.ts`) para asegurar que la URL del backend es correcta:

```typescript
export const environment = {
    production: false,
    socketUrl: 'http://192.168.2.68:3000/'
}
```

### 4\. Ejecutar servidor de desarrollo

```bash
ng serve
```

*Abre tu navegador en `http://localhost:4200`.*

-----

## 📂 Estructura del Proyecto

```text
src/
├── app/
│   ├── components/      # Componentes reutilizables (Navbar, Cards, etc.)
│   ├── interfaces/      # Modelos de datos TypeScript (User, Product, Order)
│   ├── pages/           # Vistas principales (Login, Menú, Dashboard, ClientOrders)
│   │   ├── admin/       # Vistas protegidas de administración
│   │   └── client/      # Vistas públicas/privadas de cliente
│   ├── services/        # Lógica de negocio y comunicación API
│   │   ├── auth.service.ts
│   │   ├── order.service.ts
│   │   ├── web-sockets.service.ts
│   │   └── ...
│   ├── guards/          # Protección de rutas
│   └── app.routes.ts    # Configuración de rutas (Router)
├── assets/              # Imágenes (Hamburguesas, Snacks, Logos)
└── styles.scss          # Estilos globales y temas de Material
```

##  Solución de Problemas Comunes

**No conecta con el Backend:**

  * Verifica que el Backend PHP esté corriendo en el puerto 8000.
  * Revisa la consola del navegador (F12) por errores de CORS.

**Error en WebSockets:**

  * Asegúrate de que el script de sockets (`server.php`) en el backend esté activo.
  * Verifica que la URL del socket en `web-sockets.service.ts` coincida con la del servidor.



-----

## ✒️ Autor

Desarrollado por **Oscar Martin Espinosa Romero** - 2025.

```
```