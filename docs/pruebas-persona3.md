# AutoNova - Pruebas de integracion y seguridad

## 1. Objetivo

Verificar el funcionamiento de la base de datos PostgreSQL
con el backend Express y el servidor Nginx, ademas de
comprobar la vulnerabilidad IDOR seleccionada en el proyecto.

## 2. Entorno de pruebas

- Sistema: AutoNova
- Base de datos: PostgreSQL 16
- Backend: Express.js
- Servidor web: Nginx
- Contenedores: Docker Compose
- Direccion: http://localhost
- Entorno: laboratorio local

## 3. Pruebas de integracion

### 3.1. Conexion con el backend

Endpoint: GET /api/health

Resultado: el servidor respondio con status "ok".

### 3.2. Consulta de productos

Endpoint: GET /api/productos

Resultado: se obtuvieron correctamente los cuatro
automoviles registrados en PostgreSQL.

### 3.3. Autenticacion

Endpoint: POST /api/auth/login

Resultado: el Comprador Demo 1 y el Comprador Demo 2
pudieron autenticarse correctamente.

### 3.4. Generacion de factura

Endpoint: POST /api/facturas

Usuario: Comprador Demo 2
Producto: Hatchback urbano
Cantidad: 1

Subtotal: $14,900.00
IVA (13%): $1,937.00
Total: $16,837.00

ID de factura:
e6a6017c-d7f2-49d2-a78b-01b0db8a3a91

Resultado: la factura y su detalle se almacenaron
correctamente en PostgreSQL.

El stock del Hatchback urbano disminuyo de 5 a 4.

### 3.5. Verificacion de registros

Registros finales en la base de datos local:

- Usuarios: 4
- Productos: 4
- Facturas: 3
- Detalles de factura: 4

## 4. Prueba de vulnerabilidad IDOR

Archivo: app/src/routes/facturas.js
Endpoint: GET /api/facturas/:id

### Descripcion

La ruta exige autenticacion, pero no verifica que
la factura solicitada pertenezca al usuario autenticado.

### Procedimiento

1. Se inicio sesion como Comprador Demo 2.
2. Se consultaron sus facturas mediante GET /api/facturas.
3. Se obtuvo su factura por un total de $30,397.00.
4. Con la misma sesion se solicito la factura del Comprador
   Demo 1 utilizando su identificador UUID.
5. El servidor devolvio los datos del Comprador Demo 1,
   incluyendo su nombre, correo y total de $56,161.00.

### Resultado

La vulnerabilidad IDOR fue reproducida correctamente
en el entorno local del proyecto.

### Impacto

Un comprador autenticado puede consultar informacion
de facturas de otros compradores sin autorizacion.

### Mitigacion

Verificar que el cliente_id de la factura corresponda
al identificador del usuario autenticado antes de
devolver la informacion.

## 5. Evidencias

Se conservaran las capturas originales de PowerShell
que demuestran la autenticacion, la consulta indebida
de facturas y las pruebas de integracion.

No se deben incluir contrasenas ni tokens JWT en
las capturas publicadas.

## 6. Conclusion

Las pruebas realizadas confirmaron que PostgreSQL,
Express y Nginx funcionan correctamente para las
operaciones evaluadas. Tambien se comprobo que
AutoNova genera facturas, calcula el IVA y actualiza
el inventario. Finalmente, se reprodujo la
vulnerabilidad IDOR prevista en la propuesta del proyecto.
