"use client";

import { useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import { apiFetchConPaginacion } from "@/lib/api";

type Opcion = {
  id: number;
  nombre: string;
};

function useOpcionesPorPadre(ruta: string | null) {
  const [opciones, setOpciones] = useState<Opcion[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setOpciones([]);
      if (!ruta) return;

      setCargando(true);
      try {
        const resultado = await apiFetchConPaginacion<Opcion[]>(`${ruta}&perPage=100`);
        if (!cancelado) setOpciones(resultado.data);
      } catch {
        if (!cancelado) setOpciones([]);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [ruta]);

  return { opciones, cargando };
}

interface UbicacionSelectsProps {
  onBarrioChange: (idBarrio: number | null) => void;
}

export default function UbicacionSelects({ onBarrioChange }: UbicacionSelectsProps) {
  const [idPais, setIdPais] = useState("");
  const [idDepartamento, setIdDepartamento] = useState("");
  const [idCiudad, setIdCiudad] = useState("");
  const [idBarrio, setIdBarrio] = useState("");

  const { opciones: paises, cargando: cargandoPaises } = useOpcionesPorPadre("/paises?page=1");
  const { opciones: departamentos, cargando: cargandoDepartamentos } = useOpcionesPorPadre(
    idPais ? `/departamentos?idPais=${idPais}&page=1` : null,
  );
  const { opciones: ciudades, cargando: cargandoCiudades } = useOpcionesPorPadre(
    idDepartamento ? `/ciudades?idDepartamento=${idDepartamento}&page=1` : null,
  );
  const { opciones: barrios, cargando: cargandoBarrios } = useOpcionesPorPadre(
    idCiudad ? `/barrios?idCiudad=${idCiudad}&page=1` : null,
  );

  useEffect(() => {
    onBarrioChange(idBarrio ? Number(idBarrio) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idBarrio]);

  function cambiarPais(valor: string) {
    setIdPais(valor);
    setIdDepartamento("");
    setIdCiudad("");
    setIdBarrio("");
  }

  function cambiarDepartamento(valor: string) {
    setIdDepartamento(valor);
    setIdCiudad("");
    setIdBarrio("");
  }

  function cambiarCiudad(valor: string) {
    setIdCiudad(valor);
    setIdBarrio("");
  }

  return (
    <div className={styles.rowQuad}>
      <div className={styles.field}>
        <label htmlFor="idPais">País</label>
        <select
          id="idPais"
          required
          disabled={cargandoPaises}
          value={idPais}
          onChange={(e) => cambiarPais(e.target.value)}
        >
          <option value="">Seleccioná un país</option>
          {paises.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>
              {opcion.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="idDepartamento">Departamento</label>
        <select
          id="idDepartamento"
          required
          disabled={!idPais || cargandoDepartamentos}
          value={idDepartamento}
          onChange={(e) => cambiarDepartamento(e.target.value)}
        >
          <option value="">Seleccioná un departamento</option>
          {departamentos.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>
              {opcion.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="idCiudad">Ciudad</label>
        <select
          id="idCiudad"
          required
          disabled={!idDepartamento || cargandoCiudades}
          value={idCiudad}
          onChange={(e) => cambiarCiudad(e.target.value)}
        >
          <option value="">Seleccioná una ciudad</option>
          {ciudades.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>
              {opcion.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="idBarrio">Barrio</label>
        <select
          id="idBarrio"
          required
          disabled={!idCiudad || cargandoBarrios}
          value={idBarrio}
          onChange={(e) => setIdBarrio(e.target.value)}
        >
          <option value="">Seleccioná un barrio</option>
          {barrios.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>
              {opcion.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
