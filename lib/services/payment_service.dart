import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/network/api_client.dart';
import '../core/session/session_manager.dart';
import '../models/cart_item_model.dart';
import 'launcher/url_launcher_helper.dart';

class PaymentService {
  SupabaseClient get _supabase => Supabase.instance.client;

  // Crear preferencia y obtener init_point de Mercado Pago
  Future<Map<String, dynamic>?> crearPagoMercadoPago(List<CartItem> items) async {
    final url = Uri.parse('${ApiClient.baseUrl}/crear-pago');

    final payload = {
      'carrito': items.map((item) => {
        'idProductos': item.producto.id,
        'Nombre_Producto': item.producto.nombre,
        'Precio': item.producto.precio,
        'cantidad': item.cantidad,
      }).toList(),
    };

    try {
      final response = await http.post(
        url,
        headers: SessionManager().authHeaders,
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Map<String, dynamic>.from(data);
      }
    } catch (e) {
      debugPrint('Aviso Mercado Pago backend: $e');
    }

    return null;
  }

  // Registrar el pedido y la factura directamente en Supabase
  Future<int?> registrarPedidoBackend({
    required dynamic idUsuario,
    required double total,
    required List<CartItem> items,
    String metodoPago = 'Mercado Pago / PSE',
    Map<String, dynamic>? datosEnvio,
  }) async {
    try {
      int facturaId = 0;
      final parsedUserId = int.tryParse(idUsuario.toString()) ?? 1;

      // 1. Insertar en Facturas
      try {
        final facturaInsert = {
          'Usuarios_idUsuarios': parsedUserId,
          'Total': total,
          'Estado': 'Pagada',
          'Fecha': DateTime.now().toIso8601String(),
        };
        final res = await _supabase.from('Facturas').insert(facturaInsert).select().single();
        facturaId = int.tryParse((res['idFacturas'] ?? res['id'] ?? 0).toString()) ?? 0;
      } catch (e) {
        debugPrint('Fallback Facturas insert: $e');
        try {
          final facturaInsert = {
            'usuario_id': parsedUserId.toString(),
            'total': total,
            'estado': 'Pagada',
            'metodo_pago': metodoPago,
            'datos_envio': datosEnvio ?? {},
            'fecha': DateTime.now().toIso8601String(),
          };
          final res = await _supabase.from('facturas').insert(facturaInsert).select().single();
          facturaId = int.tryParse((res['id'] ?? 0).toString()) ?? 0;
        } catch (_) {}
      }

      if (facturaId == 0) return null;

      // 2. Insertar Detalle_Facturas
      try {
        final detalles = items.map((item) => {
          'Factura_idFactura': facturaId,
          'Productos_idProductos': item.producto.id,
          'Cantidad': item.cantidad,
          'Precio_Unitario': item.producto.precio,
        }).toList();
        await _supabase.from('Detalle_Facturas').insert(detalles);
      } catch (e) {
        debugPrint('Fallback Detalle_Facturas insert: $e');
        try {
          final detalles = items.map((item) => {
            'factura_id': facturaId,
            'producto_id': item.producto.id,
            'cantidad': item.cantidad,
            'precio_unitario': item.producto.precio,
            'talla': item.talla,
            'color': item.color,
          }).toList();
          await _supabase.from('detalle_facturas').insert(detalles);
        } catch (_) {}
      }

      // 3. Crear Entregas
      try {
        await _supabase.from('Entregas').insert({
          'Factura_idFactura': facturaId,
          'Usuarios_idUsuarios': parsedUserId,
          'Fecha_entrega': DateTime.now().add(const Duration(days: 3)).toIso8601String().split('T')[0],
          'Estado_Entrega': 'En Proceso',
          'Observaciones': 'Pedido recibido y registrado en bodega.',
        });
      } catch (e) {
        debugPrint('Fallback Entregas insert: $e');
        try {
          await _supabase.from('entregas').insert({
            'factura_id': facturaId,
            'usuario_id': parsedUserId.toString(),
            'estado_entrega': 'En Proceso',
            'observaciones': 'Pedido recibido y registrado en bodega.',
          });
        } catch (_) {}
      }

      // 4. Actualizar stock
      for (final item in items) {
        try {
          final nuevoStock = (item.producto.stock - item.cantidad).clamp(0, 99999);
          try {
            await _supabase.from('Stock').upsert({
              'Productos_idProductos': item.producto.id,
              'Cantidad_Actual': nuevoStock,
              'Ultima_Actualizacion': DateTime.now().toIso8601String(),
            });
          } catch (_) {
            await _supabase.from('stock').upsert({
              'producto_id': item.producto.id,
              'cantidad_actual': nuevoStock,
              'ultima_actualizacion': DateTime.now().toIso8601String(),
            });
          }
        } catch (_) {}
      }

      return facturaId;
    } catch (e) {
      debugPrint('Error registrando pedido en Supabase: $e');
      return null;
    }
  }

  // Abre la pasarela oficial de Mercado Pago
  Future<bool> abrirPasarelaMercadoPago(String urlString) async {
    try {
      return await PlatformUrlLauncher.openUrl(urlString);
    } catch (e) {
      debugPrint('Error abriendo pasarela de pago: $e');
      return false;
    }
  }
}