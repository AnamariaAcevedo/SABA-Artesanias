package com.marketplace.marketplace_backend.modules.archivopublicacion;

import com.marketplace.marketplace_backend.modules.archivopublicacion.dto.ArchivoPublicacionResponseDto;
import com.marketplace.marketplace_backend.modules.publicacion.Publicacion;
import com.marketplace.marketplace_backend.modules.publicacion.PublicacionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio para subir, listar, obtener y borrar archivos de publicaciones
public class ArchivoPublicacionServiceImpl implements ArchivoPublicacionService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of("image/png", "image/jpeg");

    private final ArchivoPublicacionRepository archivoPublicacionRepository;
    private final PublicacionRepository publicacionRepository;

    @Override
    @Transactional
    public ArchivoPublicacionResponseDto create(Long idPublicacion, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo no puede estar vacío");
        }

        String contentType = archivo.getContentType();
        if (!TIPOS_PERMITIDOS.contains(contentType)) {
            throw new IllegalArgumentException("Solo se permiten imágenes PNG o JPG");
        }

        Publicacion publicacion = publicacionRepository.findById(idPublicacion)
                .orElseThrow(() -> new EntityNotFoundException("Publicación no encontrada"));

        ArchivoPublicacion archivoPublicacion = new ArchivoPublicacion();
        archivoPublicacion.setContentType(contentType);
        archivoPublicacion.setPublicacion(publicacion);
        try {
            archivoPublicacion.setArchivo(archivo.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo", e);
        }

        ArchivoPublicacion saved = archivoPublicacionRepository.save(archivoPublicacion);
        return toResponse(saved);
    }

    @Override
    public List<ArchivoPublicacionResponseDto> listByPublicacion(Long idPublicacion) {
        if (!publicacionRepository.existsById(idPublicacion)) {
            throw new EntityNotFoundException("Publicación no encontrada");
        }

        return archivoPublicacionRepository.findByPublicacion_IdOrderByIdAsc(idPublicacion).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ArchivoPublicacion get(Long id) {
        return archivoPublicacionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Archivo no encontrado"));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        ArchivoPublicacion archivoPublicacion = archivoPublicacionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Archivo no encontrado"));

        archivoPublicacion.setDeletedAt(LocalDateTime.now());
        archivoPublicacionRepository.save(archivoPublicacion);
    }

    private ArchivoPublicacionResponseDto toResponse(ArchivoPublicacion archivoPublicacion) {
        return new ArchivoPublicacionResponseDto(
                archivoPublicacion.getId(),
                archivoPublicacion.getContentType(),
                archivoPublicacion.getPublicacion().getId()
        );
    }
}
