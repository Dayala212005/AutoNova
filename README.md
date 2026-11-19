# AutoNova — Sistema web de ventas de automóviles

Proyecto académico de la UCA: aplicación web con vulnerabilidades controladas,
desplegada en un servidor Linux endurecido. Cubre tres competencias: desarrollo
web, administración/despliegue en servidores Linux, y seguridad ofensiva/defensiva.

---

## Tabla de contenido

1. [Descripción del proyecto y roles](#1-descripción-del-proyecto-y-roles)
2. [Arquitectura](#2-arquitectura)
3. [Guía de instalación y despliegue](#3-guía-de-instalación-y-despliegue)
4. [Usuarios y credenciales de prueba](#4-usuarios-y-credenciales-de-prueba)
5. [Vulnerabilidades implementadas](#5-vulnerabilidades-implementadas)
6. [Flujo de trabajo en GitHub](#6-flujo-de-trabajo-en-github)

---

## 1. Descripción del proyecto y roles

**AutoNova** es el sistema web de ventas de una agencia de automóviles ficticia.
Permite a los clientes explorar un catálogo y generar facturas de compra, a los
vendedores cargar productos, y a un superadministrador gestionar usuarios y
productos.

| Rol | Acceso | Qué puede hacer |
|---|---|---|
| Visitante (no logueado) | Público | Ver el catálogo (Index), iniciar sesión (Login), registrarse (Register) |
| Cliente / comprador | Autenticado | Seleccionar productos y generar una factura con el detalle de la compra |
| Vendedor | Autenticado | Cargar productos: nombre, descripción, precio, stock e imagen |
| Superadministrador | Autenticado | CRUD completo de productos y de usuarios; crea las cuentas de vendedores |

Todas las vistas restringidas por rol exigen autenticación previa.

---

## 2. Arquitectura

### 2.1 Tecnologías

| Componente | Tecnología | Versión usada |
|---|---|---|
| Sistema operativo | Ubuntu Server | 24.04.2 LTS (sin entorno gráfico) |
| Virtualización | VirtualBox | `	7.2.20` |
| Contenedores | Docker + Docker Compose | Docker 29.9.3 (build 5457199) / Docker Compose v5.7.0 |
| Servidor web / proxy | Nginx | `nginx:1.27-alpine` |
| Backend | Express.js (Node.js) | `node:20-alpine` |
| Base de datos | PostgreSQL | `postgres:16-alpine` |
| Frontend | HTML, CSS y JavaScript vanilla | — |
| Librerías del backend | `pg`, `bcryptjs`, `jsonwebtoken` (o `express-session`), `multer` | — |

### 2.2 Diagrama de arquitectura (texto)

```
                          Internet / Red del laboratorio
                                      │
                                      │  puerto 80 (único expuesto)
                                      ▼
                         ┌─────────────────────────┐
                         │   Contenedor: nginx      │
                         │   (nginx:1.27-alpine)    │
                         │   - sirve /frontend       │
                         │   - proxy /api/ → app     │
                         │   - sirve /uploads/        │
                         └───────────┬──────────────┘
                                     │ red "frontnet"
                                     ▼
                         ┌─────────────────────────┐
                         │   Contenedor: app         │
                         │   (Express.js, user node) │
                         │   puerto interno 3000      │
                         │   sin privilegios extra    │
                         └───────────┬──────────────┘
                                     │ red "backnet" (internal, sin salida)
                                     ▼
                         ┌─────────────────────────┐
                         │   Contenedor: db           │
                         │   (postgres:16-alpine)    │
                         │   puerto interno 5432       │
                         │   NO expuesto al exterior  │
                         └─────────────────────────┘

Volúmenes:
  - uploads: compartido entre app (escribe) y nginx (lee, solo lectura)
  - pgdata: datos persistentes de PostgreSQL
```

Solo Nginx publica un puerto hacia el exterior (80). Express y PostgreSQL
viven en redes internas de Docker y no son alcanzables directamente desde
fuera de la VM.

### 2.3 Diseño de la base de datos

| Tabla | Columnas principales |
|---|---|
| `usuarios` | `id` (PK), `nombre`, `email`, `password_hash`, `rol`, `creado_en` |
| `productos` | `id` (PK), `nombre`, `descripcion`, `precio`, `stock`, `imagen_url`, `vendedor_id` (FK), `creado_en` |
| `facturas` | `id` (PK, UUID), `cliente_id` (FK), `total`, `creada_en` |
| `factura_detalle` | `id` (PK), `factura_id` (FK), `producto_id` (FK), `cantidad`, `precio_unitario` |

Relaciones: un usuario (vendedor) publica varios productos; un usuario
(cliente) genera varias facturas; una factura contiene varios detalles, cada
uno referenciando un producto.

### 2.4 Estructura de carpetas

```
autonova/
├── .gitignore                  # excluye .env y node_modules/
├── .env.example                # plantilla de variables de entorno (sí va a GitHub)
├── .env                        # variables reales — NUNCA se sube a GitHub
├── docker-compose.yml          # orquesta nginx, app y db
├── README.md                   # este archivo
├── nginx/
│   └── default.conf            # configuración de Nginx (incluye vulnerabilidad de servidor)
├── app/                         # backend Express
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js               # punto de entrada
│   └── src/
│       ├── db.js               # conexión a PostgreSQL
│       ├── utils.js
│       ├── middleware/
│       │   ├── auth.js         # verificación de sesión/token
│       │   └── upload.js       # subida de archivos (multer)
│       └── routes/
│           ├── auth.js         # login y registro
│           ├── productos.js    # CRUD de productos + subida de imágenes
│           ├── facturas.js     # generar/consultar facturas (vulnerabilidad IDOR)
│           └── usuarios.js     # CRUD de usuarios (administrador)
├── db/
│   ├── init.sql                # creación de tablas (montado como 01-init.sql)
│   └── seed.sql                # usuarios y productos de prueba (montado como 02-seed.sql)
└── frontend/                    # HTML, CSS y JS vanilla
    └── index.html
```

---

## 3. Guía de instalación y despliegue

Esta guía asume que se parte de cero: una VM recién creada, hasta tener la
aplicación funcionando. Pensada para completarse dentro de los 30 minutos del
Laboratorio 4.

### 3.1 Crear la máquina virtual

1. **Descargar la ISO de Ubuntu Server** (no la de Desktop) desde
   `ubuntu.com/download/server`. Versión usada: **24.04.2 LTS**.
2. En VirtualBox, crear una VM nueva:
   - Tipo: Linux, versión: Ubuntu (64-bit).
   - Recursos: 2 vCPU, 2 GB RAM, 20–25 GB de disco (asignación dinámica).
   - **No marcar** "Proceed with Unattended Installation".
3. Red de la VM — dos adaptadores:

   | Adaptador | Conectado a | Para qué |
   |---|---|---|
   | Adaptador 1 | **NAT** | Acceso a internet (`apt`, Docker) |
   | Adaptador 2 | **Host-only (vboxnet0)** | SSH y navegador desde el host, solo en entorno de desarrollo |

   > En el Laboratorio 4, la red se configurará según lo que indique el
   > docente en el momento de la instalación (puede no haber acceso a
   > internet). Por eso, **las imágenes de Docker necesarias (`nginx`,
   > `node`, `postgres`) se incluyen ya descargadas dentro del repositorio**
   > en vez de depender de `docker pull` el día de la entrega (ver sección
   > 3.6).

4. Durante el instalador de Ubuntu Server:
   - Idioma: English. Continuar **sin actualizar el instalador** ("Continue
     without updating") si se ofrece.
   - Tipo de instalación: **Ubuntu Server** (no "minimized").
   - Red: dejar en DHCP por ahora.
   - Almacenamiento: **Use an entire disk**, **sin** marcar "Set up this disk
     as an LVM group" y **sin** cifrado LUKS.
   - Perfil: usuario `autonova` con una contraseña fuerte.
   - SSH: marcar **Install OpenSSH server**. Dejar **Allow password
     authentication over SSH** activo por ahora (se desactiva más adelante).
     No importar ninguna llave SSH en este paso.
   - Snaps destacados: no marcar ninguno.
5. Al terminar, expulsar la ISO (si VirtualBox no lo hace solo) y reiniciar.

### 3.2 Configuración inicial del sistema

Dentro de la VM (o por SSH una vez tenga red):

```bash
# Confirmar que no hay entorno gráfico instalado
dpkg -l | grep -E "ubuntu-desktop|gdm3|lightdm|sddm"   # no debe devolver nada

# Comprobar red (Adaptador 1 / NAT)
ip -4 a
ping -c 3 archive.ubuntu.com
```

Si el segundo adaptador (host-only) no tiene IP, crear su configuración de
red (ajustar `enp0s8` al nombre real que muestre `ip a`):

```bash
sudo nano /etc/netplan/60-hostonly.yaml
```
```yaml
network:
  version: 2
  ethernets:
    enp0s8:
      addresses: [192.168.56.20/24]
```
```bash
sudo chmod 600 /etc/netplan/60-hostonly.yaml
sudo netplan apply
ip -4 a
```

Actualizar el sistema e instalar paquetes base:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw curl git ca-certificates
sudo timedatectl set-timezone America/El_Salvador
```

**Snapshot recomendado:** `01-ubuntu-limpio`.

### 3.3 Instalar Docker y Docker Compose

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verificar:

```bash
sudo systemctl status docker --no-pager
sudo docker --version
sudo docker compose version
sudo docker run --rm hello-world
sudo systemctl is-enabled docker      # debe decir "enabled"
```

> **Decisión de seguridad:** el usuario `autonova` **no** se agrega al grupo
> `docker`. Todos los comandos de Docker en esta guía usan `sudo docker ...`,
> porque pertenecer a ese grupo equivale a tener privilegios de root sin
> contraseña ni registro en los logs de `sudo`.

**Snapshot recomendado:** `02-docker-listo`.

### 3.4 Clonar el repositorio

```bash
cd ~
git clone https://github.com/USUARIO/REPO.git autonova
cd autonova
```

> Se usa HTTPS (no SSH) para clonar en la VM, porque en el laboratorio no
> conviene dejar llaves ni tokens personales guardados en una máquina que
> otros compañeros alcanzarán por la red durante la etapa de ataque.

### 3.5 Configurar las variables de entorno

```bash
cp .env.example .env
openssl rand -hex 16    # usar el resultado como POSTGRES_PASSWORD
openssl rand -hex 32    # usar el resultado como JWT_SECRET
nano .env
chmod 600 .env
```

El `.env` debe quedar con estas variables (los valores de ejemplo deben
reemplazarse por los generados arriba):

```
POSTGRES_USER=autonova
POSTGRES_PASSWORD=<generado con openssl rand -hex 16>
POSTGRES_DB=autonova
JWT_SECRET=<generado con openssl rand -hex 32>
```

Comprobar que no falta ninguna variable respecto a la plantilla:

```bash
diff <(sed 's/=.*//' .env.example) <(sed 's/=.*//' .env)
```
(No debe imprimir nada.)

### 3.6 Levantar los servicios

Como no se puede garantizar que el Laboratorio 4 tenga acceso a internet,
las imágenes base (`nginx:1.27-alpine`, `node:20-alpine`,
`postgres:16-alpine`) se incluyen ya guardadas en el repositorio.
Antes de levantar los servicios, cargarlas en
Docker:

```bash
sudo docker load -i images/autonova-images.tar
```

Si en el entorno de instalación sí hay internet, este paso es opcional:
`docker compose up --build` descargaría las imágenes igual.

Levantar los servicios:

```bash
sudo docker compose up -d --build
```

Verificar que todo quedó arriba:

```bash
sudo docker compose ps
curl -I http://localhost
curl http://localhost/api/health
sudo ss -tlnp
```

- Los tres servicios (`nginx`, `app`, `db`) deben estar en `running`, con
  `db` en estado `healthy`.
- `curl -I http://localhost` debe responder `200 OK`.
- `curl http://localhost/api/health` debe responder `{"status":"ok"}`.
- `ss -tlnp` solo debe mostrar los puertos **22** (SSH) y **80** (Nginx)
  escuchando en `0.0.0.0`/`[::]`. Los puertos `53` que puedan aparecer son el
  resolvedor DNS local de Ubuntu y no son accesibles desde fuera.

Comprobar que la base de datos tiene las tablas y los datos de prueba:

```bash
sudo docker compose exec db psql -U autonova -d autonova -c '\dt'
sudo docker compose exec db psql -U autonova -d autonova -c 'SELECT id, email, rol FROM usuarios;'
```

### 3.7 Endurecimiento del servidor

**Firewall (`ufw`):**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status verbose
```

> `ufw` no controla los puertos que Docker publica directamente en
> `iptables`. La protección real contra exponer PostgreSQL o Express viene
> de que el `docker-compose.yml` nunca les asigna `ports:`, solo `expose:` en
> redes internas.

**SSH (solo con llave, sin root):**

Desde la máquina cliente (no en la VM), generar una llave dedicada y
copiarla:

```bash
ssh-keygen -t ed25519 -C "autonova-vm" -f ~/.ssh/id_ed25519_autonova
ssh-copy-id -i ~/.ssh/id_ed25519_autonova.pub autonova@192.168.56.20
ssh -i ~/.ssh/id_ed25519_autonova autonova@192.168.56.20   # probar antes de seguir
```

En la VM, una vez confirmado que la llave funciona:

```bash
sudo nano /etc/ssh/sshd_config.d/01-hardening.conf
```
```
PermitRootLogin no
PasswordAuthentication no
AllowUsers autonova
```
```bash
sudo sshd -t
sudo systemctl restart ssh
sudo sshd -T | grep -E "passwordauthentication|permitrootlogin|allowusers"
```

**Snapshot recomendado:** `03-ssh-ufw-endurecido`.

### 3.8 Límites de recursos de los contenedores

El `docker-compose.yml` incluye, para cada servicio: `logging` con rotación
(`max-size: 10m`, `max-file: 3`), `security_opt: no-new-privileges:true`,
`pids_limit` y `mem_limit`, además de `cap_drop: ALL` en el servicio `app`.
Esto evita que una vulnerabilidad no declarada (agotar memoria, procesos o
disco) afecte al sistema anfitrión. Ver el archivo `docker-compose.yml` para
los valores exactos.

### 3.9 Limpieza antes de la entrega

Antes de instalar en el Laboratorio 4 (o de entregar la VM), ejecutar:

```bash
cat ~/.ssh/authorized_keys     # revisar y quitar llaves que no deban quedar
history -c && cat /dev/null > ~/.bash_history
```

Confirmar también que no quedó ningún token de GitHub guardado
(`~/.git-credentials` no debería existir, porque se clona por HTTPS sin
guardar credenciales).

---

## 4. Usuarios y credenciales de prueba

Cargados automáticamente por `db/seed.sql` al crear la base de datos por
primera vez.

| Rol | Correo | Contraseña |
|---|---|---|
| Comprador 1 | `comprador1@autonova.test` | `Compra1-Local-2026!` |
| Comprador 2 | `comprador2@autonova.test` | `Compra2-Local-2026!` |
| Vendedor | `vendedor1@autonova.test` | `Venta1-Local-2026!` |
| Administrador | `admin1@autonova.test` | `Admin-Local-2026!` |

> Las contraseñas se guardan como hash (`bcrypt`) en la base de datos; las de
> esta tabla son las que se usaron en texto plano al generar `seed.sql`.

---

## 5. Vulnerabilidades implementadas

### 5.1 A nivel de código: IDOR (Insecure Direct Object Reference)

- **Dónde está:** `app/src/routes/facturas.js`, en la ruta que consulta el
  detalle de una factura (por ejemplo `GET /api/facturas/:id`).
- **Cómo se introdujo:** la ruta valida que exista una sesión o token
  válido, pero **no** valida que el `id` de la factura pertenezca al usuario
  autenticado. Cualquier cliente logueado puede sustituir el identificador
  en la URL y ver facturas de otros clientes.
- **Cómo se explota:**
  1. Iniciar sesión como cualquier cliente (por ejemplo `comprador1@autonova.test`).
  2. Generar o consultar una factura propia y anotar su `id` (son UUID).
  3. Solicitar `GET /api/facturas/<id-de-otro-cliente>` con la propia sesión
     activa. El sistema devuelve el detalle sin validar la pertenencia.
- **Impacto:** exposición de datos de compra de otros clientes (productos,
  montos, fecha).
- **Mitigación recomendada:** validar en el backend que `factura.cliente_id`
  coincida con el `id` del usuario autenticado antes de devolver el recurso.

### 5.2 A nivel de servidor: mala configuración del header Content-Type

- **Dónde está:** `nginx/default.conf`, bloque `location /uploads/`.
- **Cómo se introdujo:** a diferencia del resto del sitio (que sí incluye
  `X-Content-Type-Options: nosniff` en sus bloques `location`), el bloque
  `/uploads/` no define ese header. Nginx sirve cada archivo subido con el
  `Content-Type` que corresponde a su extensión, sin forzar al navegador a
  respetarlo estrictamente.
- **Cómo se complementa en el backend:** `app/src/middleware/upload.js`
  (con `multer`) guarda cada archivo subido con un **nombre aleatorio (UUID)
  y la extensión original**, pero solo valida el **tipo MIME declarado por
  el cliente** en la petición (`image/...`), no el contenido real del
  archivo. Esto permite subir un archivo con contenido HTML/script
  declarándolo como imagen.
- **Cómo se explota:**
  1. Autenticarse como vendedor.
  2. Subir, como "imagen" de un producto, un archivo `.html` con
     `<script>alert('XSS por Content-Type')</script>`, declarando el tipo
     MIME como `image/png` en la petición multipart.
  3. Abrir en el navegador la URL pública del archivo subido
     (`/uploads/<nombre-generado>.html`).
  4. El navegador ejecuta el script en vez de mostrarlo como texto o imagen,
     porque falta `nosniff` y el archivo se sirve con `Content-Type:
     text/html`.
- **Impacto:** ejecución de JavaScript arbitrario en el navegador de quien
  abra el archivo, en el origen del sitio de AutoNova (XSS almacenado vía
  archivo).
- **Mitigación recomendada:** agregar `X-Content-Type-Options: nosniff` en
  el bloque `/uploads/`, y validar en el backend el contenido real del
  archivo (no solo el MIME declarado) antes de aceptarlo.

---

## 6. Flujo de trabajo en GitHub

Se siguió GitFlow con las ramas:

- **`main`**: versión lista para producción/entrega.
- **`Develop`**: rama de integración (nota: en este repositorio se usa con
  mayúscula inicial; mantener ese nombre exacto en todos los comandos y
  Pull Requests).
- **`feature/*`**: una por funcionalidad, creada desde `Develop` e
  integrada de vuelta a `Develop` mediante Pull Request.
  Ejemplos usados en este proyecto: `feature/infra-docker`,
  `feature/backend-auth`, `feature/backend-productos`,
  `feature/backend-facturas`, `feature/backend-usuarios`,
  `feature/frontend-index`, `feature/frontend-registro`.
- **`release/*`**: creada desde `Develop` para preparar la entrega final
  (ajustes menores y documentación); se integra tanto a `main` como a
  `Develop`.
- **`hotfix/*`**: solo si se detecta un error en `main` después de la
  entrega; se crea desde `main` y se integra a `main` y a `Develop`.

**Reglas seguidas:**
- Los Pull Requests siempre van hacia `Develop` o `main`, nunca una
  `feature/*` se fusiona directamente a `main`.
- Los merges se hacen con **"Create a merge commit"** (no *squash*), para
  conservar el detalle de cada commit en el historial de evaluación.
- Commits frecuentes y descriptivos por cada cambio lógico (por ejemplo:
  "Agrega configuración base de Nginx", "Agrega límites de logs, procesos y
  memoria a los contenedores").

**Equipo:** Elotes Locos

**Integrantes:**
- `GISELA ELIZABETH RIVAS RIVERA 00016124`
- `FRANCISCO JOSE CARDONA MEJIA 00119123`
- `EMILY EUNICE ORELLANA MENDEZ 00147124`
- `DANIEL ALEXANDER AYALA ESCOBAR 00045824`

---

## Anexo: comandos de verificación rápida

Para comprobar el estado del proyecto en cualquier momento:

```bash
cd ~/autonova
sudo docker compose ps
curl -I http://localhost
curl http://localhost/api/health
sudo ufw status verbose
sudo sshd -T | grep -E "passwordauthentication|permitrootlogin"
nmap -sV -p- 192.168.56.20   # ejecutar desde fuera de la VM
```
