import 'package:flutter/material.dart';
import '../../core/session/session_manager.dart';
import '../../core/theme/app_theme.dart';
import '../../services/launcher/url_launcher_helper.dart';

class ContactoSoporteScreen extends StatefulWidget {
  const ContactoSoporteScreen({super.key});

  @override
  State<ContactoSoporteScreen> createState() => _ContactoSoporteScreenState();
}

class _ContactoSoporteScreenState extends State<ContactoSoporteScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nombreController = TextEditingController();
  final _correoController = TextEditingController();
  final _mensajeController = TextEditingController();

  String _tipoMensaje = 'opinion';
  bool _enviando = false;
  bool _enviado = false;

  @override
  void initState() {
    super.initState();
    final session = SessionManager();
    if (session.isLoggedIn && session.usuarioActual != null) {
      _nombreController.text = session.usuarioActual!.nombre;
      _correoController.text = session.usuarioActual!.correo;
    }
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _correoController.dispose();
    _mensajeController.dispose();
    super.dispose();
  }

  void _enviarMensaje() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _enviando = true;
    });

    await Future.delayed(const Duration(milliseconds: 900));

    if (!mounted) return;

    setState(() {
      _enviando = false;
      _enviado = true;
    });

    _mensajeController.clear();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: const [
            Icon(Icons.check_circle, color: Color(0xFF20B2AA)),
            SizedBox(width: 8),
            Text('¡Mensaje Enviado!'),
          ],
        ),
        content: const Text(
          'Hemos recibido tu consulta o reporte. Nos pondremos en contacto contigo lo antes posible.',
          style: TextStyle(fontSize: 14, color: Color(0xFF475569)),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0047AB),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Aceptar'),
          ),
        ],
      ),
    );
  }

  void _abrirWhatsApp() {
    PlatformUrlLauncher.openUrl('https://wa.me/573001234567');
  }

  void _abrirEmail() {
    PlatformUrlLauncher.openUrl('mailto:soporte@tecnomaticmav.com?subject=Consulta%20Tecnomatic%20MAV');
  }

  void _abrirMapa() {
    PlatformUrlLauncher.openUrl('https://www.google.com/maps/search/?api=1&query=Cl+17+Sur+%23+29A-56+Bogota+Colombia');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Contacto y Soporte PQRS'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Banner Superior
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0047AB), Color(0xFF002256)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border(
                  bottom: BorderSide(color: Color(0xFF20B2AA), width: 4),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF20B2AA).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'ESTAMOS PARA ESCUCHARTE',
                      style: TextStyle(
                        color: Color(0xFF20B2AA),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Atención y PQRS',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '¿Tienes opiniones, dudas, quejas o sugerencias? Háznoslo saber a continuación.',
                    style: TextStyle(fontSize: 13, color: Colors.white70),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Botones de Contacto Rápido
                  Row(
                    children: [
                      Expanded(
                        child: _buildCanalCard(
                          icon: Icons.chat_outlined,
                          title: 'WhatsApp',
                          sub: '+57 300 123 4567',
                          color: const Color(0xFF25D366),
                          onTap: _abrirWhatsApp,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildCanalCard(
                          icon: Icons.email_outlined,
                          title: 'Correo',
                          sub: 'soporte@tecnomaticmav.com',
                          color: const Color(0xFF0047AB),
                          onTap: _abrirEmail,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Formulario de Envío
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF0047AB)),
                              SizedBox(width: 8),
                              Text(
                                'Envíanos tu mensaje',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0047AB),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          if (_enviado) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(bottom: 14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFA7F3D0)),
                              ),
                              child: Row(
                                children: const [
                                  Icon(Icons.check_circle, color: Color(0xFF047857), size: 18),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      '¡Mensaje registrado! Te responderemos a la brevedad.',
                                      style: TextStyle(color: Color(0xFF047857), fontSize: 12.5),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          // Nombre
                          TextFormField(
                            controller: _nombreController,
                            decoration: InputDecoration(
                              labelText: 'Nombre Completo',
                              prefixIcon: const Icon(Icons.person_outline),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                            ),
                            validator: (v) => v == null || v.trim().isEmpty ? 'Ingresa tu nombre' : null,
                          ),
                          const SizedBox(height: 12),

                          // Correo
                          TextFormField(
                            controller: _correoController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              labelText: 'Correo Electrónico',
                              prefixIcon: const Icon(Icons.email_outlined),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                            ),
                            validator: (v) => v == null || !v.contains('@') ? 'Ingresa un correo válido' : null,
                          ),
                          const SizedBox(height: 12),

                          // Tipo de Mensaje
                          DropdownButtonFormField<String>(
                            initialValue: _tipoMensaje,
                            decoration: InputDecoration(
                              labelText: 'Tipo de Mensaje',
                              prefixIcon: const Icon(Icons.category_outlined),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'opinion', child: Text('Opinión / Retroalimentación')),
                              DropdownMenuItem(value: 'queja', child: Text('Queja / Petición (PQRS)')),
                              DropdownMenuItem(value: 'sugerencia', child: Text('Sugerencia')),
                              DropdownMenuItem(value: 'otro', child: Text('Otro Asunto')),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _tipoMensaje = val);
                            },
                          ),
                          const SizedBox(height: 12),

                          // Mensaje
                          TextFormField(
                            controller: _mensajeController,
                            maxLines: 4,
                            decoration: InputDecoration(
                              labelText: 'Mensaje Detallado',
                              alignLabelWithHint: true,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                            ),
                            validator: (v) => v == null || v.trim().length < 5 ? 'Escribe al menos 5 caracteres' : null,
                          ),
                          const SizedBox(height: 16),

                          SizedBox(
                            width: double.infinity,
                            height: 46,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF20B2AA),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: _enviando ? null : _enviarMensaje,
                              icon: _enviando
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Icon(Icons.send_rounded, size: 18),
                              label: Text(_enviando ? 'Enviando...' : 'Enviar Mensaje'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Ubicación Física
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.location_on_outlined, color: Color(0xFF0047AB)),
                            SizedBox(width: 8),
                            Text(
                              '¿Dónde estamos?',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0047AB),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Cl 17 Sur # 29A-56, Antonio Nariño, Bogotá D.C., Colombia.',
                          style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF0047AB),
                            side: const BorderSide(color: Color(0xFF0047AB)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: _abrirMapa,
                          icon: const Icon(Icons.map_outlined, size: 18),
                          label: const Text('Ver en Google Maps'),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCanalCard({
    required IconData icon,
    required String title,
    required String sub,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 2),
            Text(
              sub,
              style: const TextStyle(fontSize: 11, color: Colors.grey),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
