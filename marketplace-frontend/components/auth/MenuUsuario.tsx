"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import AvatarUsuario from "@/components/auth/AvatarUsuario";
import { useSesion } from "@/components/auth/SesionProvider";
import { cerrarSesion } from "@/lib/logout";
import styles from "./menuUsuario.module.css";

type Props = {
    // En el panel de administración el menú ofrece volver al catálogo en vez
    // de ir al perfil.
    enPanel?: boolean;
};

// Recuadro con la miniatura y el nombre de usuario de la sesión; al hacer clic
// despliega un menú con "Ver perfil" (o "Ver catálogo" en el panel) y "Cerrar sesión".
export default function MenuUsuario({ enPanel = false }: Props) {
    const { sesion } = useSesion();
    const [abierto, setAbierto] = useState(false);
    const [cerrando, setCerrando] = useState(false);
    const [error, setError] = useState("");
    const ocupado = useRef(false);
    const contenedor = useRef<HTMLDivElement>(null);
    const boton = useRef<HTMLButtonElement>(null);
    const id = useId();

    useEffect(() => {
        if (!abierto) return;

        function cerrarFuera(event: PointerEvent) {
            if (!contenedor.current?.contains(event.target as Node)) {
                setAbierto(false);
            }
        }

        document.addEventListener("pointerdown", cerrarFuera);
        return () => document.removeEventListener("pointerdown", cerrarFuera);
    }, [abierto]);

    async function salir() {
        if (ocupado.current) return;
        if (!window.confirm("¿Querés cerrar sesión?")) return;

        ocupado.current = true;
        setCerrando(true);
        setError("");

        try {
            const confirmado = await cerrarSesion();

            if (!confirmado) {
                window.alert(
                    "Se cerró la sesión en este navegador, pero no pudimos confirmar el cierre en el servidor."
                );
            }
            window.location.replace("/");
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "No pudimos cerrar sesión."
            );
            ocupado.current = false;
            setCerrando(false);
        }
    }

    if (!sesion) return null;

    return (
        <div
            ref={contenedor}
            className={styles.contenedor}
            onKeyDown={(event) => {
                if (event.key === "Escape" && abierto) {
                    event.preventDefault();
                    setAbierto(false);
                    boton.current?.focus();
                }
            }}
            onBlur={(event) => {
                if (
                    event.relatedTarget &&
                    !event.currentTarget.contains(event.relatedTarget as Node)
                ) {
                    setAbierto(false);
                }
            }}
        >
            <button
                ref={boton}
                type="button"
                className={styles.disparador}
                aria-expanded={abierto}
                aria-controls={`${id}-menu`}
                aria-label={`Menú de ${sesion.usuario}`}
                onClick={() => setAbierto((valor) => !valor)}
            >
                <AvatarUsuario
                    nombre={sesion.nombre}
                    apellido={sesion.apellido}
                    className={styles.avatarMiniatura}
                />
                <span className={styles.nombreUsuario}>{sesion.usuario}</span>
                <span className={styles.flecha} aria-hidden="true">
                    {abierto ? "▴" : "▾"}
                </span>
            </button>

            {abierto && (
                <ul id={`${id}-menu`} className={styles.menu}>
                    <li>
                        <Link
                            href={enPanel ? "/home" : "/perfil"}
                            className={styles.opcion}
                            onClick={() => setAbierto(false)}
                        >
                            {enPanel ? "Ver catálogo" : "Ver perfil"}
                        </Link>
                    </li>
                    <li>
                        <button
                            type="button"
                            className={styles.opcion}
                            onClick={salir}
                            disabled={cerrando}
                            aria-busy={cerrando}
                        >
                            {cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
                        </button>
                    </li>
                </ul>
            )}

            {error && (
                <p role="alert" className={styles.error}>
                    {error}
                </p>
            )}
        </div>
    );
}
