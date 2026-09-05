package com.marketplace.marketplace_backend.common;

// Resultado paginado que devuelven los servicios antes de armar la respuesta HTTP
public record PagedResult<T>(T data, int page, int perPage, int total) {}
