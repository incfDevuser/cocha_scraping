import puppeteer from "puppeteer";

async function buscarVuelosDirecto() {
  console.log("Iniciando búsqueda directa de vuelos...");
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 250,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  
  try {
    const fechaVuelo = new Date();
    fechaVuelo.setDate(fechaVuelo.getDate() + 20);
    const fechaFormateada = `${fechaVuelo.getFullYear()}-${String(fechaVuelo.getMonth() + 1).padStart(2, '0')}-${String(fechaVuelo.getDate()).padStart(2, '0')}`;
    const urlResultados = `https://www.cocha.com/resultado/vuelos/SCL/PMC/${fechaFormateada}/1/Y?connector=Y&maxStops=5`;
    
    console.log(`Navegando directamente a: ${urlResultados}`);
    await page.goto(urlResultados, { waitUntil: "networkidle2", timeout: 60000 });
    console.log("Esperando a que se carguen los resultados...");
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log("Extrayendo información de vuelos...");
    const vuelosInfo = await page.evaluate(() => {
      const tarjetasVuelos = document.querySelectorAll('trip-box .card');
      
      if (tarjetasVuelos.length > 0) {
        return Array.from(tarjetasVuelos).map(vuelo => {
          const precioElement = vuelo.querySelector('.main-price');
          const precio = precioElement ? precioElement.textContent.trim() : 'Precio no encontrado';
          const logoElement = vuelo.querySelector('.logo img');
          const aerolinea = logoElement ? logoElement.getAttribute('alt') : 'Aerolínea no encontrada';
          const horaSalidaElement = vuelo.querySelector('.hour p:first-child');
          const horaLlegadaElement = vuelo.querySelector('.hour p:last-child');
          const horaSalida = horaSalidaElement ? horaSalidaElement.textContent.trim() : 'No disponible';
          const horaLlegada = horaLlegadaElement ? horaLlegadaElement.textContent.trim() : 'No disponible';
          
          const origenElement = vuelo.querySelector('.origin .code');
          const destinoElement = vuelo.querySelector('.destination .code');
          const origen = origenElement ? origenElement.textContent.trim() : 'No disponible';
          const destino = destinoElement ? destinoElement.textContent.trim() : 'No disponible';
          const duracionElement = vuelo.querySelector('.baggage p');
          const duracion = duracionElement ? duracionElement.textContent.replace('Duración:', '').trim() : 'No disponible';
          const tipoVueloElement = vuelo.querySelector('.hour span');
          const tipoVuelo = tipoVueloElement ? tipoVueloElement.textContent.trim() : 'No especificado';
          const tieneEquipaje = vuelo.querySelector('.mat-icon-no-color.text-green-1[data-mat-icon-type="font"][aria-hidden="true"]');
          const equipajeIncluido = tieneEquipaje ? 'Sí' : 'No';
          const esRecomendado = vuelo.classList.contains('highlighted') || 
                               (vuelo.querySelector('.highlighted-header') !== null);
          return {
            precio,
            aerolinea,
            origen,
            destino,
            horaSalida,
            horaLlegada,
            duracion,
            tipoVuelo,
            equipajeIncluido,
            esRecomendado: esRecomendado ? 'Sí' : 'No'
          };
        });
      }
      const matrizAerolineas = document.querySelector('airline-matrix');
      if (matrizAerolineas) {
        const aerolineasPrecios = [];
        const boxesAerolineas = matrizAerolineas.querySelectorAll('.box-airline');
        boxesAerolineas.forEach(box => {
          const logoElement = box.querySelector('.airline img');
          const aerolinea = logoElement ? logoElement.getAttribute('alt') : 'Desconocida';
          const precioDirectoElement = box.querySelector('.economy .price span, .price:first-of-type span');
          const precioDirecto = precioDirectoElement ? precioDirectoElement.textContent.trim() : '-';
          const precioEscalasElement = box.querySelector('.price:not(:first-of-type) span');
          const precioEscalas = precioEscalasElement ? precioEscalasElement.textContent.trim() : '-';
          
          aerolineasPrecios.push({
            aerolinea,
            precioDirecto,
            precioEscalas
          });
        });
        return aerolineasPrecios;
      }
      return [];
    });
    
    console.log(`Vuelos encontrados: ${vuelosInfo.length}`);
    
    if (vuelosInfo.length > 0) {
      console.log("\n===== INFORMACIÓN DE VUELOS =====");
      vuelosInfo.forEach((vuelo, index) => {
        console.log(`\n--- Vuelo #${index + 1} ---`);
        for (const [key, value] of Object.entries(vuelo)) {
          console.log(`${key}: ${value}`);
        }
      });
      const fs = await import('fs/promises');
      await fs.writeFile(
        'c:\\Users\\Martin\\Desktop\\cocha_scraping\\resultados_vuelos_directos.json', 
        JSON.stringify(vuelosInfo, null, 2)
      );
      console.log("Resultados guardados en 'resultados_vuelos_directos.json'");
    } else {
      console.log("No se encontraron vuelos en la página de resultados.");
      const htmlContent = await page.content();
      const fs = await import('fs/promises');
      await fs.writeFile(
        'c:\\Users\\Martin\\Desktop\\cocha_scraping\\pagina_respuesta.html',
        htmlContent
      );
      console.log("HTML de la página guardado en 'pagina_respuesta.html' para depuración");
    }
    await page.screenshot({ path: 'c:\\Users\\Martin\\Desktop\\cocha_scraping\\resultados_directos.png', fullPage: true });
    console.log("Captura de pantalla guardada como 'resultados_directos.png'");
    console.log("Manteniendo ventana abierta para inspección (30 segundos)...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error("Error durante la búsqueda directa:", error);
  } finally {
    console.log("Cerrando navegador...");
    await browser.close();
  }
}

buscarVuelosDirecto();
