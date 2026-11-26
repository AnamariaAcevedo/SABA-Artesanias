package com.marketplace.marketplace_backend.modules.recuperacion;

import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshTokenRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Slf4j
@Service
// Implementación de la recuperación de contraseña: el token se guarda hasheado, vence a los
// 30 minutos, es de un solo uso, y al cambiar la contraseña se cierran las sesiones del usuario.
public class RecuperacionServiceImpl implements RecuperacionService {

    private static final int MINUTOS_VALIDEZ = 30;
    private static final String MENSAJE_INVALIDO = "El link venció o ya se usó. Pedí uno nuevo.";

    private final UsuarioRepository usuarioRepository;
    private final TokenRecuperacionRepository tokenRecuperacionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final String remitente;
    private final String frontendUrl;

    public RecuperacionServiceImpl(
            UsuarioRepository usuarioRepository,
            TokenRecuperacionRepository tokenRecuperacionRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String remitente,
            @Value("${app.frontend-url}") String frontendUrl) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRecuperacionRepository = tokenRecuperacionRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.remitente = remitente;
        this.frontendUrl = frontendUrl;
    }

    @Override
    @Transactional
    public void solicitar(String email) {
        // Responde igual exista o no la cuenta, para no revelar qué correos están registrados.
        usuarioRepository.findByEmailIgnoreCase(email.trim()).ifPresent(usuario -> {
            tokenRecuperacionRepository.deleteByUsuario_Id(usuario.getId());

            String token = generarToken();

            TokenRecuperacion registro = new TokenRecuperacion();
            registro.setTokenHash(hash(token));
            registro.setUsuario(usuario);
            registro.setFechaVencimiento(LocalDateTime.now().plusMinutes(MINUTOS_VALIDEZ));
            registro.setUsado(false);
            tokenRecuperacionRepository.save(registro);

            enviarCorreo(usuario, token);
        });
    }

    @Override
    @Transactional
    public void confirmar(String token, String contrasenhaNueva) {
        TokenRecuperacion registro = tokenRecuperacionRepository.findByTokenHash(hash(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, MENSAJE_INVALIDO));

        if (Boolean.TRUE.equals(registro.getUsado()) || registro.getFechaVencimiento().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, MENSAJE_INVALIDO);
        }

        Usuario usuario = registro.getUsuario();
        usuario.setContrasenha(passwordEncoder.encode(contrasenhaNueva));
        registro.setUsado(true);

        refreshTokenRepository.deleteByUsuario_Id(usuario.getId());
    }

    private void enviarCorreo(Usuario usuario, String token) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(usuario.getEmail());
        mensaje.setSubject("Recuperá tu contraseña de SABA");
        mensaje.setText(
                "Hola " + usuario.getNombre() + ",\n\n"
                        + "Recibimos un pedido para cambiar tu contraseña. Para elegir una nueva, abrí este link:\n\n"
                        + frontendUrl + "/recuperar/nueva?token=" + token + "\n\n"
                        + "El link vence en " + MINUTOS_VALIDEZ + " minutos y solo se puede usar una vez.\n\n"
                        + "Si no fuiste vos, ignorá este correo."
        );

        try {
            mailSender.send(mensaje);
        } catch (MailException e) {
            log.error("No se pudo enviar el correo de recuperación a {}", usuario.getEmail(), e);
        }
    }

    private static String generarToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String valor) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(valor.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
