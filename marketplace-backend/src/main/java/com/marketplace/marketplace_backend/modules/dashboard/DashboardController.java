package com.marketplace.marketplace_backend.modules.dashboard;

import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.dashboard.dto.DashboardResumenDto;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@AllArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    @PreAuthorize("hasAuthority('LIST_PEDIDOS')")
    public ResponseEntity<StandardResponseDto<DashboardResumenDto>> resumen(
            @RequestParam(defaultValue = "30") int periodo) {
        StandardResponseDto<DashboardResumenDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(dashboardService.obtenerResumen(periodo));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
