function Header({ usuario, onLogout }) {
  return (
    <header className="main-header">
      <div className="main-header-content">
        <div>
          <h1>🥫 Despensa Antidesperdicio</h1>
          <p>Sistema de gestión de alimentos</p>
        </div>

        <div className="header-user">
          <div>
            <strong>👤 {usuario.name}</strong>
            <span>{usuario.email}</span>
          </div>

          <button type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;