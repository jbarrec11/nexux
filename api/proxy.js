export default async function handler(request, response) {
  const { wm = 'q7k3D', gender, country, region, limit = 30, offset = 0 } = request.query;
  
  // URL base de la API de Chaturbate (pedimos el máximo permitido: 500)
  let apiUrl = `https://chaturbate.com/api/public/affiliates/onlinerooms/?format=json&wm=${wm}&limit=500&client_ip=request_ip`;
  
  if (gender && ['f', 'm', 'c', 't'].includes(gender)) {
    apiUrl += `&gender=${gender}`;
  }

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`Chaturbate status: ${res.status}`);
    
    let data = await res.json();
    let resultados = data.results || [];

    // --- LÓGICA DE FILTRADO ---
    
    if (region) {
      if (region === 'asia') {
        // Filtro especial para Asia (combinación de países y tags)
        const paisesAsia = ['PH', 'TH', 'VN', 'ID', 'MY', 'JP', 'KR', 'IN', 'CN', 'TW', 'HK'];
        const tagsAsia = ['asian', 'pinay', 'thai', 'japanese', 'korean', 'vietnamese', 'indonesian', 'filipina', 'china', 'taiwan'];
        
        resultados = resultados.filter(model => {
          // Si el país está en la lista de Asia, lo aceptamos
          if (paisesAsia.includes(model.country)) return true;
          
          // Si no, revisamos si tiene algún tag asiático
          const texto = (model.room_subject || '').toLowerCase() + ' ' + (model.tags || []).join(' ').toLowerCase();
          return tagsAsia.some(tag => texto.includes(tag));
        });

      } else if (region === 'europa') {
        const paisesEuropa = ['ES', 'FR', 'DE', 'IT', 'GB', 'RU', 'NL', 'PT', 'SE', 'NO', 'DK', 'FI', 'PL', 'RO', 'GR', 'CZ', 'HU', 'IE', 'AT', 'CH', 'BE', 'UA'];
        resultados = resultados.filter(model => paisesEuropa.includes(model.country));
        
      } else if (region === 'sudamerica') {
        const paisesSudamerica = ['CO', 'AR', 'CL', 'BR', 'VE', 'PE', 'EC', 'BO', 'PY', 'UY'];
        resultados = resultados.filter(model => paisesSudamerica.includes(model.country));
        
      } else if (region === 'norteamerica') {
        const paisesNorteamerica = ['US', 'CA', 'MX'];
        resultados = resultados.filter(model => paisesNorteamerica.includes(model.country));
      }
      
    } else if (country) {
      // Filtro por país específico
      resultados = resultados.filter(model => model.country === country);
    }

    // --- FIN DEL FILTRADO ---

    // Ordenar por usuarios (los más vistos primero)
    resultados.sort((a, b) => parseInt(b.num_users) - parseInt(a.num_users));

    // Aplicar paginación
    const totalResultados = resultados.length;
    const resultadosPaginados = resultados.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); 
    
    response.status(200).json({
      results: resultadosPaginados,
      count: totalResultados,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalResultados
    });
    
  } catch (error) {
    response.status(500).json({ error: 'Fallo el proxy', details: error.message });
  }
}
