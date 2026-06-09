import Swal from 'sweetalert2';

export const alertaExito = (mensaje) => {
  Swal.fire({
    icon: 'success',
    title: '¡Listo!',
    text: mensaje,
    confirmButtonColor: '#2E7D32',
    timer: 1800,
    showConfirmButton: false
  });
};

export const alertaError = (mensaje) => {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: mensaje,
    confirmButtonColor: '#C62828'
  });
};

export const alertaConfirmar = async (mensaje) => {
  return Swal.fire({
    icon: 'warning',
    title: '¿Estás segura?',
    text: mensaje,
    showCancelButton: true,
    confirmButtonColor: '#C62828',
    cancelButtonColor: '#757575',
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar'
  });
};