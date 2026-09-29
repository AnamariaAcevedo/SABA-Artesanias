import { apiFetch } from "@/lib/api";

export async function cerrarSesion(): Promise<boolean> {
    let confirmado = false;

    try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
            await apiFetch<void>("/logout", {
                method: "POST",
                body: JSON.stringify({ refreshToken }),
            });

            confirmado = true;
        }
    } catch {
    } finally {
        try {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.dispatchEvent(new Event("sesion-cambiada"));
        } catch {
            throw new Error(
                "No pudimos borrar la sesión del navegador. Eliminá los datos de este sitio para cerrar sesión."
            );
        }
    }
    return confirmado;
}