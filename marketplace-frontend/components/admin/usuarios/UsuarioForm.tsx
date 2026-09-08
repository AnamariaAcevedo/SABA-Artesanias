"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import UbicacionFields from "@/components/auth/UbicacionFields";
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
  const [activo, setActivo] = useState(valoresIniciales?.activo ?? true);

  // Solo para editar: reasignar una dirección ya cargada. En "crear" la
  // dirección se ingresa embebida (mismos campos que /registro).
  const [idDireccion, setIdDireccion] = useState(
    valoresIniciales?.idDireccion ? String(valoresIniciales.idDireccion) : "",
  );
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);

  // Solo para crear: dirección nueva embebida en el alta.
  const [nombreEdificio, setNombreEdificio] = useState("");
  const hayEdificio = nombreEdificio.trim().length > 0;
  const campoNumero = hayEdificio ? "nroDepartamento" : "nroCasa";

  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarOpciones() {
      try {
        const rolesData = await apiFetch<Rol[]>("/roles/options");
        if (cancelado) return;
        setRoles(rolesData);
        if (modo === "editar") {
          const direccionesResultado = await apiFetchConPaginacion<Direccion[]>("/direcciones?page=1&perPage=100");
          if (!cancelado) setDirecciones(direccionesResultado.data);
        }
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
  }, [modo]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");

    if (!nombre.trim() || !apellido.trim() || !usuario.trim() || !email.trim() || !idRol) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    if (modo === "crear" && contrasenha.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (modo === "editar" && !idDireccion) {
      setError("Completá todos los campos obligatorios.");
      return;
    }

    // Datos de la dirección nueva (solo modo "crear"): calle y número vienen
    // de inputs sin controlar, e idBarrio de un input hidden que arma
    // UbicacionFields, igual que en /registro.
    let calle = "";
    let numero = "";
    let idBarrio = 0;
    if (modo === "crear") {
      const datosForm = new FormData(event.currentTarget);
      const valorForm = (campo: string) => String(datosForm.get(campo) ?? "").trim();
      calle = valorForm("calle");
      numero = valorForm(campoNumero);
      idBarrio = Number(valorForm("idBarrio"));

      if (!calle || !numero) {
        setError("Completá la calle y el número de la dirección.");
        return;
      }
      if (!Number.isSafeInteger(idBarrio) || idBarrio <= 0) {
        setError("Completá la ubicación hasta seleccionar un barrio.");
        return;
      }
      if (!hayEdificio && (!/^\d+$/.test(numero) || Number(numero) > 2147483647)) {
        setError("El número de casa debe ser un número entero. Si corresponde a un departamento, completá el nombre del edificio.");
        return;
      }
      if (hayEdificio && numero.length > 50) {
        setError("El número de departamento no puede superar los 50 caracteres.");
        return;
      }
    }

    enviandoRef.current = true;
    setEnviando(true);
    try {
      if (modo === "crear") {
        const direccionCreada = await apiFetch<Direccion>("/direcciones", {
          method: "POST",
          body: JSON.stringify({
            calle,
            nombreEdificio: hayEdificio ? nombreEdificio.trim() : null,
            nroCasa: hayEdificio ? null : Number(numero),
            nroDepartamento: hayEdificio ? numero : null,
            idBarrio,
          }),
        });
        try {
          await apiFetch("/usuarios", {
            method: "POST",
            body: JSON.stringify({
              nombre: nombre.trim(),
              apellido: apellido.trim(),
              usuario: usuario.trim(),
              email: email.trim(),
              contrasenha,
              idRol: Number(idRol),
              idDireccion: direccionCreada.id,
            }),
          });
        } catch (cause) {
          // La dirección ya quedó creada aunque el usuario haya fallado.
          const mensaje = cause instanceof ApiError ? cause.message : "No pudimos crear el usuario.";
          throw new Error(`${mensaje} La dirección ya se guardó; si reintentás, se creará una nueva.`);
        }
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
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el usuario.");
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

        {modo === "crear" ? (
          <>
            <UbicacionFields onSelectionChange={() => setError("")} />
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="calle">Calle</label>
                <input id="calle" name="calle" autoComplete="address-line1" maxLength={100} required />
              </div>
              <div className={styles.field}>
                <label htmlFor="numeroDireccion">{hayEdificio ? "Nro. de departamento" : "Nro. de casa"}</label>
                <input
                  id="numeroDireccion"
                  name={campoNumero}
                  type="text"
                  inputMode={hayEdificio ? "text" : "numeric"}
                  required
                  aria-describedby="numero-direccion-ayuda"
                />
                <small id="numero-direccion-ayuda">
                  {hayEdificio ? "Podés usar números y letras, por ejemplo: 4B." : "Ingresá solo números."}
                </small>
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="nombreEdificio">Nombre de edificio (opcional)</label>
              <input
                id="nombreEdificio"
                type="text"
                maxLength={100}
                value={nombreEdificio}
                onChange={(e) => setNombreEdificio(e.target.value)}
              />
            </div>
          </>
        ) : (
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
        )}

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
