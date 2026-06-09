import { Box, Typography, Divider, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

export default function TicketPedido({ pedido, onClose }) {
  if (!pedido) return null;

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

  const fechaPedido = new Date(pedido.fecha_pedido || Date.now()).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const fechaEntrega = pedido.fecha_entrega
    ? new Date(pedido.fecha_entrega).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'Sin fecha';

  const total = Number(pedido.total || 0);
  const pagado = Number(pedido.anticipo || 0);
  const resta = Math.max(total - pagado, 0);

  const entregado = pedido.estado === 'entregado';

  const handlePrint = () => {
    const contenido = document.getElementById('ticket-pedido-imprimible').innerHTML;
    const ventana = window.open('', '_blank', 'width=400,height=650');

    ventana.document.write(`
      <html>
        <head>
          <title>Ticket Pedido Viveros Charis</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 13px;
              margin: 0;
              padding: 16px;
              max-width: 300px;
            }

            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .total { font-size: 16px; font-weight: bold; }
            .estado {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              color: #b71c1c;
              margin-top: 8px;
            }
            h2 { margin: 0; font-size: 18px; }
            p { margin: 2px 0; }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
      ventana.close();
    }, 300);
  };

  return (
    <Box>
      <Box
        id="ticket-pedido-imprimible"
        sx={{
          fontFamily: 'monospace',
          maxWidth: 300,
          mx: 'auto',
          p: 2,
          border: '1px dashed #ccc',
          borderRadius: 2,
          bgcolor: '#fff'
        }}
      >
        <Box className="center" sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight={700} fontSize={16}>
            🌿 VIVEROS CHARIS
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Ticket de Pedido
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Solicitado: {fechaPedido}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" display="block">
            Pedido: <strong>#{pedido.id || '---'}</strong>
          </Typography>
          <Typography variant="caption" display="block">
            Cliente: <strong>{pedido.cliente_nombre || 'Cliente ocasional'}</strong>
          </Typography>
          <Typography variant="caption" display="block">
            Atendió: <strong>{pedido.vendedor_nombre || '---'}</strong>
          </Typography>
          <Typography variant="caption" display="block">
            Entrega: <strong>{fechaEntrega}</strong>
          </Typography>
          <Typography variant="caption" display="block">
            Estado: <strong style={{ textTransform: 'capitalize' }}>{pedido.estado || 'pendiente'}</strong>
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" fontWeight={700} sx={{ flex: 2 }}>
              Producto
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ flex: 1, textAlign: 'center' }}>
              Cant.
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ flex: 1, textAlign: 'right' }}>
              Subtotal
            </Typography>
          </Box>

          {(pedido.detalle || []).map((item, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
              <Typography variant="caption" sx={{ flex: 2, fontSize: 11 }}>
                {item.producto_nombre || item.nombre_producto || item.nombre}
              </Typography>
              <Typography variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: 11 }}>
                {item.cantidad}
              </Typography>
              <Typography variant="caption" sx={{ flex: 1, textAlign: 'right', fontSize: 11 }}>
                {fmt(Number(item.precio_unitario) * Number(item.cantidad))}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontWeight={700} fontSize={13}>TOTAL</Typography>
          <Typography fontWeight={700} fontSize={14}>{fmt(total)}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontSize={13}>Pagado / Anticipo</Typography>
          <Typography fontSize={13}>{fmt(pagado)}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontWeight={700} fontSize={13}>RESTA</Typography>
          <Typography fontWeight={700} fontSize={14} color={resta > 0 ? '#C62828' : '#2E7D32'}>
            {entregado ? 'PAGADO' : fmt(resta)}
          </Typography>
        </Box>

        {entregado && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
            <Typography
              className="estado"
              sx={{
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: '#B71C1C',
                mt: 1
              }}
            >
              PAGADO Y ENTREGADO
            </Typography>
          </>
        )}

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
          Conserve este ticket para recoger su pedido.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}
        >
          Imprimir ticket
        </Button>

        {onClose && (
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ borderColor: '#2E7D32', color: '#2E7D32', borderRadius: 2 }}
          >
            Cerrar
          </Button>
        )}
      </Box>
    </Box>
  );
}