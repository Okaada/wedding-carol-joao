import { getAdminUsers } from "@/app/actions/admin-users";
import { formatDate } from "@/lib/format";
import StatsCard from "@/components/admin/StatsCard";
import CreateUserForm from "@/components/admin/CreateUserForm";
import DeleteUserButton from "@/components/admin/DeleteUserButton";

export default async function UsersPage() {
  const users = await getAdminUsers();

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
        Usuarios
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatsCard label="Total de administradores" value={users.length} />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Novo administrador
        </h2>
        <CreateUserForm />
      </div>

      <div className="overflow-x-auto rounded-lg border border-accent">
        <table className="min-w-max w-full text-left text-sm">
          <thead className="border-b border-accent bg-section-alt">
            <tr>
              <th className="px-4 py-3 font-medium text-muted">Nome</th>
              <th className="px-4 py-3 font-medium text-muted">Email</th>
              <th className="px-4 py-3 font-medium text-muted">Criado em</th>
              <th className="px-4 py-3 font-medium text-muted" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Nenhum administrador cadastrado.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-accent/50 last:border-0"
                >
                  <td className="px-4 py-3 text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteUserButton userId={user._id} userName={user.name} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
