import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

/// Servicio centralizado para gestionar y solicitar permisos del dispositivo
class PermissionService {
  /// Solicitar permiso de Cámara
  static Future<bool> solicitarCamara(BuildContext context) async {
    final status = await Permission.camera.request();
    if (status.isGranted) return true;

    if (status.isPermanentlyDenied && context.mounted) {
      _mostrarDialogoAjustes(
        context,
        titulo: 'Permiso de Cámara Requerido',
        mensaje: 'La aplicación necesita acceso a la cámara para tomar fotos de evidencias y productos. Por favor actívalo en los ajustes de tu teléfono.',
      );
    }
    return false;
  }

  /// Solicitar permiso de Almacenamiento / Galería / Fotos
  static Future<bool> solicitarAlmacenamiento(BuildContext context) async {
    // En Android 13+ se usa photos/media, en versiones anteriores storage
    PermissionStatus status;
    if (await Permission.photos.isRestricted || await Permission.photos.isDenied) {
      status = await Permission.photos.request();
    } else {
      status = await Permission.storage.request();
    }

    if (status.isGranted || status.isLimited) return true;

    if (status.isPermanentlyDenied && context.mounted) {
      _mostrarDialogoAjustes(
        context,
        titulo: 'Permiso de Almacenamiento Requerido',
        mensaje: 'La aplicación necesita acceso a tus archivos y galería para subir fotos o comprobantes de pago. Por favor actívalo en los ajustes.',
      );
    }
    return false;
  }

  /// Solicitar permiso de Ubicación
  static Future<bool> solicitarUbicacion(BuildContext context) async {
    final status = await Permission.location.request();
    if (status.isGranted) return true;

    if (status.isPermanentlyDenied && context.mounted) {
      _mostrarDialogoAjustes(
        context,
        titulo: 'Permiso de Ubicación Requerido',
        mensaje: 'La aplicación necesita conocer tu ubicación para calcular los envíos y entregas con precisión. Por favor actívalo en ajustes.',
      );
    }
    return false;
  }

  /// Solicitar todos los permisos principales de forma inicial
  static Future<Map<Permission, PermissionStatus>> solicitarTodosLosPermisos() async {
    return await [
      Permission.camera,
      Permission.photos,
      Permission.storage,
      Permission.location,
    ].request();
  }

  static void _mostrarDialogoAjustes(
    BuildContext context, {
    required String titulo,
    required String mensaje,
  }) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.settings_suggest, color: Color(0xFF1E3A8A)),
            const SizedBox(width: 8),
            Expanded(child: Text(titulo, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
          ],
        ),
        content: Text(mensaje),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1E3A8A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              openAppSettings();
            },
            child: const Text('Abrir Ajustes', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
