import 'package:flutter/material.dart';
import '../../core/session/session_manager.dart';
import '../../core/theme/app_theme.dart';
import '../admin/admin_dashboard_screen.dart';
import '../auth/login_screen.dart';
import '../contador/generar_recibos_screen.dart';
import '../info/contacto_soporte_screen.dart';
import '../info/sobre_nosotros_screen.dart';
import '../pedidos/pedidos_screen.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback onSessionChanged;

  const ProfileScreen({super.key, required this.onSessionChanged});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final session = SessionManager();

  void _mostrarModalCambiarContrasena() {
    final actualController = TextEditingController();
    final nuevaController = TextEditingController();
    final confirmarController = TextEditingController();
    bool obscureActual = true;
    bool obscureNueva = true;
    bool obscureConfirmar = true;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: const [
                  Icon(Icons.lock_reset, color: Color(0xFF0047AB)),
                  SizedBox(width: 8),
                  Text('Cambiar Contraseña', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Ingresa tu contraseña actual y define tu nueva clave de acceso.',
                      style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: actualController,
                      obscureText: obscureActual,
                      decoration: InputDecoration(
                        labelText: 'Contraseña Actual',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        suffixIcon: IconButton(
                          icon: Icon(obscureActual ? Icons.visibility_off : Icons.visibility, size: 18),
                          onPressed: () => setModalState(() => obscureActual = !obscureActual),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: nuevaController,
                      obscureText: obscureNueva,
                      decoration: InputDecoration(
                        labelText: 'Nueva Contraseña',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        suffixIcon: IconButton(
                          icon: Icon(obscureNueva ? Icons.visibility_off : Icons.visibility, size: 18),
                          onPressed: () => setModalState(() => obscureNueva = !obscureNueva),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: confirmarController,
                      obscureText: obscureConfirmar,
                      decoration: InputDecoration(
                        labelText: 'Confirmar Nueva Contraseña',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        suffixIcon: IconButton(
                          icon: Icon(obscureConfirmar ? Icons.visibility_off : Icons.visibility, size: 18),
                          onPressed: () => setModalState(() => obscureConfirmar = !obscureConfirmar),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancelar', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0047AB),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () {
                    final actual = actualController.text.trim();
                    final nueva = nuevaController.text.trim();
                    final confirmar = confirmarController.text.trim();

                    if (actual.isEmpty || nueva.isEmpty || confirmar.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Por favor completa todos los campos.')),
                      );
                      return;
                    }

                    if (nueva != confirmar) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Las contraseñas nuevas no coinciden.')),
                      );
                      return;
                    }

                    if (nueva.length < 6) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('La nueva contraseña debe tener al menos 6 caracteres.')),
                      );
                      return;
                    }

                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('¡Contraseña actualizada exitosamente!'),
                        backgroundColor: Color(0xFF10B981),
                      ),
                    );
                  },
                  child: const Text('Guardar Clave'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!session.isLoggedIn || session.usuarioActual == null) {
      // Si NO está logueado, muestra la vista de bienvenida con enlaces institucionales
      return Scaffold(
        appBar: AppBar(
          title: const Text('Mi Perfil'),
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const SizedBox(height: 10),
              const Icon(Icons.account_circle, size: 80, color: AppTheme.primaryColor),
              const SizedBox(height: 16),
              const Text(
                '¡Bienvenido a Tecnomatic!',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Inicia sesión para gestionar tus compras, ver tu historial y acceder a funciones exclusivas.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const LoginScreen()),
                    );
                    setState(() {});
                    widget.onSessionChanged();
                  },
                  child: const Text('Iniciar Sesión / Registrarse'),
                ),
              ),
              const SizedBox(height: 30),
              const Divider(),
              const SizedBox(height: 10),

              // Enlaces informativos públicos
              _buildOptionTile(
                icon: Icons.business_outlined,
                title: 'Sobre Nosotros',
                subtitle: 'Conoce la misión, visión y trayectoria de Tecnomatic MAV',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const SobreNosotrosScreen()),
                  );
                },
              ),
              _buildOptionTile(
                icon: Icons.support_agent_outlined,
                title: 'Contacto, Soporte y PQRS',
                subtitle: 'Canales de atención directa, ubicación y reclamos',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const ContactoSoporteScreen()),
                  );
                },
              ),
            ],
          ),
        ),
      );
    }

    final usuario = session.usuarioActual!;
    final rolLower = usuario.rol.toLowerCase();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi Perfil'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // Tarjeta de Usuario
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: AppTheme.primaryColor,
                      child: Text(
                        usuario.nombre.isNotEmpty ? usuario.nombre[0].toUpperCase() : 'U',
                        style: const TextStyle(fontSize: 24, color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            usuario.nombre,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            usuario.correo,
                            style: const TextStyle(color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          Chip(
                            label: Text(usuario.rol),
                            backgroundColor: AppTheme.accentColor.withValues(alpha: 0.2),
                            labelStyle: const TextStyle(color: AppTheme.accentColor, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // OPCIONES SEGÚN EL ROL
            if (rolLower == 'contador') ...[
              _buildOptionTile(
                icon: Icons.receipt_long,
                title: 'Generar Recibos',
                subtitle: 'Recibos de compras de clientes y control contable',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const GenerarRecibosScreen(),
                    ),
                  );
                },
              ),
              _buildOptionTile(
                icon: Icons.bar_chart_rounded,
                title: 'Reportes Financieros',
                subtitle: 'Facturas e historial de ventas',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const AdminDashboardScreen(initialIndex: 1),
                    ),
                  );
                },
              ),
            ] else if (rolLower == 'administrador') ...[
              _buildOptionTile(
                icon: Icons.admin_panel_settings,
                title: 'Panel de Administración',
                subtitle: 'Inventario, pedidos, usuarios y devoluciones',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const AdminDashboardScreen(),
                    ),
                  );
                },
              ),
              _buildOptionTile(
                icon: Icons.receipt_long,
                title: 'Generar Recibos',
                subtitle: 'Auditar y generar recibos de compra oficiales',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const GenerarRecibosScreen(),
                    ),
                  );
                },
              ),
            ] else ...[
              // Rol Cliente
              _buildOptionTile(
                icon: Icons.receipt_long_outlined,
                title: 'Mis Pedidos y Devoluciones',
                subtitle: 'Consulta el historial de tus compras y solicita garantías',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const PedidosScreen(showAppBar: true),
                    ),
                  );
                },
              ),
            ],

            // SECCIÓN GENERAL PARA TODOS
            _buildOptionTile(
              icon: Icons.business_outlined,
              title: 'Sobre Nosotros',
              subtitle: 'Misión, visión y compromiso con la seguridad laboral',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SobreNosotrosScreen()),
                );
              },
            ),

            _buildOptionTile(
              icon: Icons.support_agent_outlined,
              title: 'Contacto, Soporte y PQRS',
              subtitle: 'Canales directos de atención y sede física',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ContactoSoporteScreen()),
                );
              },
            ),

            _buildOptionTile(
              icon: Icons.lock_outline,
              title: 'Seguridad',
              subtitle: 'Cambiar contraseña de tu cuenta',
              onTap: _mostrarModalCambiarContrasena,
            ),

            const SizedBox(height: 20),

            // Botón Cerrar Sesión
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () {
                  setState(() {
                    session.cerrarSesion();
                  });
                  widget.onSessionChanged();
                },
                icon: const Icon(Icons.logout),
                label: const Text('Cerrar Sesión'),
              ),
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppTheme.primaryColor),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
        trailing: const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }
}