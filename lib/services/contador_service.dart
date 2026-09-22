import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/pedido_model.dart';

class ContadorService {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<Map<dynamic, Map<String, dynamic>>> _getUsersMap() async {
    final Map<dynamic, Map<String, dynamic>> userMap = {};
    try {
      final List<dynamic> users = await _supabase.from('Usuarios').select('*');
      for (final u in users) {
        final map = Map<String, dynamic>.from(u as Map);
        final id = map['idUsuarios'] ?? map['id'];
        if (id != null) userMap[id] = map;
      }
    } catch (_) {}
    return userMap;
  }

  Future<Map<String, dynamic>> getReportesFinancieros() async {
    try {
      List<dynamic> data = [];
      try {
        data = await _supabase.from('Facturas').select('*').order('idFacturas', ascending: false);
      } catch (_) {
        data = await _supabase.from('facturas').select('*').order('id', ascending: false);
      }

      final users = await _getUsersMap();

      final pedidos = data.map((item) {
        final map = Map<String, dynamic>.from(item as Map);
        final uid = map['Usuarios_idUsuarios'] ?? map['usuario_id'];
        if (uid != null && users.containsKey(uid)) {
          final u = users[uid]!;
          map['Nombres'] = u['Nombres'] ?? u['nombres'];
          map['Apellidos'] = u['Apellidos'] ?? u['apellidos'];
          map['Correo'] = u['Correo'] ?? u['correo'];
          map['Telefono'] = u['Telefono'] ?? u['telefono'];
        }
        return PedidoModel.fromJson(map);
      }).toList();

      double totalIngresos = 0.0;
      int pagadas = 0;
      int pendientes = 0;
      int canceladas = 0;

      for (final p in pedidos) {
        final est = p.estado.toLowerCase();
        if (est == 'pagada' || est == 'entregado' || est == 'entregada' || est == 'enviado') {
          totalIngresos += p.total;
          pagadas++;
        } else if (est == 'pendiente' || est == 'preparando' || est == 'en proceso') {
          pendientes++;
        } else if (est == 'cancelada' || est == 'cancelado') {
          canceladas++;
        }
      }

      return {
        'totalIngresos': totalIngresos,
        'totalFacturas': pedidos.length,
        'pagadas': pagadas,
        'pendientes': pendientes,
        'canceladas': canceladas,
        'facturas': pedidos,
      };
    } catch (e) {
      throw Exception('Error al obtener reporte financiero desde Supabase: $e');
    }
  }

  /// Obtiene los recibos de compra directamente desde Supabase para el perfil del contador
  Future<List<PedidoModel>> getRecibosContador() async {
    try {
      List<dynamic> list = [];
      try {
        list = await _supabase.from('Facturas').select('*').order('idFacturas', ascending: false);
      } catch (_) {
        list = await _supabase.from('facturas').select('*').order('id', ascending: false);
      }

      final users = await _getUsersMap();

      return list.map((item) {
        final map = Map<String, dynamic>.from(item as Map);
        final uid = map['Usuarios_idUsuarios'] ?? map['usuario_id'];
        if (uid != null && users.containsKey(uid)) {
          final u = users[uid]!;
          map['Nombres'] = u['Nombres'] ?? u['nombres'];
          map['Apellidos'] = u['Apellidos'] ?? u['apellidos'];
          map['Correo'] = u['Correo'] ?? u['correo'];
          map['Telefono'] = u['Telefono'] ?? u['telefono'];
        }
        return PedidoModel.fromJson(map);
      }).toList();
    } catch (e) {
      throw Exception('Error al cargar recibos de compra desde Supabase: $e');
    }
  }

  /// Actualiza el estado de un recibo desde el perfil del contador
  Future<bool> actualizarEstadoRecibo(int idFactura, String nuevoEstado) async {
    try {
      try {
        await _supabase.from('Facturas').update({'Estado': nuevoEstado}).eq('idFacturas', idFactura);
      } catch (_) {
        await _supabase.from('facturas').update({'estado': nuevoEstado}).eq('id', idFactura);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Obtiene los detalles específicos de un recibo (ítems comprados)
  Future<List<PedidoDetalleItem>> getDetalleRecibo(int idFactura) async {
    try {
      List<dynamic> list = [];
      try {
        list = await _supabase
            .from('Detalle_Facturas')
            .select('*')
            .eq('Factura_idFactura', idFactura);
      } catch (_) {
        try {
          list = await _supabase
              .from('Detalle_Facturas')
              .select('*')
              .eq('Facturas_idFacturas', idFactura);
        } catch (_) {
          list = await _supabase
              .from('detalle_facturas')
              .select('*')
              .eq('factura_id', idFactura);
        }
      }

      final Map<dynamic, Map<String, dynamic>> prodMap = {};
      try {
        final List<dynamic> prods = await _supabase.from('Productos').select('*');
        for (final p in prods) {
          final map = Map<String, dynamic>.from(p as Map);
          final id = map['idProductos'] ?? map['id'];
          if (id != null) prodMap[id] = map;
        }
      } catch (_) {}

      final List<PedidoDetalleItem> items = [];
      for (final raw in list) {
        final map = Map<String, dynamic>.from(raw as Map);
        final prodId = map['Productos_idProductos'] ?? map['producto_id'];
        if (prodId != null && prodMap.containsKey(prodId)) {
          final p = prodMap[prodId]!;
          map['Nombre_Producto'] ??= p['Nombre_Producto'] ?? p['nombre_producto'];
          map['Imagen'] ??= p['Imagen'] ?? p['imagen'];
        }
        items.add(PedidoDetalleItem.fromJson(map));
      }

      return items;
    } catch (_) {
      return [];
    }
  }
}
