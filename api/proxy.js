export default async function handler(request, response) {
  const { wm = 'q7k3D', gender, country, region, limit = 30, offset = 0 } = request.query;
  
  // Función auxiliar para hacer la petición a Chaturbate
  const fetchChaturbate = async (extraParams = '') => {
    let url = `https://chaturbate.com/api/public/affiliates/onlinerooms/?format=json&wm=${wm}&limit=500&client_ip=request_ip`;
    if (gender && ['f', 'm', 'c', 't'].includes(gender)) url += `&gender=${gender}`;
    url += extraParams;
    
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch (e) {
      return [];
    }
  };

  try {
    let resultados = [];

    if (region) {
      // MAPEO DE REGIONES A ETIQUETAS OFICIALES DE CHATURBATE
      const tagsPorRegion = {
        'asia': 'asian',
        'europa': 'european', 
        'sudamerica': 'latin',
        'norteamerica': 'american'
      };
      
      const tagBuscado = tagsPorRegion[region];
      
      if (tagBuscado) {
        resultados = await fetchChaturbate(`&tag=${tagBuscado}`);
      }
      
    } else if (country) {
      resultados = await fetchChaturbate(`&country=${country}`);
    } else {
      resultados = await fetchChaturbate();
    }

    // FILTRO CLAVE: Solo mostrar salas que estén en show público
    // Esto evita que el usuario entre a salas privadas o ausentes y vea un video en negro.
    resultados = resultados.filter(model => model.current_show === 'public');

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
