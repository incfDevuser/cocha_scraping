import puppeteer from "puppeteer";

async function buscarVuelos() {
  console.log("Iniciando búsqueda de vuelos...");
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 250,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  
  try {
    console.log("Navegando a Cocha.com/vuelos...");
    await page.goto("https://www.cocha.com/vuelos", { waitUntil: "networkidle2" });
    
    console.log("Esperando que cargue la página...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("Seleccionando 'Solo ida'...");
    try {
      const soloIdaClicado = await page.evaluate(() => {
        const soloIdaButton = document.querySelector('#option-search-flight-oneway');
        if (soloIdaButton) {
          soloIdaButton.click();
          return true;
        }
        
        const soloIdaTexto = Array.from(document.querySelectorAll('div[role="button"], div.tabs')).find(
          el => el.textContent.trim() === 'Solo ida'
        );
        if (soloIdaTexto) {
          soloIdaTexto.click();
          return true;
        }
        
        return false;
      });
      
      if (!soloIdaClicado) {
        console.log("No se pudo encontrar 'Solo ida' con evaluate, intentando con XPath...");
        await page.click('div.tabs:nth-child(2), div[role="button"]:nth-of-type(2)').catch(() => {
          console.log("Intentando click directo en la posición estimada de 'Solo ida'...");
          return page.mouse.click(500, 200);
        });
      }
    } catch (soloIdaError) {
      console.error("Error al seleccionar 'Solo ida':", soloIdaError);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Ingresando destino: Puerto Montt...");
    try {
      const destinoInputID = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[placeholder="Ingresa destino"]'));
        return inputs.length > 0 ? inputs[0].id : 'cx-input-75';
      });
      
      console.log(`Campo de destino identificado: ${destinoInputID}`);
      await page.waitForSelector(`#${destinoInputID}`, { visible: true, timeout: 5000 });
      await page.click(`#${destinoInputID}`, { delay: 300 });
      await page.type(`#${destinoInputID}`, "Puerto Montt", { delay: 100 });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const destinoSeleccionado = await page.evaluate(() => {
        const divDestination = document.querySelector('.d-flex.flex-column.destination');
        if (divDestination) {
          const divPointer = divDestination.querySelector('.d-flex.flex-column.pointer');
          if (divPointer) {
            divPointer.click();
            return { method: 'estructura-exacta', success: true };
          }
        }
        
        const elementosConPMC = Array.from(document.querySelectorAll('*')).filter(
          el => el.textContent && el.textContent.includes('Puerto Montt') && el.textContent.includes('PMC')
        );
        
        if (elementosConPMC.length > 0) {
          let elemento = elementosConPMC[0];
          for (let i = 0; i < 5; i++) {
            if (elemento.classList && 
                (elemento.classList.contains('pointer') || 
                 elemento.classList.contains('destination') || 
                 elemento.classList.contains('d-flex'))) {
              elemento.click();
              return { method: 'texto-pmc', success: true };
            }
            if (!elemento.parentElement) break;
            elemento = elemento.parentElement;
          }
        }
        
        const strongPuertoMontt = Array.from(document.querySelectorAll('strong')).find(
          el => el.textContent && el.textContent.includes('Puerto Montt')
        );
        
        if (strongPuertoMontt) {
          let elementoClickeable = strongPuertoMontt;
          for (let i = 0; i < 5; i++) {
            if (elementoClickeable.classList && 
                (elementoClickeable.classList.contains('pointer') || 
                 elementoClickeable.parentElement.classList.contains('pointer'))) {
              elementoClickeable.click();
              return { method: 'strong-puerto-montt', success: true };
            }
            if (!elementoClickeable.parentElement) break;
            elementoClickeable = elementoClickeable.parentElement;
          }
          
          elementoClickeable = strongPuertoMontt.closest('div.d-flex') || 
                               strongPuertoMontt.closest('div[class*="pointer"]') || 
                               strongPuertoMontt.closest('div.destination');
          
          if (elementoClickeable) {
            elementoClickeable.click();
            return { method: 'closest-div', success: true };
          }
        }
        
        const destinationElements = document.querySelectorAll('.destination, .autocomplete-container div.pointer, div.d-flex.flex-column.pointer');
        if (destinationElements.length > 0) {
          destinationElements[0].click();
          return { method: 'cualquier-destino', success: true };
        }
        
        return { method: 'ninguno', success: false };
      });
      
      console.log(`Selección de destino: método=${destinoSeleccionado.method}, éxito=${destinoSeleccionado.success}`);
      
      if (!destinoSeleccionado.success) {
        console.log("No se pudo seleccionar destino mediante JavaScript, intentando con teclado...");
        await page.keyboard.press("ArrowDown");
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.keyboard.press("Enter");
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const destinoConfirmado = await page.evaluate((destinoInputID) => {
        const input = document.getElementById(destinoInputID);
        return input ? input.value.includes('Puerto Montt') : false;
      }, destinoInputID);
      
      if (!destinoConfirmado) {
        console.log("Verificación de destino falló, intentando un último método...");
        const inputBounds = await page.evaluate((id) => {
          const element = document.getElementById(id);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.bottom + 50
          };
        }, destinoInputID);
        
        if (inputBounds) {
          await page.mouse.click(inputBounds.x, inputBounds.y);
        } else {
          await page.mouse.click(683, 350);
        }
      }
    } catch (destinoError) {
      console.error("Error al seleccionar destino:", destinoError);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Seleccionando fecha de viaje (20 días en el futuro)...");
    try {
      const fechaInputID = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[placeholder="Ida"][readonly]'));
        return inputs.length > 0 ? inputs[0].id : 'cx-input-76';
      });
      
      console.log(`Campo de fecha identificado: ${fechaInputID}`);
      await page.waitForSelector(`#${fechaInputID}`, { visible: true, timeout: 5000 });
      await page.click(`#${fechaInputID}`, { delay: 300 });
      
      console.log("Esperando a que aparezca el calendario...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fechaActual = new Date();
      const fechaObjetivo = new Date(fechaActual);
      fechaObjetivo.setDate(fechaActual.getDate() + 20);
      
      const diaObjetivo = fechaObjetivo.getDate();
      const mesObjetivo = fechaObjetivo.getMonth() + 1;
      const añoObjetivo = fechaObjetivo.getFullYear();
      
      console.log(`Fecha objetivo: ${diaObjetivo}/${mesObjetivo}/${añoObjetivo}`);
      
      const mesActual = await page.evaluate(() => {
        const headerMes = document.querySelector('.month-year-container p');
        return headerMes ? headerMes.textContent.trim() : '';
      });
      
      console.log(`Mes actual en calendario: ${mesActual}`);
      
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 
                     'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      const mesActualIndex = meses.findIndex(m => mesActual.includes(m));
      
      let necesitaNavegar = false;
      if (mesActualIndex !== -1) {
        if (mesActualIndex + 1 < mesObjetivo) {
          necesitaNavegar = true;
        } 
        else if (mesActualIndex === 11 && mesObjetivo === 1) {
          necesitaNavegar = true;
        }
      }
      
      if (necesitaNavegar) {
        console.log("Navegando al siguiente mes...");
        const nextMonthButton = await page.$("#btn-next-month");
        if (nextMonthButton) {
          await nextMonthButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log("Botón de siguiente mes no encontrado, intentando con selector alternativo...");
          const otroBotonSiguiente = await page.$(".mat-calendar-next-button");
          if (otroBotonSiguiente) {
            await otroBotonSiguiente.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      console.log("Buscando y seleccionando fecha disponible...");
      const fechaSeleccionada = await page.evaluate((targetDay) => {
        const botonesDisponibles = Array.from(document.querySelectorAll('button.mat-calendar-body-cell:not(.mat-calendar-body-disabled)'));
        
        if (botonesDisponibles.length === 0) {
          return { success: false, message: 'No se encontraron fechas disponibles' };
        }
        
        const botonDiaExacto = botonesDisponibles.find(btn => {
          const texto = btn.textContent.trim();
          return texto === String(targetDay);
        });
        
        if (botonDiaExacto) {
          botonDiaExacto.click();
          return { success: true, message: `Seleccionado día exacto: ${targetDay}`, method: 'dia-exacto' };
        }
        
        const numeroDias = botonesDisponibles.map(btn => {
          const texto = btn.textContent.trim();
          return parseInt(texto, 10);
        }).filter(num => !isNaN(num));
        
        if (numeroDias.length > 0) {
          const diaMasCercano = numeroDias.reduce((prev, curr) => 
            Math.abs(curr - targetDay) < Math.abs(prev - targetDay) ? curr : prev
          );
          
          const botonMasCercano = botonesDisponibles.find(btn => 
            btn.textContent.trim() === String(diaMasCercano)
          );
          
          if (botonMasCercano) {
            botonMasCercano.click();
            return { success: true, message: `Seleccionado día cercano: ${diaMasCercano}`, method: 'dia-cercano' };
          }
        }
        
        const indice = Math.min(Math.floor(botonesDisponibles.length / 2) + 5, botonesDisponibles.length - 1);
        botonesDisponibles[indice].click();
        return { 
          success: true, 
          message: `Seleccionada fecha alternativa: ${botonesDisponibles[indice].textContent.trim()}`, 
          method: 'cualquier-fecha' 
        };
      }, diaObjetivo);
      
      console.log(`Selección de fecha: ${fechaSeleccionada.message} (método: ${fechaSeleccionada.method})`);
      
      if (!fechaSeleccionada.success) {
        console.log("No se pudo seleccionar fecha, intentando con el botón Aplicar...");
        const botonAplicar = await page.$("button:has-text('Aplicar')");
        if (botonAplicar) {
          await botonAplicar.click();
        } else {
          const aplicarButton = await page.$("#btn-apply");
          if (aplicarButton) {
            await aplicarButton.click();
          } else {
            console.log("Botón Aplicar no encontrado, intentando con clicks en posiciones calculadas...");
            await page.keyboard.press("Escape");
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (fechaError) {
      console.error("Error al seleccionar fecha:", fechaError);
      
      console.log("Intentando método alternativo para seleccionar fecha...");
      try {
        const fechasDisponibles = await page.$$('button.mat-calendar-body-cell:not(.mat-calendar-body-disabled)');
        if (fechasDisponibles.length > 0) {
          const indice = Math.min(Math.floor(fechasDisponibles.length / 2), fechasDisponibles.length - 1);
          await fechasDisponibles[indice].click();
          console.log(`Seleccionada fecha alternativa en posición ${indice}`);
        } else {
          await page.keyboard.press("Escape");
          console.log("No se encontraron fechas disponibles, cerrando calendario");
        }
      } catch (backupError) {
        console.error("Error en método alternativo de selección de fecha:", backupError);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Buscando vuelos...");
    try {
      const buscarClicado = await page.evaluate(() => {
        const botonesTexto = Array.from(document.querySelectorAll('button, div[role="button"]')).filter(
          el => el.textContent && el.textContent.trim() === 'Buscar'
        );
        
        if (botonesTexto.length > 0) {
          botonesTexto[0].click();
          return true;
        }
        
        const botones = document.querySelectorAll('button.mat-button, button.primary, button.search-button');
        if (botones.length > 0) {
          botones[0].click();
          return true;
        }
        
        const spans = document.querySelectorAll('span.mat-mdc-button-touch-target');
        if (spans.length > 0) {
          const botonPadre = spans[0].closest('button');
          if (botonPadre) {
            botonPadre.click();
            return true;
          }
        }
        
        return false;
      });
      
      if (!buscarClicado) {
        console.log("No se pudo encontrar el botón de búsqueda con JavaScript, intentando clic directo...");
        await page.mouse.click(683, 500);
      }
    } catch (buscarError) {
      console.error("Error al hacer clic en buscar:", buscarError);
    }
    
    console.log("Esperando resultados...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const currentUrl = page.url();
    console.log(`URL actual: ${currentUrl}`);
    
    if (!currentUrl.includes('resultado/vuelos')) {
      console.log("No se detectó página de resultados, intentando navegar directamente...");
      
      const fechaVuelo = new Date();
      fechaVuelo.setDate(fechaVuelo.getDate() + 20);
      const fechaFormateada = `${fechaVuelo.getFullYear()}-${String(fechaVuelo.getMonth() + 1).padStart(2, '0')}-${String(fechaVuelo.getDate()).padStart(2, '0')}`;
      
      const urlResultados = `https://www.cocha.com/resultado/vuelos/SCL/PMC/${fechaFormateada}/1/Y?connector=Y&maxStops=5`;
      console.log(`Navegando directamente a: ${urlResultados}`);
      
      await page.goto(urlResultados, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const newUrl = page.url();
      console.log(`Nueva URL: ${newUrl}`);
    }
    
    if (page.url().includes('resultado/vuelos')) {
      console.log("Detectada página de resultados de vuelos. Extrayendo información...");
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await page.screenshot({ path: 'c:\\Users\\Martin\\Desktop\\cocha_scraping\\resultados.png', fullPage: true });
      console.log("Captura de pantalla guardada como 'resultados.png'");
      
      const vuelosInfo = await page.evaluate(() => {
        const tarjetasVuelos = document.querySelectorAll('.flight-card, .flight-result, .flight-item, [data-test^="flight"], [class*="flight"]');
        
        if (tarjetasVuelos.length > 0) {
          console.log(`Encontradas ${tarjetasVuelos.length} tarjetas de vuelo`);
          return Array.from(tarjetasVuelos).map(vuelo => {
            const precioElement = vuelo.querySelector('[class*="price"], [data-test*="price"], span:contains("CLP"), span:contains("$")');
            const precio = precioElement ? precioElement.textContent.trim() : 'Precio no encontrado';
            
            const aerolineaElement = vuelo.querySelector('[class*="airline"], [data-test*="airline"], img[alt*="airline"], [class*="carrier"]');
            const aerolinea = aerolineaElement ? 
                             (aerolineaElement.alt || aerolineaElement.title || aerolineaElement.textContent).trim() : 
                             'Aerolínea no encontrada';
            
            const horarioElement = vuelo.querySelector('[class*="time"], [data-test*="time"], [class*="hour"], [class*="depart"]');
            const horario = horarioElement ? horarioElement.textContent.trim() : 'Horario no encontrado';
            
            const duracionElement = vuelo.querySelector('[class*="duration"], [data-test*="duration"], [class*="flight-time"]');
            const duracion = duracionElement ? duracionElement.textContent.trim() : 'Duración no encontrada';
            
            const escalasElement = vuelo.querySelector('[class*="stop"], [data-test*="stop"], [class*="connection"]');
            const escalas = escalasElement ? escalasElement.textContent.trim() : 'Información de escalas no encontrada';
            
            return {
              precio,
              aerolinea,
              horario,
              duracion,
              escalas
            };
          });
        }
        
        const posiblesVuelos = Array.from(document.querySelectorAll('div'))
          .filter(el => {
            const texto = el.textContent.toLowerCase();
            return (texto.includes('clp') || texto.includes('$')) && 
                   (texto.includes('latam') || texto.includes('sky') || 
                    texto.includes('jetsmart') || texto.includes('airlines')) &&
                   (texto.includes('hr') || texto.includes('min'));
          });
        
        if (posiblesVuelos.length > 0) {
          return posiblesVuelos.map(el => {
            const textoCompleto = el.textContent.trim();
            
            const precioMatch = textoCompleto.match(/CLP\s*[\d\.]+|[^a-zA-Z]\$\s*[\d\.]+/i);
            const precio = precioMatch ? precioMatch[0].trim() : 'Precio no encontrado';
            
            const aerolineas = ['LATAM', 'Sky', 'JetSmart', 'Airlines'];
            const aerolineaMatch = aerolineas.find(a => textoCompleto.includes(a));
            const aerolinea = aerolineaMatch || 'Aerolínea no encontrada';
            
            const duracionMatch = textoCompleto.match(/\d+\s*h\s*\d*\s*m|\d+\s*hr|\d+\s*min/i);
            const duracion = duracionMatch ? duracionMatch[0].trim() : 'Duración no encontrada';
            
            return {
              contenidoCompleto: textoCompleto,
              precio,
              aerolinea,
              duracion
            };
          });
        }
        
        return Array.from(document.querySelectorAll('div'))
          .filter(el => {
            const texto = el.textContent;
            return texto.includes('CLP') || texto.includes('$');
          })
          .slice(0, 10)
          .map(el => ({
            contenido: el.textContent.trim(),
            html: el.innerHTML.substring(0, 200) + '...'
          }));
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
        try {
          await fs.writeFile(
            'c:\\Users\\Martin\\Desktop\\cocha_scraping\\resultados_vuelos.json', 
            JSON.stringify(vuelosInfo, null, 2)
          );
          console.log("Resultados guardados en 'resultados_vuelos.json'");
        } catch (writeError) {
          console.error("Error al guardar resultados:", writeError);
        }
      } else {
        console.log("No se encontraron vuelos en la página de resultados.");
      }
    } else {
      console.log("No se detectó la página de resultados de vuelos. URL actual:", currentUrl);
      console.log("Intentando extraer cualquier información relevante...");
      
      const vuelosInfo = await page.evaluate(() => {
        const vuelos = Array.from(document.querySelectorAll('.flight-card, .flight-result, .flight-item, [data-test="flight-card"]'));
        
        if (vuelos.length === 0) {
          const posiblesVuelos = Array.from(document.querySelectorAll('div')).filter(el => 
            el.textContent.includes('CLP') || 
            el.textContent.includes('$') || 
            el.textContent.toLowerCase().includes('latam') ||
            el.textContent.toLowerCase().includes('sky') ||
            el.textContent.toLowerCase().includes('jetsmart')
          );
          
          return posiblesVuelos.map(el => ({
            contenido: el.textContent.trim(),
            html: el.innerHTML.substring(0, 200) + '...'
          }));
        }
        
        return vuelos.map(vuelo => {
          return {
            precio: vuelo.querySelector('.price, [data-test="price"]')?.textContent.trim() || 'Precio no encontrado',
            aerolinea: vuelo.querySelector('.airline, [data-test="airline"]')?.textContent.trim() || 'Aerolínea no encontrada',
            horario: vuelo.querySelector('.time, [data-test="time"]')?.textContent.trim() || 'Horario no encontrado',
            duracion: vuelo.querySelector('.duration, [data-test="duration"]')?.textContent.trim() || 'Duración no encontrada'
          };
        });
      });
    
      console.log("Información genérica encontrada:", vuelosInfo.length);
      console.log(vuelosInfo);
    }
    
    console.log("Manteniendo ventana abierta para inspección (30 segundos)...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error("Error durante la búsqueda:", error);
  } finally {
    console.log("Cerrando navegador...");
    await browser.close();
  }
}

buscarVuelos();
