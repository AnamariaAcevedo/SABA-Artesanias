package com.marketplace.marketplace_backend.common;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
// Formato estándar de respuesta de la API para todos los endpoints
public class StandardResponseDto<T> {
    private boolean success;
    private T data;
    private List<String> errors;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Pagination pagination;
}
