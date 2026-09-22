import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class SobreNosotrosScreen extends StatelessWidget {
  const SobreNosotrosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Sobre Nosotros'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Banner Superior
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
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
                      'CONÓCENOS',
                      style: TextStyle(
                        color: Color(0xFF20B2AA),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Tecnomatic MAV',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Seguridad industrial, dotaciones y elementos de protección certificados para Colombia.',
                    style: TextStyle(fontSize: 14, color: Colors.white70, height: 1.4),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. QUIÉNES SOMOS
                  _buildSectionCard(
                    context,
                    tag: 'NUESTRA HISTORIA',
                    title: '¿Quiénes somos?',
                    icon: Icons.business_outlined,
                    iconColor: const Color(0xFF0047AB),
                    content:
                        'Somos Tecnomatic MAV, una empresa colombiana con más de 5 años de experiencia en el suministro de dotaciones empresariales y elementos de protección industrial.\n\nNacimos con el propósito de vestir y proteger a los trabajadores de Colombia, garantizando calidad, comodidad y estricto cumplimiento normativo en cada pedido.',
                    highlight: 'Trabajamos con empresas de todos los sectores: construcción, salud, logística, manufactura y más.',
                  ),

                  const SizedBox(height: 20),

                  // 2. MISIÓN
                  _buildSectionCard(
                    context,
                    tag: 'PROPÓSITO',
                    title: 'Nuestra Misión',
                    icon: Icons.flag_outlined,
                    iconColor: const Color(0xFF20B2AA),
                    content:
                        'Somos una empresa comercializadora de uniformes y elementos de protección industrial, caracterizándonos por altos estándares de calidad, satisfaciendo las necesidades y expectativas de nuestros clientes.',
                    quote: '"Calidad, compromiso y protección en cada dotación que entregamos."',
                  ),

                  const SizedBox(height: 20),

                  // 3. VISIÓN
                  _buildSectionCard(
                    context,
                    tag: 'PROYECCIÓN',
                    title: 'Nuestra Visión',
                    icon: Icons.visibility_outlined,
                    iconColor: const Color(0xFFF59E0B),
                    content:
                        'Consolidarnos en el mercado nacional como una empresa líder en dotaciones y elementos de protección industrial, destacándonos por altos índices de calidad, innovación y puntualidad.',
                    quote: '"Ser líderes en dotaciones industriales, reconocidos por excelencia y confianza."',
                  ),

                  const SizedBox(height: 20),

                  // 4. PILARES / VALORES
                  const Text(
                    'Nuestros Valores',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0047AB),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildValorCard(
                          icon: Icons.verified_user_outlined,
                          title: 'Seguridad',
                          color: const Color(0xFF10B981),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildValorCard(
                          icon: Icons.star_outline_rounded,
                          title: 'Calidad',
                          color: const Color(0xFF0047AB),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildValorCard(
                          icon: Icons.handshake_outlined,
                          title: 'Compromiso',
                          color: const Color(0xFF20B2AA),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 30),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard(
    BuildContext context, {
    required String tag,
    required String title,
    required IconData icon,
    required Color iconColor,
    required String content,
    String? highlight,
    String? quote,
  }) {
    return Container(
      width: double.infinity,
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tag,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: iconColor,
                        letterSpacing: 1,
                      ),
                    ),
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            content,
            style: const TextStyle(
              fontSize: 13.5,
              color: Color(0xFF475569),
              height: 1.55,
            ),
          ),
          if (highlight != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Color(0xFF20B2AA), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      highlight,
                      style: const TextStyle(fontSize: 12.5, color: Color(0xFF334155), fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (quote != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.06),
                border: Border(left: BorderSide(color: iconColor, width: 4)),
                borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
              ),
              child: Text(
                quote,
                style: TextStyle(
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.w600,
                  color: iconColor,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildValorCard({
    required IconData icon,
    required String title,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: Color(0xFF1E293B),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
