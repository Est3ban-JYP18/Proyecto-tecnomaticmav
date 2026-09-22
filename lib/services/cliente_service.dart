import '../models/producto_model.dart';
import 'producto_service.dart';

/// Servicio de catálogo para el cliente conectado directamente a Supabase Cloud
class ClienteService {
  final ProductoService _productoService = ProductoService();

  // Obtener productos desde Supabase con filtro de categoría opcional
  Future<List<Producto>> obtenerProductos({String? categoria}) async {
    return await _productoService.getProductos(categoria: categoria);
  }

  // Obtener un producto por ID desde Supabase
  Future<Producto> obtenerProductoPorId(int id) async {
    return await _productoService.getProductoPorId(id);
  }

  // Obtener lista de categorías desde Supabase
  Future<List<String>> obtenerCategorias() async {
    return await _productoService.getCategorias();
  }
}