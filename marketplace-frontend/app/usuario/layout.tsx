import Link from "next/link";

export default function AdminLayout({
                                        children,
                                    }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div>
            <header>
                <h1>SABA - Administración</h1>
            </header>

            <nav>
                <Link href="/admin">Dashboard</Link>
                {" | "}
                <Link href="/admin/productos">Productos</Link>
                {" | "}
                <Link href="/admin/usuarios">Usuarios</Link>
                {" | "}
                <Link href="/admin/pedidos">Pedidos</Link>
            </nav>

            <main>
                {children}
            </main>
        </div>
    );
}