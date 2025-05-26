# Cocha Flight Scraper

Este proyecto contiene scripts para buscar y extraer información de vuelos desde Cocha.com.

## Archivos

- `index.js`: Script principal que busca vuelos de solo ida desde Santiago a Puerto Montt con 20 días de anticipación.
- `url_directa.js`: Script alternativo que navega directamente a la URL de resultados usando los códigos de aeropuerto.

## Requisitos

- Node.js (versión 14 o superior)
- npm o yarn

## Instalación

1. Clona este repositorio o descarga los archivos
2. Instala las dependencias:

```bash
npm install puppeteer
```

## Uso

### Método 1: Búsqueda (a través del formulario)

Para realizar una búsqueda (desde la página de vuelos hasta la redireccion):

```bash
node index.js
```

Este script:
1. Abre la página de vuelos de Cocha
2. Selecciona "Solo ida"
3. Ingresa "Puerto Montt" como destino
4. Selecciona una fecha 20 días en el futuro
5. Hace clic en "Buscar"
6. Abre redirige a la URL para los resultados de los datos ingresados


### Método 2: Acceso Directo a Resultados

Para acceder directamente a la página de resultados usando los códigos de aeropuerto:

```bash
node url_directa.js
```

Este script:
1. Navega directamente a la URL de resultados utilizando codigos IATA para los Aeropuertos
2. Utiliza una fecha en formato YYYY-MM-DD
3. Extrae la información de vuelos
4. Guarda los resultados en `resultados_vuelos_directos.json`

## Códigos de Aeropuerto

Los principales códigos de aeropuerto utilizados son:
- SCL: Aeropuerto Internacional Arturo Merino Benítez (Santiago)
- PMC: Aeropuerto El Tepual (Puerto Montt)
- BBA: Aeropuerto Balmaceda (Balmaceda)
## Resultados

Los resultados se guardan en varios archivos:
- `resultados_vuelos_directos.json`: Datos estructurados de los vuelos
- `resultados_directos.png`: Captura de pantalla de resultados del método directo

## Estructura de datos

Los datos extraídos incluyen (cuando están disponibles):
- Precio
- Aerolínea
- Horario
- Duración
- Escalas
- Texto completo (para diagnóstico)
