package com.marketplace.marketplace_backend.config;

import java.util.List;

import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@AllArgsConstructor
// Configuracion de seguridad: JWT sin sesion, sin cookies
public class SecurityConfig {

    private final JwtRequestFilter jwtRequestFilter;
    private final UserDetailsService usuarioDetailsService;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/refresh", "/registro", "/recuperar", "/recuperar/confirmar", "/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/pedidos").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET,
                        "/public/ubicaciones/paises", "/public/ubicaciones/departamentos",
                        "/public/ubicaciones/ciudades", "/public/ubicaciones/barrios",
                        "/productos", "/productos/**",
                        "/tiendas", "/tiendas/**",
                        "/categorias", "/categorias/**",
                        "/subcategorias", "/subcategorias/**",
                        "/imagenes", "/imagenes/**",
                        "/contactos", "/contactos/**",
                        "/tipos-contacto", "/tipos-contacto/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, exception) ->
                        escribirErrorSeguridad(
                                response,
                                HttpServletResponse.SC_UNAUTHORIZED,
                                "Tu sesión venció o ya no es válida. Iniciá sesión nuevamente."
                        ))
                .accessDeniedHandler((request, response, exception) ->
                        escribirErrorSeguridad(
                                response,
                                HttpServletResponse.SC_FORBIDDEN,
                                "No tenés permiso para realizar esta acción."
                        ))
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .userDetailsService(usuarioDetailsService);

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void escribirErrorSeguridad(
            jakarta.servlet.http.HttpServletResponse response,
            int estado,
            String mensaje
    ) throws java.io.IOException {
        response.setStatus(estado);
        response.setCharacterEncoding(java.nio.charset.StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
                "{\"success\":false,\"data\":null,\"errors\":[\"" + mensaje + "\"],\"pagination\":null}"
        );
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Origen del frontend en desarrollo (Next.js). Agregar el dominio real cuando exista.
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
