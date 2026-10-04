import styles from "./menuUsuario.module.css";

type Props = {
    nombre: string;
    apellido: string;
    className?: string;
};

// Foto de perfil del usuario. Por ahora muestra las iniciales; cuando el
// backend permita subir la foto, renderizar acá un <img> (el CSS ya lo
// recorta en círculo).
export default function AvatarUsuario({ nombre, apellido, className }: Props) {
    const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

    return (
        <span className={`${styles.avatar} ${className ?? ""}`} aria-hidden="true">
            {iniciales}
        </span>
    );
}
