package com.marketplace.marketplace_backend.modules.tiendausuario;

import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.EstadoSolicitudVendedor;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.SolicitudVendedorRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.dto.ColaboradorRequestDto;
import com.marketplace.marketplace_backend.modules.tiendausuario.dto.ColaboradorResponseDto;
import com.marketplace.marketplace_backend.modules.tiendausuario.dto.UsuarioDisponibleDto;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
// Alta directa de colaboradores: el dueño escribe el usuario y queda vinculado como
// SECUNDARIO con el rol VendedorSecundario. Los permisos se leen de la base en cada
// request, asi que el cambio de rol rige desde la siguiente peticion del colaborador.
public class ColaboradorTiendaServiceImpl implements ColaboradorTiendaService {

    private static final String ROL_CLIENTE = "Cliente";
    private static final String ROL_VENDEDOR_SECUNDARIO = "VendedorSecundario";
    private static final int LIMITE_SUGERENCIAS_MAXIMO = 20;

    private final TiendaUsuarioRepository tiendaUsuarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final SolicitudVendedorRepository solicitudVendedorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ColaboradorResponseDto> listar() {
        Long idTienda = vinculoDelDueno().getTienda().getId();
        return tiendaUsuarioRepository.listarEquipoDeTienda(idTienda).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioDisponibleDto> sugerir(String texto, int limite) {
        TiendaUsuario vinculoDueno = vinculoDelDueno();
        String prefijo = texto == null ? "" : texto.trim().toLowerCase(Locale.ROOT);
        if (prefijo.length() < 2) {
            return List.of();
        }
        int tamanio = Math.clamp(limite, 1, LIMITE_SUGERENCIAS_MAXIMO);
        Long idTienda = vinculoDueno.getTienda().getId();
        return tiendaUsuarioRepository.buscarPorPrefijoDeUsuario(
                        escaparLike(prefijo), vinculoDueno.getUsuario().getId(), PageRequest.of(0, tamanio))
                .stream()
                .map(usuario -> new UsuarioDisponibleDto(
                        usuario.getUsuario(),
                        usuario.getNombre(),
                        usuario.getApellido(),
                        motivoNoDisponible(usuario, idTienda)))
                .toList();
    }

    @Override
    @Transactional
    public ColaboradorResponseDto agregar(ColaboradorRequestDto request) {
        TiendaUsuario vinculoDueno = vinculoDelDueno();
        String nombreUsuario = request.getUsuario().trim();

        Usuario usuario = usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe ningún usuario \"" + nombreUsuario + "\"."));
        String motivo = motivoNoDisponible(usuario, vinculoDueno.getTienda().getId());
        if (motivo != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No fue posible agregar a " + usuario.getUsuario() + ": " + motivo);
        }

        TiendaUsuario vinculo = new TiendaUsuario();
        vinculo.setTienda(vinculoDueno.getTienda());
        vinculo.setUsuario(usuario);
        vinculo.setTipo(TipoVinculoTienda.SECUNDARIO);
        TiendaUsuario guardado = tiendaUsuarioRepository.save(vinculo);

        usuario.setRol(rol(ROL_VENDEDOR_SECUNDARIO));
        usuarioRepository.save(usuario);

        return toResponse(guardado);
    }

    @Override
    @Transactional
    public void quitar(Long idVinculo) {
        Long idTienda = vinculoDelDueno().getTienda().getId();
        TiendaUsuario vinculo = tiendaUsuarioRepository.findByIdAndTienda_Id(idVinculo, idTienda)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Colaborador no encontrado"));
        if (vinculo.getTipo() != TipoVinculoTienda.SECUNDARIO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede quitar al dueño de la tienda.");
        }

        vinculo.setDeletedAt(LocalDateTime.now());
        tiendaUsuarioRepository.save(vinculo);

        // Si un administrador le cambio el rol mientras colaboraba, se respeta ese cambio.
        Usuario usuario = vinculo.getUsuario();
        if (ROL_VENDEDOR_SECUNDARIO.equalsIgnoreCase(usuario.getRol().getNombre())) {
            usuario.setRol(rol(ROL_CLIENTE));
            usuarioRepository.save(usuario);
        }
    }

    // ------------------------------------------------------- Verificaciones

    // El permiso del rol habilita el endpoint; ademas se exige ser el dueño de la tienda,
    // por si desde el panel se le asignan estos permisos a otro rol.
    private TiendaUsuario vinculoDelDueno() {
        String nombreUsuario = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        TiendaUsuario vinculo = tiendaUsuarioRepository.findFirstByUsuario_Id(usuario.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No gestionás ninguna tienda"));
        if (vinculo.getTipo() != TipoVinculoTienda.PRINCIPAL) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo el dueño de la tienda puede gestionar a los colaboradores.");
        }
        return vinculo;
    }

    private Rol rol(String nombre) {
        return rolRepository.findByNombreAndDeletedAtIsNull(nombre)
                .orElseThrow(() -> new IllegalStateException("Falta el rol " + nombre));
    }

    // Por que no se puede sumar al usuario al equipo de la tienda, o null si se puede.
    // Lo usan las sugerencias (para avisarlo de antemano) y el alta (que lo rechaza).
    private String motivoNoDisponible(Usuario usuario, Long idTienda) {
        var vinculo = tiendaUsuarioRepository.findFirstByUsuario_Id(usuario.getId());
        if (vinculo.isPresent()) {
            return vinculo.get().getTienda().getId().equals(idTienda)
                    ? "ya forma parte de tu tienda."
                    : "ya forma parte de otra tienda.";
        }
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            return "la cuenta está inactiva.";
        }
        // Solo clientes: cambiarle el rol a un administrador u otro rol especial le
        // quitaria los permisos que tiene hoy.
        if (!ROL_CLIENTE.equalsIgnoreCase(usuario.getRol().getNombre())) {
            return "solo se pueden agregar usuarios con rol Cliente.";
        }
        if (solicitudVendedorRepository.existsByUsuario_IdAndEstado(usuario.getId(), EstadoSolicitudVendedor.PENDIENTE)) {
            return "tiene una solicitud pendiente para abrir su propia tienda.";
        }
        return null;
    }

    private static String escaparLike(String texto) {
        return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private ColaboradorResponseDto toResponse(TiendaUsuario vinculo) {
        Usuario usuario = vinculo.getUsuario();
        return new ColaboradorResponseDto(
                vinculo.getId(),
                usuario.getId(),
                usuario.getUsuario(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                vinculo.getTipo(),
                vinculo.getCreatedAt()
        );
    }
}
