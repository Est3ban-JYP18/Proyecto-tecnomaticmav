import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/devolucion_model.dart';
import '../models/pedido_model.dart';
import '../models/usuario_model.dart';

class AdminService {
  SupabaseClient get _supabase => Supabase.instance.client;

  // ============================================================
  // GESTIÓN DE USUARIOS
  // ============================================================

  Future<List<Usuario>> getUsuarios() async {
    try {
      final List<dynamic> data = await _supabase
          .from('Usuarios')
          .select('*')
          .order('idUsuarios', ascending: false);

      return data.map((item) => Usuario.fromJson(Map<String, dynamic>.from(item as Map))).toList();
    } catch (e) {
      throw Exception('Error al obtener usuarios desde Supabase: $e');
    }
  }

  Future<bool> crearUsuario({
    required String nombres,
    required String apellidos,
    required String correo,
    required String contrasena,
    required int rol,
  }) async {
    try {
      await _supabase.from('Usuarios').insert({
        'Nombres': nombres.trim(),
        'Apellidos': apellidos.trim(),
        'Correo': correo.trim().toLowerCase(),
        'Contrasena': contrasena,
        'Roles_idRoles': rol,
      });
      return true;
    } catch (e) {
      throw Exception('Error al crear usuario en Supabase: $e');
    }
  }

  Future<bool> actualizarUsuario(
    dynamic id, {
    required String nombres,
    required String apellidos,
    required String correo,
    String? contrasena,
    required int rol,
  }) async {
    try {
      final parsedId = int.tryParse(id.toString()) ?? id;
      final updateData = {
        'Nombres': nombres.trim(),
        'Apellidos': apellidos.trim(),
        'Correo': correo.trim().toLowerCase(),
        'Roles_idRoles': rol,
        if (contrasena != null && contrasena.isNotEmpty) 'Contrasena': contrasena,
      };
      await _supabase.from('Usuarios').update(updateData).eq('idUsuarios', parsedId);
      return true;
    } catch (e) {
      throw Exception('Error al actualizar usuario en Supabase: $e');
    }
  }

  Future<bool> eliminarUsuario(dynamic id) async {
    try {
      final parsedId = int.tryParse(id.toString()) ?? id;
      await _supabase.from('Usuarios').delete().eq('idUsuarios', parsedId);
      return true;
    } catch (e) {
      throw Exception('Error al eliminar usuario en Supabase: $e');
    }
  }

  // ============================================================
  // GESTIÓN DE PEDIDOS Y FACTURACIÓN
  // ============================================================

  Future<List<PedidoModel>> getPedidos() async {
    try {
      List<dynamic> data = [];
      try {
        data = await _supabase.from('Facturas').select('*').order('idFacturas', ascending: false);
      } catch (_) {
        data = await _supabase.from('facturas').select('*').order('id', ascending: false);
      }

      return data.map((item) => PedidoModel.fromJson(Map<String, dynamic>.from(item as Map))).toList();
    } catch (e) {
      throw Exception('Error al sincronizar pedidos con Supabase: $e');
    }
  }

  Future<bool> actualizarEstadoPedido(int idFactura, String nuevoEstado) async {
    try {
      try {
        await _supabase.from('Facturas').update({'Estado': nuevoEstado}).eq('idFacturas', idFactura);
      } catch (_) {
        await _supabase.from('facturas').update({'estado': nuevoEstado}).eq('id', idFactura);
      }
      return true;
    } catch (e) {
      throw Exception('Error al actualizar estado del pedido en Supabase: $e');
    }
  }

  Future<bool> eliminarPedido(int idFactura) async {
    try {
      try {
        await _supabase.from('Detalle_Facturas').delete().eq('Factura_idFactura', idFactura);
      } catch (_) {}
      try {
        await _supabase.from('Entregas').delete().eq('Factura_idFactura', idFactura);
      } catch (_) {}
      try {
        await _supabase.from('Devoluciones').delete().eq('Facturas_idFacturas', idFactura);
      } catch (_) {}

      try {
        await _supabase.from('Facturas').delete().eq('idFacturas', idFactura);
      } catch (_) {
        await _supabase.from('facturas').delete().eq('id', idFactura);
      }

      return true;
    } catch (e) {
      throw Exception('Error al eliminar pedido en Supabase: $e');
    }
  }

  // ============================================================
  // GESTIÓN DE DEVOLUCIONES
  // ============================================================

  Future<List<DevolucionModel>> getDevoluciones() async {
    try {
      List<dynamic> data = [];
      try {
        data = await _supabase.from('Devoluciones').select('*').order('idDevoluciones', ascending: false);
      } catch (_) {
        data = await _supabase.from('devoluciones').select('*').order('id', ascending: false);
      }

      return data.map((item) => DevolucionModel.fromJson(Map<String, dynamic>.from(item as Map))).toList();
    } catch (e) {
      throw Exception('Error al sincronizar devoluciones con Supabase: $e');
    }
  }

  Future<bool> aprobarDevolucion(int id, {String? comentarios, String? cupon}) async {
    try {
      try {
        await _supabase.from('Devoluciones').update({
          'Estado': 'Aprobada',
          'Estado_Tracking': 'Aprobada',
          'Comentarios_Admin': comentarios ?? 'Aprobada por administración',
          'Codigo_Cupon': cupon ?? 'CUPON-DEV-$id',
        }).eq('idDevoluciones', id);
      } catch (_) {
        await _supabase.from('devoluciones').update({
          'estado': 'Aprobada',
          'estado_tracking': 'Aprobada',
          'comentarios_admin': comentarios ?? 'Aprobada por administración',
          'codigo_cupon': cupon ?? 'CUPON-DEV-$id',
        }).eq('id', id);
      }

      return true;
    } catch (e) {
      throw Exception('Error al aprobar devolución en Supabase: $e');
    }
  }

  Future<bool> rechazarDevolucion(int id, {String? comentarios}) async {
    try {
      try {
        await _supabase.from('Devoluciones').update({
          'Estado': 'Rechazada',
          'Estado_Tracking': 'Rechazada',
          'Comentarios_Admin': comentarios ?? 'Rechazada por administración',
        }).eq('idDevoluciones', id);
      } catch (_) {
        await _supabase.from('devoluciones').update({
          'estado': 'Rechazada',
          'estado_tracking': 'Rechazada',
          'comentarios_admin': comentarios ?? 'Rechazada por administración',
        }).eq('id', id);
      }

      return true;
    } catch (e) {
      throw Exception('Error al rechazar devolución en Supabase: $e');
    }
  }
}
