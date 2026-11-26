import adminStyles from "@/components/admin/admin.module.css";
import { etiquetaEstado } from "@/lib/pedidos";
import styles from "./pedidos.module.css";

const CLASE_ESTADO: Record<string, string> = {
  PENDIENTE: adminStyles.badgePendiente,
  CONFIRMADO: styles.badgeConfirmado,
  ENVIADO: styles.badgeEnviado,
  ENTREGADO: adminStyles.badgeAceptada,
  CANCELADO: adminStyles.badgeRechazada,
};

export default function EstadoPedidoBadge({ estado }: { estado: string }) {
  return (
    <span className={`${adminStyles.badge} ${CLASE_ESTADO[estado] ?? adminStyles.badgeInactivo}`}>
      {etiquetaEstado(estado)}
    </span>
  );
}
