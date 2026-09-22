class Producto {
  final int id;
  final String nombre;
  final String tipo;
  final String descripcion;
  final double precio;
  final String? imagen;
  final String categoria;
  final int categoriaId;
  final String estado;
  final int stock;

  Producto({
    required this.id,
    required this.nombre,
    required this.tipo,
    required this.descripcion,
    required this.precio,
    this.imagen,
    required this.categoria,
    this.categoriaId = 1,
    this.estado = 'Activo',
    required this.stock,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    // Resolver nombre de categoría
    String catNombre = json['Categoria']?.toString() ??
        json['categoria']?.toString() ??
        json['categorias']?['nombre']?.toString() ??
        '';

    // Resolver stock desde tabla stock o campo directo
    int resolvedStock = 0;
    if (json['stock'] is Map) {
      resolvedStock = int.tryParse(json['stock']['cantidad_actual']?.toString() ?? '0') ?? 0;
    } else if (json['public_stock'] is Map) {
      resolvedStock = int.tryParse(json['public_stock']['cantidad_actual']?.toString() ?? '0') ?? 0;
    } else {
      resolvedStock = int.tryParse((json['cantidad_actual'] ?? json['Stock'] ?? json['stock'] ?? json['Cantidad_Actual'] ?? 0).toString()) ?? 0;
    }

    return Producto(
      id: int.tryParse((json['id'] ?? json['idProductos'] ?? json['idProducto'] ?? 0).toString()) ?? 0,
      nombre: json['nombre_producto']?.toString() ?? json['Nombre_Producto']?.toString() ?? json['nombre']?.toString() ?? 'Producto',
      tipo: json['tipo']?.toString() ?? json['Tipo']?.toString() ?? 'General',
      descripcion: json['descripcion']?.toString() ?? json['Descripcion']?.toString() ?? '',
      precio: double.tryParse((json['precio'] ?? json['Precio'] ?? 0).toString()) ?? 0.0,
      imagen: json['imagen']?.toString() ?? json['Imagen']?.toString(),
      categoria: catNombre.isNotEmpty ? catNombre : 'Protección Industrial',
      categoriaId: int.tryParse((json['categoria_id'] ?? json['Categoria_producto_idCategoria'] ?? json['categoriaId'] ?? 1).toString()) ?? 1,
      estado: json['estado']?.toString() ?? json['Estado']?.toString() ?? 'Activo',
      stock: resolvedStock,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id > 0) 'id': id,
      'nombre_producto': nombre,
      'tipo': tipo,
      'descripcion': descripcion,
      'precio': precio,
      'imagen': imagen,
      'estado': estado,
      'categoria_id': categoriaId,
    };
  }

  Producto copyWith({
    int? id,
    String? nombre,
    String? tipo,
    String? descripcion,
    double? precio,
    String? imagen,
    String? categoria,
    int? categoriaId,
    String? estado,
    int? stock,
  }) {
    return Producto(
      id: id ?? this.id,
      nombre: nombre ?? this.nombre,
      tipo: tipo ?? this.tipo,
      descripcion: descripcion ?? this.descripcion,
      precio: precio ?? this.precio,
      imagen: imagen ?? this.imagen,
      categoria: categoria ?? this.categoria,
      categoriaId: categoriaId ?? this.categoriaId,
      estado: estado ?? this.estado,
      stock: stock ?? this.stock,
    );
  }
}