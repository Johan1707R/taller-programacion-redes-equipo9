const express = require('express');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT || 3000);
const teamN = String(process.env.TEAM_N || '9');
const expectedCredential = `CIAF-${teamN}`;
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5500';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Red-Equipo'],
}));
app.use(express.json());

// OPTIONS is the browser's CORS preflight. cors handles it before this middleware.
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const suppliedCredential = req.get('X-Red-Equipo');
  if (suppliedCredential !== expectedCredential) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Incluye el encabezado X-Red-Equipo con el valor asignado al equipo.',
      encabezadoRequerido: 'X-Red-Equipo',
    });
  }

  res.set('X-Servidor-Procesado', `Equipo-${teamN}`);
  next();
});

const envios = [
  { id: 'ENV-1001', destinatario: 'Laura Gómez', estado: 'En tránsito', ciudad: 'Pereira' },
  { id: 'ENV-1002', destinatario: 'Mateo Ríos', estado: 'En bodega', ciudad: 'Manizales' },
];

app.get('/api/envios', (req, res) => {
  res.status(200).json({ total: envios.length, envios });
});

app.post('/api/envios', (req, res) => {
  const { destinatario, ciudad } = req.body || {};
  if (typeof destinatario !== 'string' || !destinatario.trim() ||
      typeof ciudad !== 'string' || !ciudad.trim()) {
    return res.status(400).json({
      error: 'Solicitud inválida',
      message: 'El JSON debe incluir destinatario y ciudad como textos no vacíos.',
    });
  }

  const envio = {
    id: `ENV-${1000 + envios.length + 1}`,
    destinatario: destinatario.trim(),
    estado: 'Recibido',
    ciudad: ciudad.trim(),
  };
  envios.push(envio);
  return res.status(201).json({ message: 'Envío registrado.', envio });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido', message: 'Revisa el formato del cuerpo JSON.' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`Servicio de envíos disponible en http://localhost:${port}`);
  console.log(`Origen CORS permitido: ${allowedOrigin}`);
  console.log(`Credencial configurada para el equipo: CIAF-${teamN}`);
});
