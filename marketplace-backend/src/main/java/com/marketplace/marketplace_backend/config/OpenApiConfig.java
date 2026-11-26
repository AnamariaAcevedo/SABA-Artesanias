package com.marketplace.marketplace_backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
// Configuracion de Swagger/OpenAPI, incluyendo el boton de autorizacion con Bearer JWT
public class OpenApiConfig {

    @Bean
    public OpenAPI openApi() {
        String bearerScheme = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("SABA-Artesanias API")
                        .description("API del marketplace de artesanias")
                        .version("v1"))
                .addSecurityItem(new SecurityRequirement().addList(bearerScheme))
                .components(new Components()
                        .addSecuritySchemes(bearerScheme, new SecurityScheme()
                                .name(bearerScheme)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
