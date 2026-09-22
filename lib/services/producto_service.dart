import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/producto_model.dart';

class ProductoService {
  SupabaseClient get _supabase => Supabase.instance.client;

  // Obtiene mapeo de categorías {id -> nombre}
  Future<Map<int, String>> _getCategoriasMap() async {
    try {
      final List<dynamic> data = await _supabase
          .from('Categoria_productos')
          .select('idCategorias, nombre');
      final Map<int, String> map = {};
      for (final raw in data) {
        final item = Map<String, dynamic>.from(raw as Map);
        final id = int.tryParse((item['idCategorias'] ?? item['id'] ?? 0).toString());
        final nombre = item['nombre']?.toString();
        if (id != null && nombre != null) {
          map[id] = nombre;
        }
      }
      return map;
    } catch (_) {
      return {
        1: 'Cascos',
        2: 'Guantes',
        3: 'Botas',
        4: 'Chalecos',
        5: 'Camisas',
        6: 'Pantalones',
      };
    }
  }

  // Obtiene mapeo de stock {idProducto -> cantidad}
  Future<Map<int, int>> _getStockMap() async {
    try {
      final List<dynamic> data = await _supabase
          .from('Stock')
          .select('Productos_idProductos, Cantidad_Actual');
      final Map<int, int> map = {};
      for (final raw in data) {
        final item = Map<String, dynamic>.from(raw as Map);
        final id = int.tryParse((item['Productos_idProductos'] ?? item['id'] ?? 0).toString());
        final stock = int.tryParse((item['Cantidad_Actual'] ?? item['stock'] ?? 0).toString()) ?? 0;
        if (id != null) {
          map[id] = stock;
        }
      }
      return map;
    } catch (_) {
      return {};
    }
  }

  // Obtener lista de categorías para los filtros UI
  Future<List<String>> getCategorias() async {
    try {
      final catMap = await _getCategoriasMap();
      final list = catMap.values.toList();
      return ['Todos', ...list];
    } catch (_) {
      return ['Todos', 'Cascos', 'Guantes', 'Botas', 'Chalecos', 'Camisas', 'Pantalones'];
    }
  }

  // Obtener catálogo completo de productos desde Supabase con enriquecimiento
  Future<List<Producto>> getProductos({String? categoria}) async {
    try {
      List<dynamic> data = [];

      try {
        data = await _supabase.from('Productos').select('*').order('idProductos');
      } catch (_) {
        try {
          data = await _supabase.from('vista_productos').select('*');
        } catch (_) {
          data = await _supabase.from('productos').select('*');
        }
      }

      final catMap = await _getCategoriasMap();
      final stockMap = await _getStockMap();

      List<Producto> lista = data.map((json) {
        final map = Map<String, dynamic>.from(json as Map);
        final catId = int.tryParse((map['Categoria_producto_idCategoria'] ?? map['categoria_id'] ?? 1).toString()) ?? 1;
        final prodId = int.tryParse((map['idProductos'] ?? map['id'] ?? 0).toString()) ?? 0;

        if (catMap.containsKey(catId)) {
          map['Categoria'] = catMap[catId];
        }
        if (stockMap.containsKey(prodId)) {
          map['Cantidad_Actual'] = stockMap[prodId];
        }

        return Producto.fromJson(map);
      }).toList();

      if (categoria != null &&
          categoria.isNotEmpty &&
          categoria != 'Todas' &&
          categoria != 'Todos') {
        final catFiltro = categoria.trim().toLowerCase();

        lista = lista.where((p) {
          final pCat = p.categoria.toLowerCase();
          final pTipo = p.tipo.toLowerCase();
          final pNombre = p.nombre.toLowerCase();

          // Coincidencia directa por nombre de categoría
          if (pCat == catFiltro) return true;

          // Filtros semánticos para Protección de Cabeza / Cascos
          if (catFiltro.contains('cabeza') || catFiltro == 'cascos') {
            return p.categoriaId == 1 || pCat.contains('casco') || pTipo.contains('cabeza') || pNombre.contains('casco');
          }

          // Filtros semánticos para Protección de Manos / Guantes
          if (catFiltro.contains('manos') || catFiltro == 'guantes') {
            return p.categoriaId == 2 || pCat.contains('guante') || pTipo.contains('manos') || pNombre.contains('guante');
          }

          // Filtros semánticos para Protección de Pies / Botas / Calzado
          if (catFiltro.contains('pies') || catFiltro == 'botas' || catFiltro.contains('calzado')) {
            return p.categoriaId == 3 || pCat.contains('bota') || pTipo.contains('calzado') || pTipo.contains('pie') || pNombre.contains('bota');
          }

          // Filtros semánticos para Protección Corporal / Ropa / Chalecos / Camisas / Pantalones
          if (catFiltro.contains('corporal') || catFiltro.contains('textil') || catFiltro.contains('ropa')) {
            return p.categoriaId == 4 || p.categoriaId == 5 || p.categoriaId == 6 ||
                pTipo.contains('textil') || pTipo.contains('reflectiv') || pTipo.contains('corporal');
          }

          if (catFiltro == 'chalecos') return p.categoriaId == 4 || pNombre.contains('chaleco');
          if (catFiltro == 'camisas') return p.categoriaId == 5 || pNombre.contains('camisa');
          if (catFiltro == 'pantalones') return p.categoriaId == 6 || pNombre.contains('pantalón') || pNombre.contains('pantalon');

          return pCat.contains(catFiltro) || pTipo.contains(catFiltro) || pNombre.contains(catFiltro);
        }).toList();
      }

      return lista;
    } catch (e) {
      throw Exception('Error al cargar productos desde Supabase: $e');
    }
  }

  // Obtener producto individual por ID
  Future<Producto> getProductoPorId(int id) async {
    try {
      Map<String, dynamic>? data;
      try {
        data = await _supabase
            .from('Productos')
            .select('*')
            .eq('idProductos', id)
            .maybeSingle();
      } catch (_) {
        data = await _supabase
            .from('productos')
            .select('*')
            .eq('id', id)
            .maybeSingle();
      }

      if (data == null) {
        throw Exception('Producto no encontrado');
      }

      final map = Map<String, dynamic>.from(data);
      final catId = int.tryParse((map['Categoria_producto_idCategoria'] ?? map['categoria_id'] ?? 1).toString()) ?? 1;
      final catMap = await _getCategoriasMap();
      if (catMap.containsKey(catId)) {
        map['Categoria'] = catMap[catId];
      }

      final stockMap = await _getStockMap();
      if (stockMap.containsKey(id)) {
        map['Cantidad_Actual'] = stockMap[id];
      }

      return Producto.fromJson(map);
    } catch (e) {
      throw Exception('Error al obtener producto desde Supabase: $e');
    }
  }

  // Crear nuevo producto en Supabase
  Future<Map<String, dynamic>> crearProducto(Producto producto) async {
    try {
      Map<String, dynamic>? res;
      int prodId = 0;

      try {
        final insertData = {
          'Nombre_Producto': producto.nombre,
          'Tipo': producto.tipo,
          'Descripcion': producto.descripcion,
          'Precio': producto.precio,
          'Imagen': ?producto.imagen,
          'Categoria_producto_idCategoria': producto.categoriaId,
          'Estado': producto.estado,
        };
        res = await _supabase.from('Productos').insert(insertData).select().single();
        prodId = int.tryParse((res['idProductos'] ?? res['id'] ?? 0).toString()) ?? 0;
      } catch (_) {
        final insertData = {
          'nombre_producto': producto.nombre,
          'tipo': producto.tipo,
          'descripcion': producto.descripcion,
          'precio': producto.precio,
          'imagen': ?producto.imagen,
          'categoria_id': producto.categoriaId,
          'estado': producto.estado,
        };
        res = await _supabase.from('productos').insert(insertData).select().single();
        prodId = int.tryParse((res['id'] ?? 0).toString()) ?? 0;
      }

      // Actualizar o crear stock
      try {
        await _supabase.from('Stock').upsert({
          'Productos_idProductos': prodId,
          'Cantidad_Actual': producto.stock,
          'Ultima_Actualizacion': DateTime.now().toIso8601String(),
        });
      } catch (_) {
        try {
          await _supabase.from('stock').upsert({
            'producto_id': prodId,
            'cantidad_actual': producto.stock,
            'ultima_actualizacion': DateTime.now().toIso8601String(),
          });
        } catch (_) {}
      }

      return {
        'ok': true,
        'id': prodId,
        'producto': res,
      };
    } catch (e) {
      throw Exception('Error al crear producto en Supabase: $e');
    }
  }

  // Actualizar producto en Supabase
  Future<Map<String, dynamic>> actualizarProducto(Producto producto) async {
    try {
      Map<String, dynamic>? res;

      try {
        final updateData = {
          'Nombre_Producto': producto.nombre,
          'Tipo': producto.tipo,
          'Descripcion': producto.descripcion,
          'Precio': producto.precio,
          'Imagen': ?producto.imagen,
          'Categoria_producto_idCategoria': producto.categoriaId,
          'Estado': producto.estado,
        };
        res = await _supabase
            .from('Productos')
            .update(updateData)
            .eq('idProductos', producto.id)
            .select()
            .single();
      } catch (_) {
        final updateData = {
          'nombre_producto': producto.nombre,
          'tipo': producto.tipo,
          'descripcion': producto.descripcion,
          'precio': producto.precio,
          'imagen': ?producto.imagen,
          'categoria_id': producto.categoriaId,
          'estado': producto.estado,
        };
        res = await _supabase
            .from('productos')
            .update(updateData)
            .eq('id', producto.id)
            .select()
            .single();
      }

      // Actualizar stock
      try {
        await _supabase.from('Stock').upsert({
          'Productos_idProductos': producto.id,
          'Cantidad_Actual': producto.stock,
          'Ultima_Actualizacion': DateTime.now().toIso8601String(),
        });
      } catch (_) {
        try {
          await _supabase.from('stock').upsert({
            'producto_id': producto.id,
            'cantidad_actual': producto.stock,
            'ultima_actualizacion': DateTime.now().toIso8601String(),
          });
        } catch (_) {}
      }

      return {
        'ok': true,
        'producto': res,
      };
    } catch (e) {
      throw Exception('Error al actualizar producto en Supabase: $e');
    }
  }

  // Eliminar producto de Supabase
  Future<bool> eliminarProducto(int id) async {
    try {
      try {
        await _supabase.from('Stock').delete().eq('Productos_idProductos', id);
      } catch (_) {
        try {
          await _supabase.from('stock').delete().eq('producto_id', id);
        } catch (_) {}
      }

      try {
        await _supabase.from('Productos').delete().eq('idProductos', id);
      } catch (_) {
        await _supabase.from('productos').delete().eq('id', id);
      }

      return true;
    } catch (e) {
      throw Exception('Error al eliminar producto en Supabase: $e');
    }
  }
}
