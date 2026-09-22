class DevolucionModel {
  final int id;
  final int facturaId;
  final String cliente;
  final String producto;
  final int cantidad;
  final String motivo;
  final String estado;
  final String fecha;
  final String? comentariosAdmin;
  final String? codigoCupon;
  final String estadoTracking;
  final String? motivoCategoria;

  DevolucionModel({
    required this.id,
    required this.facturaId,
    required this.cliente,
    required this.producto,
    required this.cantidad,
    required this.motivo,
    required this.estado,
    required this.fecha,
    this.comentariosAdmin,
    this.codigoCupon,
    this.estadoTracking = 'Solicitada',
    this.motivoCategoria,
  });

  factory DevolucionModel.fromJson(Map<String, dynamic> json) {
    // Resolver nombre del cliente
    String clienteNombre = json['cliente']?.toString() ?? '';
    if (clienteNombre.isEmpty && json['usuarios'] is Map) {
      final u = json['usuarios'] as Map;
      final nom = u['nombres']?.toString() ?? '';
      final ape = u['apellidos']?.toString() ?? '';
      clienteNombre = '$nom $ape'.trim();
    } else if (clienteNombre.isEmpty && json['Nombres'] != null) {
      final nombres = json['Nombres']?.toString() ?? '';
      final apellidos = json['Apellidos']?.toString() ?? '';
      clienteNombre = '$nombres $apellidos'.trim();
    }

    // Resolver nombre del producto
    String prodNombre = json['producto']?.toString() ?? json['Nombre_Producto']?.toString() ?? '';
    if (prodNombre.isEmpty && json['productos'] is Map) {
      prodNombre = json['productos']['nombre_producto']?.toString() ?? '';
    }

    return DevolucionModel(
      id: int.tryParse((json['id'] ?? json['idDevoluciones'] ?? 0).toString()) ?? 0,
      facturaId: int.tryParse((json['factura_id'] ?? json['Facturas_idFacturas'] ?? json['facturaId'] ?? 0).toString()) ?? 0,
      cliente: clienteNombre.isNotEmpty ? clienteNombre : 'Cliente Registrado',
      producto: prodNombre.isNotEmpty ? prodNombre : 'Producto #${json['producto_id'] ?? ""}',
      cantidad: int.tryParse((json['cantidad'] ?? json['Cantidad'] ?? 1).toString()) ?? 1,
      motivo: json['motivo']?.toString() ?? json['Motivo']?.toString() ?? 'Sin motivo especificado',
      estado: json['estado']?.toString() ?? json['Estado']?.toString() ?? 'Pendiente',
      fecha: json['fecha']?.toString() ?? json['Fecha']?.toString() ?? json['created_at']?.toString() ?? '',
      comentariosAdmin: json['comentarios_admin']?.toString() ?? json['Comentarios_Admin']?.toString(),
      codigoCupon: json['codigo_cupon']?.toString() ?? json['Codigo_Cupon']?.toString(),
      estadoTracking: json['estado_tracking']?.toString() ?? json['Estado_Tracking']?.toString() ?? 'Solicitada',
      motivoCategoria: json['motivo_categoria']?.toString() ?? json['Motivo_Categoria']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'factura_id': facturaId,
      'cliente': cliente,
      'producto': producto,
      'cantidad': cantidad,
      'motivo': motivo,
      'estado': estado,
      'fecha': fecha,
      'comentarios_admin': comentariosAdmin,
      'codigo_cupon': codigoCupon,
      'estado_tracking': estadoTracking,
      'motivo_categoria': motivoCategoria,
    };
  }
}
