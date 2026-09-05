package com.marketplace.marketplace_backend.common;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
// Datos de paginación (página actual, tamaño de página, total de resultados)
public class Pagination {
    private int page;
    private int perPage;
    private int total;
}
