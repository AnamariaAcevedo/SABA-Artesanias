package com.marketplace.marketplace_backend.modules.ubicacion;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.pais.PaisService;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisFilterDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisResponseDto;
import com.marketplace.marketplace_backend.modules.departamento.DepartamentoService;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoFilterDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoResponseDto;
import com.marketplace.marketplace_backend.modules.ciudad.CiudadService;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadFilterDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadResponseDto;
import com.marketplace.marketplace_backend.modules.barrio.BarrioService;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioFilterDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioResponseDto;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/** Catálogos geográficos públicos para completar el registro; no expone direcciones personales. */
@RestController
@AllArgsConstructor
@RequestMapping("/public/ubicaciones")
public class UbicacionPublicaController {
    private final PaisService paisService;
    private final DepartamentoService departamentoService;
    private final CiudadService ciudadService;
    private final BarrioService barrioService;

    @GetMapping("/paises")
    public ResponseEntity<StandardResponseDto<List<PaisResponseDto>>> paises(@ModelAttribute PaisFilterDto filter) {
        var result = paisService.findAll(filter);
        StandardResponseDto<List<PaisResponseDto>> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(result.data());
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/departamentos")
    public ResponseEntity<StandardResponseDto<List<DepartamentoResponseDto>>> departamentos(@ModelAttribute DepartamentoFilterDto filter) {
        var result = departamentoService.findAll(filter);
        StandardResponseDto<List<DepartamentoResponseDto>> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(result.data());
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ciudades")
    public ResponseEntity<StandardResponseDto<List<CiudadResponseDto>>> ciudades(@ModelAttribute CiudadFilterDto filter) {
        var result = ciudadService.findAll(filter);
        StandardResponseDto<List<CiudadResponseDto>> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(result.data());
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/barrios")
    public ResponseEntity<StandardResponseDto<List<BarrioResponseDto>>> barrios(@ModelAttribute BarrioFilterDto filter) {
        var result = barrioService.findAll(filter);
        StandardResponseDto<List<BarrioResponseDto>> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(result.data());
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }
}
