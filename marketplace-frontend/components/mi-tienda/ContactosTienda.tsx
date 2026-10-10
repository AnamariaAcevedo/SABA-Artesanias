"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import miTiendaStyles from "@/components/mi-tienda/miTienda.module.css";
import { ApiError, apiFetch, apiFetchConPaginacion } from "@/lib/api";
import type { Contacto, MiContactoInput, TipoContacto } from "@/types/miTienda";

// Sección de contactos de la tienda (WhatsApp, Instagram, etc.), que se muestra
// debajo de los datos de la tienda. Solo para el dueño.
export default function ContactosTienda() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [tipos, setTipos] = useState<TipoContacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState<Contacto | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const [contactosData, tiposData] = await Promise.all([
          apiFetch<Contacto[]>("/mi-tienda/contactos"),
          apiFetchConPaginacion<TipoContacto[]>("/tipos-contacto?page=1&perPage=100"),
        ]);
        if (cancelado) return;
        setContactos(contactosData);
        setTipos(tiposData.data);
      } catch (cause) {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar los contactos.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargar();
    return () => {
      cancelado = true;
    };
  }, []);

  async function eliminar(contacto: Contacto) {
    if (!window.confirm(`¿Eliminar el contacto de ${contacto.nombreTipoContacto} (${contacto.usuario})?`)) return;
    setEliminando(contacto.id);
    setError("");
    try {
      await apiFetch(`/mi-tienda/contactos/${contacto.id}`, { method: "DELETE" });
      setContactos((actual) => actual.filter((otro) => otro.id !== contacto.id));
      if (editando?.id === contacto.id) setEditando(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos eliminar el contacto.");
    } finally {
      setEliminando(null);
    }
  }

  function guardado(contacto: Contacto) {
    setContactos((actual) =>
      actual.some((otro) => otro.id === contacto.id)
        ? actual.map((otro) => (otro.id === contacto.id ? contacto : otro))
        : [...actual, contacto],
    );
    setEditando(null);
  }

  if (loading) return <p className={styles.notice}>Cargando contactos…</p>;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.title}>Contactos de la tienda</h2>
          <p className={styles.pageSubtitle}>Los clientes los ven en la página de tu tienda.</p>
        </div>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {contactos.length === 0 ? (
        <p className={styles.notice}>Todavía no agregaste contactos.</p>
      ) : (
        <ul className={styles.form} style={{ listStyle: "none", padding: 0, margin: "0 0 24px", gap: 0 }}>
          {contactos.map((contacto) => (
            <li key={contacto.id} className={miTiendaStyles.contacto}>
              <div className={miTiendaStyles.contactoDatos}>
                <strong>
                  {contacto.nombreTipoContacto} · {contacto.usuario}
                </strong>
                <small>
                  <a href={contacto.enlace} target="_blank" rel="noopener noreferrer">
                    {contacto.enlace}
                  </a>
                  {contacto.nroTelefono ? ` · Tel. ${contacto.nroTelefono}` : ""}
                </small>
              </div>
              <div className={styles.rowActions}>
                <button type="button" className={styles.linkAction} onClick={() => setEditando(contacto)}>
                  Editar
                </button>
                <button
                  type="button"
                  className={`${styles.linkAction} ${styles.linkActionDanger}`}
                  disabled={eliminando === contacto.id}
                  onClick={() => eliminar(contacto)}
                >
                  {eliminando === contacto.id ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* `key` reinicia el formulario al cambiar entre "agregar" y "editar". */}
      <ContactoForm
        key={editando?.id ?? "nuevo"}
        contacto={editando}
        tipos={tipos}
        onGuardado={guardado}
        onCancelar={() => setEditando(null)}
      />
    </div>
  );
}

interface ContactoFormProps {
  contacto: Contacto | null;
  tipos: TipoContacto[];
  onGuardado: (contacto: Contacto) => void;
  onCancelar: () => void;
}

function ContactoForm({ contacto, tipos, onGuardado, onCancelar }: ContactoFormProps) {
  const enviandoRef = useRef(false);
  const [idTipoContacto, setIdTipoContacto] = useState(contacto ? String(contacto.idTipoContacto) : "");
  const [usuario, setUsuario] = useState(contacto?.usuario ?? "");
  const [enlace, setEnlace] = useState(contacto?.enlace ?? "");
  const [nroTelefono, setNroTelefono] = useState(contacto?.nroTelefono ?? "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");

    if (!idTipoContacto || !usuario.trim() || !enlace.trim()) {
      setError("Completá el tipo, el usuario y el enlace.");
      return;
    }
    if (!/^https?:\/\/.+/.test(enlace.trim())) {
      setError("El enlace debe empezar con http:// o https://");
      return;
    }
    if (nroTelefono.trim() && !/^[0-9+ -]{6,20}$/.test(nroTelefono.trim())) {
      setError("El teléfono solo puede tener números, espacios, + y - (entre 6 y 20 caracteres).");
      return;
    }

    const datos: MiContactoInput = {
      idTipoContacto: Number(idTipoContacto),
      usuario: usuario.trim(),
      enlace: enlace.trim(),
      nroTelefono: nroTelefono.trim() || null,
    };

    enviandoRef.current = true;
    setEnviando(true);
    try {
      const resultado = await apiFetch<Contacto>(contacto ? `/mi-tienda/contactos/${contacto.id}` : "/mi-tienda/contactos", {
        method: contacto ? "PUT" : "POST",
        body: JSON.stringify(datos),
      });
      onGuardado(resultado);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el contacto.");
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className={styles.form} aria-busy={enviando}>
      <h3 className={styles.sectionSubtitle}>{contacto ? "Editar contacto" : "Agregar contacto"}</h3>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="idTipoContacto">Tipo</label>
          <select id="idTipoContacto" required value={idTipoContacto} onChange={(e) => setIdTipoContacto(e.target.value)}>
            <option value="">Seleccioná un tipo</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="usuarioContacto">Usuario o nombre visible</label>
          <input id="usuarioContacto" required maxLength={100} value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="enlace">Enlace</label>
          <input
            id="enlace"
            type="url"
            required
            maxLength={255}
            placeholder="https://"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="nroTelefono">Teléfono (opcional)</label>
          <input
            id="nroTelefono"
            type="tel"
            maxLength={20}
            value={nroTelefono}
            onChange={(e) => setNroTelefono(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.formActions}>
        {contacto && (
          <button type="button" className={styles.buttonOutline} onClick={onCancelar} disabled={enviando}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={enviando} className={styles.buttonPrimary}>
          {enviando ? "Guardando…" : contacto ? "Guardar cambios" : "Agregar contacto"}
        </button>
      </div>
    </form>
  );
}
