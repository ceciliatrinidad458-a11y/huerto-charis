  import { useCallback, useEffect, useMemo, useState } from 'react';
  import {Alert,Box,Button,ButtonGroup,Card,CardContent,Chip,CircularProgress,Grid,Skeleton,Snackbar, Table,TableBody,TableCell,TableHead,TableRow,Tooltip,Typography,} from '@mui/material';
  import AssessmentIcon from '@mui/icons-material/Assessment';
  import Inventory2Icon from '@mui/icons-material/Inventory2';
  import PaidIcon from '@mui/icons-material/Paid';
  import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
  import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
  import api from '../api.js';

  const periodos = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Semanal', value: 'semanal' },
    { label: 'Mensual', value: 'mensual' },
    { label: 'Anual', value: 'anual' },
  ];

  const COLORS = {
    green: '#2E7D32',
    greenDark: '#1B5E20',
    greenLight: '#E8F5E9',
    greenMid: '#A5D6A7',
    blue: '#1565C0',
    purple: '#6A1B9A',
    orange: '#E65100',
    red: '#B71C1C',
  };

  const currency = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });

  const fmt = (n) => currency.format(Number(n || 0));

  const fmtFecha = (str) => {
    if (!str) return '-';
    const date = String(str).includes('T') ? new Date(str) : new Date(`${str}T12:00:00`);

    return Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
  };

  const loadjsPDF = () =>
    new Promise((resolve, reject) => {
      if (window.jspdf?.jsPDF) {
        resolve(window.jspdf.jsPDF);
        return;
      }

      const existing = document.querySelector('script[data-jspdf="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.jspdf.jsPDF), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      script.dataset.jspdf = 'true';
      script.onload = () => resolve(window.jspdf.jsPDF);
      script.onerror = () => reject(new Error('No se pudo cargar jsPDF'));
      document.head.appendChild(script);
    });

  const ensurePageSpace = (doc, y, needed, margin) => {
    const height = doc.internal.pageSize.getHeight();
    if (y + needed <= height - 18) return y;
    doc.addPage();
    return margin;
  };
  let logoCache = null;

const cargarLogo = () => {
  return new Promise((resolve, reject) => {
    // Si ya tenemos el logo en caché, lo devolvemos
    if (logoCache) {
      resolve(logoCache);
      return;
    }

    const img = new Image();
    // La ruta es desde la carpeta public
    img.src = '/logo-corte-caja.png';
    
    img.onload = () => {
      console.log('Logo cargado correctamente:', img.width, 'x', img.height);
      logoCache = img;
      resolve(img);
    };
    
    img.onerror = (error) => {
      console.error('Error cargando logo:', error);
      reject(new Error('No se pudo cargar el logo'));
    };
  });
};
// ========== FIN AGREGAR ==========

  const generarPDF = async (data, periodo) => {
    const jsPDF = await loadjsPDF();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    // Cargar el logo
    let logoImg = null;
    try {
      logoImg = await cargarLogo();
      console.log('Logo cargado exitosamente');
    } catch (error) {
      console.warn('No se pudo cargar el logo, usando texto por defecto:', error.message);
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const now = new Date();
    const periodLabel = periodos.find((p) => p.value === periodo)?.label || periodo;

    const C = {
      green: [46, 125, 50],
      greenDark: [27, 94, 32],
      greenLight: [232, 245, 233],
      greenMid: [165, 214, 167],
      grayDark: [40, 40, 40],
      grayMed: [100, 100, 100],
      grayLine: [220, 220, 220],
      white: [255, 255, 255],
      orange: [230, 81, 0],
      redLight: [255, 235, 238],
      orangeLight: [255, 243, 224],
      blue: [21, 101, 192],
      purple: [106, 27, 154],
    };

    const setFont = (style = 'normal', size = 10, color = C.grayDark) => {
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      doc.setTextColor(...color);
    };

    const fillRect = (x, y, w, h, color) => {
      doc.setFillColor(...color);
      doc.rect(x, y, w, h, 'F');
    };

    const line = (x1, y1, x2, y2, color = C.grayLine, lineWidth = 0.25) => {
      doc.setLineWidth(lineWidth);
      doc.setDrawColor(...color);
      doc.line(x1, y1, x2, y2);
    };

    const sectionTitle = (title, y, color = C.green, bg = C.greenLight) => {
      y = ensurePageSpace(doc, y, 18, margin);
      fillRect(margin, y, pageWidth - margin * 2, 7, bg);
      line(margin, y, margin, y + 7, color, 1);
      setFont('bold', 10, color);
      doc.text(title, margin + 4, y + 5);
      return y + 11;
    };

    const drawEmpty = (message, y) => {
      setFont('italic', 9, C.grayMed);
      doc.text(message, pageWidth / 2, y + 5, { align: 'center' });
      return y + 14;
    };

    const drawTable = (rows, y, columns, accent = C.green) => {
      y = ensurePageSpace(doc, y, 18, margin);
      fillRect(margin, y, pageWidth - margin * 2, 7, accent);
      setFont('bold', 8, C.white);

      let x = margin;
      columns.forEach((col) => {
        doc.text(col.label, x + 3, y + 5);
        x += col.width;
      });

      y += 7;

      rows.forEach((row, idx) => {
        y = ensurePageSpace(doc, y, 9, margin);
        fillRect(margin, y, pageWidth - margin * 2, 6.5, idx % 2 === 0 ? C.greenLight : C.white);

        let cellX = margin;
        columns.forEach((col) => {
          const value = String(col.render(row));
          const text = doc.splitTextToSize(value, col.width - 6)[0] || '';
          setFont(col.bold ? 'bold' : 'normal', 8, col.color || C.grayDark);
          doc.text(text, cellX + 3, y + 4.5);
          cellX += col.width;
        });

        line(margin, y + 6.5, pageWidth - margin, y + 6.5);
        y += 6.5;
      });

      return y + 6;
    };


     fillRect(0, 0, pageWidth, 42, C.green);
  fillRect(0, 38, pageWidth, 4, C.greenMid);
  
  if (logoImg) {
    console.log('Dibujando logo en PDF');
    // Círculo blanco de fondo
    const circleX = margin;
    const circleY = 11;
    const circleSize = 16; // 16mm de diámetro
    
    doc.setFillColor(...C.white);
    doc.circle(circleX + circleSize/2, circleY + circleSize/2, circleSize/2, 'F');
    
    // Dibujar la imagen dentro del círculo
    try {
      doc.addImage(
        logoImg,
        'PNG',
        circleX + 2,
        circleY + 2,
        circleSize - 4,
        circleSize - 4
      );
      console.log('Logo dibujado correctamente');
    } catch (err) {
      console.error('Error al dibujar logo:', err);
      // Fallback texto
      setFont('bold', 11, C.green);
      doc.text('VL', circleX + 4.5, circleY + 12);
    }
  } else {
    console.log('Usando fallback de texto VL');
    // Fallback: círculo con texto VL
    doc.setFillColor(...C.white);
    doc.circle(margin + 8, 19, 8, 'F');
    setFont('bold', 11, C.green);
    doc.text('VL', margin + 4.5, 22);
  }
  
  setFont('bold', 20, C.white);
  doc.text('CORTE DE CAJA', margin + 22, 16);
  setFont('normal', 9, C.greenMid);
  doc.text('Reporte generado automaticamente por el sistema', margin + 22, 22);
  // ========== FIN CABECERA CORREGIDA ==========
  
    fillRect(pageWidth - margin - 32, 8, 32, 10, C.greenMid);
    setFont('bold', 8, C.greenDark);
    doc.text(periodLabel.toUpperCase(), pageWidth - margin - 16, 14.5, { align: 'center' });

    setFont('normal', 8, C.greenMid);
    doc.text(
      `Generado: ${now.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`,
      pageWidth - margin,
      26,
      { align: 'right' },
    );

    let y = 52;

    const cards = [
      { label: 'Total ingresos', value: fmt(data?.totales?.ingresos_total), color: C.green },
      { label: 'Ventas realizadas', value: String(data?.totales?.total_ventas || 0), color: C.blue },
      { label: 'Contado', value: fmt(data?.totales?.contado), color: C.purple },
      { label: 'Credito', value: fmt(data?.totales?.credito), color: C.orange },
    ];

    const cardWidth = (pageWidth - margin * 2 - 9) / 4;
    cards.forEach((card, index) => {
      const x = margin + index * (cardWidth + 3);
      fillRect(x + 0.5, y + 0.5, cardWidth, 22, [210, 210, 210]);
      fillRect(x, y, cardWidth, 22, C.white);
      fillRect(x, y, cardWidth, 2.5, card.color);
      setFont('normal', 7, C.grayMed);
      doc.text(card.label, x + 3, y + 8);
      setFont('bold', 10, card.color);
      doc.text(doc.splitTextToSize(card.value, cardWidth - 6)[0], x + 3, y + 17);
    });

    y += 32;

    y = sectionTitle('Ventas por dia', y);
    y = data?.porDia?.length
      ? drawTable(data.porDia, y, [
          { label: 'Fecha', width: 50, render: (d) => fmtFecha(d.dia) },
          { label: 'Ventas', width: 40, render: (d) => d.ventas || '-' },
          {
            label: 'Total',
            width: pageWidth - margin * 2 - 90,
            render: (d) => fmt(d.total),
            color: C.green,
            bold: true,
          },
        ])
      : drawEmpty('Sin datos para este periodo', y);

    y = sectionTitle('Productos mas vendidos', y);
    y = data?.topProductos?.length
      ? drawTable(data.topProductos, y, [
          { label: 'Producto', width: 82, render: (p) => p.nombre || '-' },
          { label: 'Cantidad', width: 35, render: (p) => p.vendidos || 0 },
          {
            label: 'Ingresos',
            width: pageWidth - margin * 2 - 117,
            render: (p) => fmt(p.ingresos),
            color: C.green,
            bold: true,
          },
        ])
      : drawEmpty('Sin datos para este periodo', y);

    y = sectionTitle('Stock critico (10 unidades o menos)', y, C.orange, C.redLight);
    y = data?.stockCritico?.length
      ? drawTable(
          data.stockCritico,
          y,
          [
            { label: 'Producto', width: 105, render: (p) => p.nombre || '-' },
            {
              label: 'Existencia',
              width: pageWidth - margin * 2 - 105,
              render: (p) => `${p.cantidad || 0} uds`,
              color: C.orange,
              bold: true,
            },
          ],
          C.orange,
        )
      : drawEmpty('Todos los productos tienen stock suficiente', y);

    y = sectionTitle('Resumen del corte', y);

    const summaryRows = [
      { label: 'Total de ventas registradas', value: String(data?.totales?.total_ventas || 0) },
      { label: 'Ventas en efectivo (contado)', value: fmt(data?.totales?.contado) },
      { label: 'Ventas a credito', value: fmt(data?.totales?.credito) },
      { label: 'TOTAL INGRESOS DEL PERIODO', value: fmt(data?.totales?.ingresos_total), bold: true },
    ];

    summaryRows.forEach((row, idx) => {
      y = ensurePageSpace(doc, y, 9, margin);
      const bg = row.bold ? C.green : idx % 2 === 0 ? C.greenLight : C.white;
      fillRect(margin, y, pageWidth - margin * 2, 8, bg);
      setFont(row.bold ? 'bold' : 'normal', row.bold ? 10 : 9, row.bold ? C.white : C.grayDark);
      doc.text(row.label, margin + 4, y + 5.5);
      setFont('bold', row.bold ? 11 : 9, row.bold ? C.white : C.green);
      doc.text(row.value, pageWidth - margin - 3, y + 5.5, { align: 'right' });
      y += 8;
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i += 1) {
      doc.setPage(i);
      fillRect(0, pageHeight - 12, pageWidth, 12, C.green);
      setFont('normal', 7, C.greenMid);
      doc.text(
        `Corte de caja - Periodo: ${periodLabel} - ${now.toLocaleString('es-MX')}`,
        margin,
        pageHeight - 4.5,
      );
      doc.text(`Pag. ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 4.5, { align: 'right' });
    }

    doc.save(`corte_caja_${periodo}_${now.toISOString().slice(0, 10)}.pdf`);
  };

  const MetricCard = ({ color, icon, label, value }) => (
    <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        </Box>
        <Typography variant="h5" fontWeight={800} color={color} mt={0.75}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const LoadingState = () => (
    <>
      <Grid container spacing={2} mb={3}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={6} md={3} key={item}>
            <Skeleton variant="rounded" height={94} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={260} />
    </>
  );

  export default function Reportes() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState('semanal');
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async (selectedPeriod, signal) => {
      setLoading(true);
      setError('');

      try {
        const res = await api.get(`/reportes/resumen?periodo=${selectedPeriod}`, { signal });
        setData(res.data);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setError('No se pudieron cargar los reportes. Intenta de nuevo.');
        setData(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    }, []);

    useEffect(() => {
      const controller = new AbortController();
      load(periodo, controller.signal);
      return () => controller.abort();
    }, [load, periodo]);

    const maxBar = useMemo(
      () => data?.porDia?.reduce((max, day) => Math.max(max, Number(day.total || 0)), 1) || 1,
      [data?.porDia],
    );

    const metrics = useMemo(
      () => [
        {
          label: 'Total ingresos',
          value: fmt(data?.totales?.ingresos_total),
          color: COLORS.green,
          icon: <PaidIcon fontSize="small" />,
        },
        {
          label: 'Ventas realizadas',
          value: data?.totales?.total_ventas || 0,
          color: COLORS.blue,
          icon: <PointOfSaleIcon fontSize="small" />,
        },
        {
          label: 'Contado',
          value: fmt(data?.totales?.contado),
          color: COLORS.purple,
          icon: <AssessmentIcon fontSize="small" />,
        },
        {
          label: 'Credito',
          value: fmt(data?.totales?.credito),
          color: COLORS.orange,
          icon: <Inventory2Icon fontSize="small" />,
        },
      ],
      [data],
    );

    const handleGenerarPDF = async () => {
      if (!data) return;

      setGenerandoPDF(true);
      setError('');

      try {
        await generarPDF(data, periodo);
      } catch {
        setError('No se pudo generar el PDF. Revisa tu conexion e intenta de nuevo.');
      } finally {
        setGenerandoPDF(false);
      }
    };

    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800} color={COLORS.greenDark}>
              Reportes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resumen de ventas, ingresos y existencias
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <ButtonGroup size="small" variant="outlined" aria-label="Seleccionar periodo">
              {periodos.map((p) => (
                <Button
                  key={p.value}
                  onClick={() => setPeriodo(p.value)}
                  variant={periodo === p.value ? 'contained' : 'outlined'}
                  sx={
                    periodo === p.value
                      ? { bgcolor: COLORS.green, borderColor: COLORS.green, '&:hover': { bgcolor: COLORS.greenDark } }
                      : { borderColor: COLORS.green, color: COLORS.green, '&:hover': { bgcolor: COLORS.greenLight } }
                  }
                >
                  {p.label}
                </Button>
              ))}
            </ButtonGroup>

            <Tooltip title="Genera un PDF con el corte de caja del periodo seleccionado">
              <span>
                <Button
                  variant="contained"
                  startIcon={generandoPDF ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
                  onClick={handleGenerarPDF}
                  disabled={generandoPDF || loading || !data}
                  sx={{
                    bgcolor: COLORS.red,
                    '&:hover': { bgcolor: '#7F0000' },
                    '&:disabled': { bgcolor: '#FFCDD2', color: COLORS.red },
                    borderRadius: 2,
                    fontWeight: 800,
                    px: 2.5,
                    boxShadow: '0 3px 10px rgba(183,28,28,0.25)',
                  }}
                >
                  {generandoPDF ? 'Generando...' : 'Corte de caja PDF'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <Grid container spacing={2} mb={3}>
              {metrics.map((metric) => (
                <Grid item xs={6} md={3} key={metric.label}>
                  <MetricCard {...metric} />
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={800} color={COLORS.greenDark} mb={2}>
                      Ventas por dia
                    </Typography>
                    {!data?.porDia?.length ? (
                      <Typography color="text.secondary" textAlign="center" py={3}>
                        Sin datos para este periodo
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 160, px: 1 }}>
                        {data.porDia.map((d) => {
                          const total = Number(d.total || 0);
                          const height = Math.max((total / maxBar) * 122, 4);

                          return (
                            <Box
                              key={d.dia}
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 0.75,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color={COLORS.green}
                                fontWeight={700}
                                fontSize={10}
                                noWrap
                                maxWidth="100%"
                              >
                                {fmt(total)}
                              </Typography>
                              <Box
                                title={`${fmtFecha(d.dia)}: ${fmt(total)}`}
                                sx={{
                                  width: '100%',
                                  minWidth: 10,
                                  bgcolor: COLORS.greenMid,
                                  borderRadius: '4px 4px 0 0',
                                  height,
                                  transition: 'height 0.2s ease',
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" fontSize={10} noWrap>
                                {fmtFecha(d.dia).replace(/\s\d{4}/, '')}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={800} color={COLORS.greenDark} mb={2}>
                      Productos mas vendidos
                    </Typography>
                    {!data?.topProductos?.length ? (
                      <Typography color="text.secondary" textAlign="center" py={2} fontSize={13}>
                        Sin datos
                      </Typography>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: COLORS.greenLight }}>
                            {['Producto', 'Vendidos', 'Ingresos'].map((header) => (
                              <TableCell key={header} sx={{ fontWeight: 800, color: COLORS.greenDark, fontSize: 12 }}>
                                {header}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.topProductos.map((product) => (
                            <TableRow key={product.id || product.nombre} hover>
                              <TableCell sx={{ fontSize: 12 }}>{product.nombre}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{product.vendidos}</TableCell>
                              <TableCell sx={{ fontSize: 12, color: COLORS.green, fontWeight: 700 }}>
                                {fmt(product.ingresos)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={800} color={COLORS.greenDark}>
                        Stock critico
                      </Typography>
                      <Chip
                        label={`${data?.stockCritico?.length || 0}`}
                        size="small"
                        sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700 }}
                      />
                    </Box>
                    {data?.stockCritico?.length ? (
                      data.stockCritico.map((product) => (
                        <Box
                          key={product.id || product.nombre}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.85,
                            borderBottom: '1px solid #eee',
                          }}
                        >
                          <Typography fontSize={13}>{product.nombre}</Typography>
                          <Chip
                            label={`${product.cantidad} uds`}
                            size="small"
                            sx={{
                              bgcolor: product.cantidad <= 5 ? '#FFEBEE' : '#FFF3E0',
                              color: product.cantidad <= 5 ? '#C62828' : COLORS.orange,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary" fontSize={13} textAlign="center" py={2}>
                        Stock OK
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        <Snackbar open={Boolean(error)} autoHideDuration={4500} onClose={() => setError('')}>
          <Alert severity="error" variant="filled" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    );
  }