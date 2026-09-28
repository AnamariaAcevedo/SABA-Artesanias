"use client";

import { useRef, useState } from "react";
import { cerrarSesion } from "@/lib/logout";
import { useRolSesion } from "@/lib/auth";

type Props = {
    className?: string;
};

export default function LogoutButton({ className }: Props) {
    const rol = useRolSesion();
    const ocupado = useRef(false);
    const [cerrando, setCerrando] = useState(false);
    const [error, setError] = useState("");

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

    if (!rol) return null;
    return (
        <div>
            <button
                type="button"
                className={className}
                onClick={salir}
                disabled={cerrando}
                aria-busy={cerrando}
            >
                {cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>

            {error && <p role="alert">{error}</p>}
        </div>
    );
}