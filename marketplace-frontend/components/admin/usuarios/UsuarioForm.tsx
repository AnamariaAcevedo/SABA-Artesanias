"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import { ApiError, apiFetch, apiFetchConPaginacion } from "@/lib/api";
import { etiquetaDireccion, type Direccion } from "@/types/direccion";
import type { Rol } from "@/types/rol";
import type { Usuario } from "@/types/usuario";

interface UsuarioFormProps {
  modo: "crear" | "editar";
  usuarioId?: number;
  valoresIniciales?: Usuario;
}

export default function UsuarioForm({ modo, usuarioId, valoresIniciales }: UsuarioFormProps) {
  const router = useRouter();
  const enviandoRef = useRef(false);

  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? "");
  const [apellido, setApellido] = useState(valoresIniciales?.apellido ?? "");
  const [usuario, setUsuario] = useState(valoresIniciales?.usuario ?? "");
  const [email, setEmail] = useState(valoresIniciales?.email ?? "");
  const [contrasenha, setContrasenha] = useState("");
  const [idRol, setIdRol] = useState(valoresIniciales?.idRol ? String(valoresIniciales.idRol) : "");
  const [idDireccion, setIdDireccion] = useState(
    valoresIniciales?.idDireccion ? String(valoresIniciales.idDireccion) : "",
  );
  const [activo, setActivo] = useState(valoresIniciales?.activo ?? true);

  const [roles, setRoles] = useState<Rol[]>([]);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarOpciones() {
      try {
        const [rolesData, direccionesResultado] = await Promise.all([
          apiFetch<Rol[]>("/roles/options"),
          apiFetchConPaginacion<Direccion[]>("/direcciones?page=1&perPage=100"),
        ]);
        if (cancelado) return;
        setRoles(rolesData);
        setDirecciones(direccionesResultado.data);
      } catch (cause) {
        if (!cancelado) {
          setError(cause instanceof ApiError ? cause.message : "No pudimos cargar las opciones del formulario.");
        }
      } finally {
        if (!cancelado) setCargandoOpciones(false);
      }
    }
    cargarOpciones();
    return () => {
      cancelado = true;
    };
  }, []);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");

    if (!nombre.trim() || !apellido.trim() || !usuario.trim() || !email.trim() || !idRol || !idDireccion) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    if (modo === "crear" && contrasenha.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    try {
      if (modo === "crear") {
        await apiFetch("/usuarios", {
          method: "POST",
          body: JSON.stringify({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            usuario: usuario.trim(),
            email: email.trim(),
            contrasenha,
            idRol: Number(idRol),
            idDireccion: Number(idDireccion),
          }),
        });
      } else {
        await apiFetch(`/usuarios/${usuarioId}`, {
          method: "PUT",
          body: JSON.stringify({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            usuario: usuario.trim(),
            email: email.trim(),
            idRol: Number(idRol),
            idDireccion: Number(idDireccion),
            activo,
          }),
        });
      }
      router.push("/admin/usuarios");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos guardar el usuario.");
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className={`${styles.card} ${styles.formCard}`}>
      <form onSubmit={enviar} className={styles.form} aria-busy={enviando}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" required value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="usuario">Nombre de usuario</label>
          <input
            id="usuario"
            required
            autoCapitalize="none"
            spellCheck={false}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {modo === "crear" && (
          <div className={styles.field}>
            <label htmlFor="contrasenha">Contraseña</label>
            <input
              id="contrasenha"
              type="password"
              required
              minLength={8}
              value={contrasenha}
              onChange={(e) => setContrasenha(e.target.value)}
            />
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="idRol">Rol</label>
            <select id="idRol" required disabled={cargandoOpciones} value={idRol} onChange={(e) => setIdRol(e.target.value)}>
              <option value="">Seleccioná un rol</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="idDireccion">Dirección</label>
            <select
              id="idDireccion"
              required
              disabled={cargandoOpciones}
              value={idDireccion}
              onChange={(e) => setIdDireccion(e.target.value)}
            >
              <option value="">Seleccioná una dirección</option>
              {direcciones.map((direccion) => (
                <option key={direccion.id} value={direccion.id}>
                  {etiquetaDireccion(direccion)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {modo === "editar" && (
          <label htmlFor="activo" className={styles.checkboxField}>
            <input id="activo" type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Usuario activo
          </label>
        )}

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando || cargandoOpciones} className={styles.buttonPrimary}>
          {enviando ? "Guardando…" : modo === "crear" ? "Crear usuario" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
