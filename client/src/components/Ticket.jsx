import { Box, Typography, Divider, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

export default function Ticket({ venta, onClose }) {
  if (!venta) return null;

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
  const fecha = new Date(venta.fecha || Date.now()).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const handlePrint = () => {
    const contenido = document.getElementById('ticket-imprimible').innerHTML;
    const ventana = window.open('', '_blank', 'width=400,height=600');
    ventana.document.write(`
      <html><head><title>Ticket Viveros Charis</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 13px; margin: 0; padding: 16px; max-width: 300px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .total { font-size: 16px; font-weight: bold; }
        h2 { margin: 0; font-size: 18px; }
        p { margin: 2px 0; }
      </style></head>
      <body>${contenido}</body></html>
    `);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => { ventana.print(); ventana.close(); }, 300);
  };

  return (
    <Box>
      <Box id="ticket-imprimible" sx={{ fontFamily: 'monospace', maxWidth: 300, mx: 'auto', p: 2, border: '1px dashed #ccc', borderRadius: 2, bgcolor: '#fff' }}>
        <Box className="center" sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight={700} fontSize={16}>🌿 VIVEROS CHARIS</Typography>
          <Typography variant="caption" display="block" color="text.secondary">Sistema de Gestión de Ventas</Typography>
          <Typography variant="caption" display="block" color="text.secondary">{fecha}</Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" display="block">Folio: <strong>#{venta.id || '---'}</strong></Typography>
          <Typography variant="caption" display="block">Cliente: <strong>{venta.cliente_nombre || 'Venta directa'}</strong></Typography>
          <Typography variant="caption" display="block">Atendió: <strong>{venta.vendedor_nombre || '---'}</strong></Typography>
          <Typography variant="caption" display="block">Pago: <strong style={{ textTransform: 'capitalize' }}>{venta.tipo_pago || 'contado'}</strong></Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" fontWeight={700} sx={{ flex: 2 }}>Producto</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ flex: 1, textAlign: 'center' }}>Cant.</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ flex: 1, textAlign: 'right' }}>Subtotal</Typography>
          </Box>
          {(venta.detalle || []).map((item, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
              <Typography variant="caption" sx={{ flex: 2, fontSize: 11 }}>{item.producto_nombre || item.nombre}</Typography>
              <Typography variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: 11 }}>{item.cantidad}</Typography>
              <Typography variant="caption" sx={{ flex: 1, textAlign: 'right', fontSize: 11 }}>{fmt(item.precio_unitario * item.cantidad)}</Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700} fontSize={15}>TOTAL</Typography>
          <Typography fontWeight={700} fontSize={18} color="#2E7D32">{fmt(venta.total)}</Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
        <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
          ¡Gracias por su compra!
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2, justifyContent: 'center' }}>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
          Imprimir ticket
        </Button>
        {onClose && (
          <Button variant="outlined" onClick={onClose}
            sx={{ borderColor: '#2E7D32', color: '#2E7D32', borderRadius: 2 }}>
            Cerrar
          </Button>
        )}
      </Box>
    </Box>
  );
}
