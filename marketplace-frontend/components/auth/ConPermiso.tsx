"use client";

import type { ReactNode } from "react";
import { useSesion } from "@/components/auth/SesionProvider";
import { cumplePermisos } from "@/lib/access";

export default function ConPermiso({
                                       permisos,
                                       children,
                                   }: {
    permisos: readonly string[];
    children: ReactNode;
}) {
    const { sesion, cargando, error } = useSesion();

    if (
        cargando ||
        error ||
        !sesion ||
        !cumplePermisos(sesion.permisos, permisos)
    ) {
        return null;
    }

    return <>{children}</>;
}