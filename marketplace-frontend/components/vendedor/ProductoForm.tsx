"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import vendedorStyles from "@/components/vendedor/vendedor.module.css";
import { useSesion } from "@/components/auth/SesionProvider";
import { ApiError, apiFetch } from "@/lib/api";
import { ACCESO, cumplePermisos } from "@/lib/access";
import type { Producto } from "@/types/Producto";
import type { Tienda } from "@/types/Tienda";

interface ProductoFormProps {
  modo: "crear" | "editar";
  productoId?: number;
  valoresIniciales?: Producto;
}

function numeroOpcional(valor: string): number | null {
  return valor.trim() === "" ? null : Number(valor);
}

export default function ProductoForm({ modo, productoId, valoresIniciales }: ProductoFormProps) {
  const router = useRouter();
  const { sesion } = useSesion();
  const enviandoRef = useRef(false);

  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(valoresIniciales?.descripcion ?? "");
  const [precio, setPrecio] = useState(valoresIniciales ? String(valoresIniciales.precio) : "");
  const [descuento, setDescuento] = useState(
    valoresIniciales?.descuento != null ? String(valoresIniciales.descuento) : "",
  );
  const [cantidadDisponible, setCantidadDisponible] = useState(
    valoresIniciales ? String(valoresIniciales.cantidadDisponible) : "",
  );
  const [idTienda, setIdTienda] = useState(valoresIniciales ? String(valoresIniciales.idTienda) : "");

  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function cargarTiendas() {
      try {
        const data = await apiFetch<Tienda[]>("/tiendas?page=1&perPage=100");
        if (!cancelado) setTiendas(data);
      } catch (cause) {
        if (!cancelado) {
          setError(cause instanceof ApiError ? cause.message : "No pudimos cargar las tiendas.");
        }
      } finally {
        if (!cancelado) setCargandoOpciones(false);
      }
    }
    cargarTiendas();
    return () => {
      cancelado = true;
    };
  }, []);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");
    setGuardado(false);

    if (
      !nombre.trim() ||
      !descripcion.trim() ||
      precio.trim() === "" ||
      cantidadDisponible.trim() === "" ||
      !idTienda
    ) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    const precioNumero = Number(precio);
    const descuentoNumero = numeroOpcional(descuento);
    const cantidadNumero = Number(cantidadDisponible);
    if (!Number.isFinite(precioNumero) || precioNumero < 0) {
      setError("El precio debe ser un número mayor o igual a 0.");
      return;
    }
    if (descuentoNumero !== null && (!Number.isFinite(descuentoNumero) || descuentoNumero < 0)) {
      setError("El descuento debe ser un número mayor o igual a 0.");
      return;
    }
    if (!Number.isInteger(cantidadNumero) || cantidadNumero < 0) {
      setError("La cantidad disponible debe ser un número entero mayor o igual a 0.");
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: precioNumero,
      descuento: descuentoNumero,
      cantidadDisponible: cantidadNumero,
      idTienda: Number(idTienda),
    };

    enviandoRef.current = true;
    setEnviando(true);
    try {
      if (modo === "crear") {
        const creado = await apiFetch<Producto>("/productos", {
          method: "POST",
          body: JSON.stringify(datos),
        });
        // Las imágenes se suben sobre un producto existente: tras crearlo se
        // pasa a su edición para cargarlas, si el vendedor tiene ese permiso.
        const puedeSubir = sesion ? cumplePermisos(sesion.permisos, ACCESO.subirImagenes) : false;
        router.push(puedeSubir ? `/vendedor/productos/${creado.id}/editar#imagenes` : "/vendedor/productos");
        return;
      }

      await apiFetch(`/productos/${productoId}`, {
        method: "PUT",
        body: JSON.stringify(datos),
      });
      setGuardado(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos guardar el producto.");
    }
    enviandoRef.current = false;
    setEnviando(false);
  }

  return (
    <div className={`${styles.card} ${styles.formCard}`}>
      <form onSubmit={enviar} className={styles.form} aria-busy={enviando}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              required
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="idTienda">Tienda</label>
            <select
              id="idTienda"
              required
              disabled={cargandoOpciones}
              value={idTienda}
              onChange={(e) => setIdTienda(e.target.value)}
            >
              <option value="">{cargandoOpciones ? "Cargando tiendas…" : "Seleccioná una tienda"}</option>
              {tiendas.map((tienda) => (
                <option key={tienda.id} value={tienda.id}>
                  {tienda.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            required
            className={vendedorStyles.textarea}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="precio">Precio (GS)</label>
            <input
              id="precio"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              required
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="cantidadDisponible">Cantidad disponible</label>
            <input
              id="cantidadDisponible"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              required
              value={cantidadDisponible}
              onChange={(e) => setCantidadDisponible(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="descuento">Descuento (opcional)</label>
            <input
              id="descuento"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {guardado && (
          <p role="status" className={styles.notice}>
            Cambios guardados.
          </p>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.buttonOutline}
            onClick={() => router.push("/vendedor/productos")}
            disabled={enviando}
          >
            {modo === "crear" ? "Cancelar" : "Volver"}
          </button>
          <button type="submit" disabled={enviando || cargandoOpciones} className={styles.buttonPrimary}>
            {enviando ? "Guardando…" : modo === "crear" ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
