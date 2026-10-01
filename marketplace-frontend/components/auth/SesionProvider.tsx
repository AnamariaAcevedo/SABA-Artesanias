"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

type Sesion = {
    id: number;
    usuario: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    permisos: string[];
};

type ContextoSesion = {
    sesion: Sesion | null;
    cargando: boolean;
    error: string;
    tienePermiso: (permiso: string) => boolean;
    actualizar: () => Promise<void>;
};

const SesionContext = createContext<ContextoSesion | null>(null);

export default function SesionProvider({
                                           children,
                                       }: {
    children: ReactNode;
}) {
    const pathname = usePathname();
    const [sesion, setSesion] = useState<Sesion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const solicitud = useRef(0);

    const actualizar = useCallback(async () => {
        const numero = ++solicitud.current;
        setCargando(true);
        setError("");

        try {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setSesion(null);
                return;
            }

            const datos = await apiFetch<Sesion>("/me");

            // Ignora respuestas anteriores o de otra sesión.
            if (
                numero !== solicitud.current ||
                token !== localStorage.getItem("accessToken")
            ) {
                return;
            }

            setSesion(datos);
        } catch (cause) {
            if (numero !== solicitud.current) return;

            setSesion(null);

            if (cause instanceof ApiError && cause.status === 401) {
                setError("Tu sesión venció. Volvé a iniciar sesión.");
            } else {
                setError(
                    cause instanceof Error
                        ? cause.message
                        : "No pudimos verificar tu sesión."
                );
            }
        } finally {
            if (numero === solicitud.current) {
                setCargando(false);
            }
        }
    }, []);

    useEffect(() => {
        // Al navegar, vuelve a consultar los permisos vigentes.
        void actualizar();

        function alCambiarStorage(event: StorageEvent) {
            if (event.key === "accessToken" || event.key === null) {
                void actualizar();
            }
        }

        function alCambiarSesion() {
            void actualizar();
        }

        window.addEventListener("storage", alCambiarStorage);
        window.addEventListener("sesion-cambiada", alCambiarSesion);

        return () => {
            solicitud.current++;
            window.removeEventListener("storage", alCambiarStorage);
            window.removeEventListener(
                "sesion-cambiada",
                alCambiarSesion
            );
        };
    }, [pathname, actualizar]);

    return (
        <SesionContext.Provider
            value={{
                sesion,
                cargando,
                error,
                actualizar,
                tienePermiso: (permiso) =>
                    !cargando &&
                    !error &&
                    (sesion?.permisos.includes(permiso) ?? false),
            }}
        >
            {children}
        </SesionContext.Provider>
    );
}

export function useSesion() {
    const contexto = useContext(SesionContext);

    if (!contexto) {
        throw new Error(
            "useSesion debe usarse dentro de SesionProvider."
        );
    }

    return contexto;
}