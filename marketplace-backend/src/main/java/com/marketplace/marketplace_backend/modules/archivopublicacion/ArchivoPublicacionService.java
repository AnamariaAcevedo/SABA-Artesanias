package com.marketplace.marketplace_backend.modules.archivopublicacion;

import com.marketplace.marketplace_backend.modules.archivopublicacion.dto.ArchivoPublicacionResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// Operaciones de negocio disponibles para el módulo ArchivoPublicacion
public interface ArchivoPublicacionService {
    ArchivoPublicacionResponseDto create(Long idPublicacion, MultipartFile archivo);

    List<ArchivoPublicacionResponseDto> listByPublicacion(Long idPublicacion);

    ArchivoPublicacion get(Long id);

    void delete(Long id);
}
