package com.marketplace.marketplace_backend.modules.dashboard.dto;

import java.time.LocalDate;

public record VentaDiariaDto(LocalDate fecha, long pedidos, double total) {
}
